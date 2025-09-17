const catchAsync = require("../utils/catchAsync");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const WorkshopRegistration = require("../models/WorkshopRegistration");
const AppError = require("../utils/appError");

exports.makePayment = catchAsync(async (req, res, next) => {
  const { amount, currency, id } = req.body;

  const options = {
    amount: amount * 100,
    currency: currency || "INR",
    payment_capture: 1,
  };

  const order = await razorpay.orders.create(options);

  if (!order) {
    return next(new AppError("Issue while creating the order", 401));
  }

  // ✅ Update registration with new amount
  await WorkshopRegistration.findByIdAndUpdate(
    id,
    {
      paymentInfo: { amount },
    },
    { new: true } // <-- return the updated document
  );

  res.status(200).json({
    success: true,
    order,
  });
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    registrationId,
  } = req.body;

  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === razorpay_signature) {
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    console.log("payment:", payment);

    // ✅ Update DB to "paid"
    await WorkshopRegistration.findByIdAndUpdate(
      registrationId,
      {
        status: "paid",
        $set: {
          "paymentInfo.paymentId": razorpay_payment_id,
          "paymentInfo.orderId": razorpay_order_id,
          "paymentInfo.signature": razorpay_signature,
          "paymentInfo.method": payment?.method,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      status: "paid",
      message: "Payment verified successfully",
    });
  } else {
    // ❌ Update DB to "failed"
    await WorkshopRegistration.findByIdAndUpdate(registrationId, {
      status: "failed",
    });

    return next(new AppError("Payment verification failed", 401));
  }
});

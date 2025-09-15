const WorkshopRegistration = require("../models/WorkshopRegistration");

exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const crypto = require("crypto");
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;

    if (event === "payment_link.paid") {
      const payment = req.body.payload.payment.entity;
      const paymentLink = req.body.payload.payment_link.entity; // ✅ correct source

      // 🔹 Extract your refId from Razorpay notes
      const refId = payment.notes?.refId;

      if (refId) {
        await WorkshopRegistration.findByIdAndUpdate(refId, {
          status: "paid",
          paymentInfo: {
            paymentId: payment.id,
            paymentLinkId: paymentLink.id, // ✅ correct value
            amount: payment.amount,
            method: payment.method,
          },
        });
      }
    }

    res.redirect(`${process.env.FRONT_END_URL}/payment/success`);
} catch (err) {
    console.error(err);
    res.redirect(`${process.env.FRONT_END_URL}/payment/failure`);
  }
};

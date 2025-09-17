const { default: axios } = require("axios");
const Otp = require("../models/Otp");
const WorkshopRegistration = require("../models/WorkshopRegistration");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const {
  getGenerativeAiWorkshopRegistrationEmailTemplate,
} = require("../utils/emailTemplate");
const { resend } = require("../utils/resend");

exports.registerWorkshop = catchAsync(async (req, res, next) => {
  const {
    fullName,
    dateOfBirth,
    gender,
    email,
    mobileNumber,
    collegeName,
    branch,
    year,
    universityRollNo,
    type,
  } = req.body;

  if (
    !fullName ||
    !dateOfBirth ||
    !gender ||
    !email ||
    !mobileNumber ||
    !collegeName ||
    !branch ||
    !year ||
    !universityRollNo ||
    !type
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // extra validation (optional - though Mongoose handles enum)
  if (![1, 2, 3, 4].includes(Number(year))) {
    return res.status(400).json({ message: "Year must be 1, 2, 3, or 4" });
  }

  const existing = await WorkshopRegistration.findOne({
    $or: [
      { $and: [{ email }, { type }] },
      { $and: [{ mobileNumber }, { type }] },
    ],
  });

  console.log("existing", existing);

  if (existing) {
    return next(
      new AppError(
        existing.email === email
          ? "Email is already registered"
          : "Mobile number is already registered",
        400
      )
    );
  }

  const registration = await WorkshopRegistration.create({
    fullName,
    dateOfBirth,
    gender,
    email,
    mobileNumber,
    collegeName,
    branch,
    year,
    universityRollNo,
    type,
  });

  const htmlContent = getGenerativeAiWorkshopRegistrationEmailTemplate({
    fullName,
    email,
  });

  try {
    await resend.emails.send({
      from: "Codintern <no-reply@codintern.com>",
      to: email,
      subject: "🎉 Your Registration is Confirmed - Generative AI Workshop",
      html: htmlContent,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send confirmation email",
      error: error?.message || "Unknown error",
    });
  }

  res.status(201).json({
    success: true,
    registration,
  });
});

exports.sendOtp = catchAsync(async (req, res, next) => {
  const { mobileNumber, type = "general" } = req.body;

  if (!mobileNumber) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  // 1. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // 2. Expiry (5 min)
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // 3. Remove old OTPs for same number + type (optional cleanup)
  await Otp.deleteMany({ phone: mobileNumber, type });

  // 4. Save OTP in DB
  const registration = await Otp.create({
    phone: mobileNumber,
    otp,
    otpExpiresAt,
    type,
  });

  // 5. Send OTP via SMS (placeholder)

  const apiUrl = `https://manage.txly.in/vb/apikey.php?apikey=VZmZRZjXXsysZAAx&senderid=CODTRN&templateid=1707175809237902265&number=${mobileNumber}&message= Your One Time Password (OTP) for CodIntern is: ${otp} It is valid for 15 minutes only. Please do not share this OTP with anyone. CODINTERN PRIVATE LIMITED`;

  // Send the OTP via the API using axios
  const apiResponse = await axios.get(apiUrl);
  console.log(apiResponse, "api response");

  res.status(201).json({
    success: true,
    message: "OTP sent successfully",
    otp: process.env.NODE_ENV === "development" ? otp : undefined, // only send in dev
    registration,
  });
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
  const { mobileNumber, otp, type = "general" } = req.body;

  console.log("req body", req.body);

  if (!mobileNumber || !otp) {
    return res
      .status(400)
      .json({ message: "Mobile number and OTP are required" });
  }

  // 1. Find OTP entry
  const otpRecord = await Otp.findOne({
    phone: mobileNumber,
    type,
  }).sort({ createdAt: -1 }); // take latest if multiple

  // 2. Check existence
  if (!otpRecord) {
    return res
      .status(400)
      .json({ success: false, message: "OTP not found or expired" });
  }

  // 3. Check expiry
  if (otpRecord.otpExpiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    return res.status(400).json({ success: false, message: "OTP expired" });
  }

  // 4. Check match
  if (otpRecord.otp !== parseInt(otp, 10)) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  // 5. Mark verified + cleanup
  otpRecord.verified = true;
  await otpRecord.save();

  // Optional: delete after verification so OTP can’t be reused
  await Otp.deleteMany({ phone: mobileNumber, type });

  res.status(200).json({
    success: true,
    verified: true,
    message: "OTP verified successfully",
  });
});

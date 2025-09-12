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

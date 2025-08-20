const WorkshopRegistration = require("../models/WorkshopRegistration");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

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
    !universityRollNo
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // extra validation (optional - though Mongoose handles enum)
  if (![1, 2, 3, 4].includes(Number(year))) {
    return res.status(400).json({ message: "Year must be 1, 2, 3, or 4" });
  }

  const existing = await WorkshopRegistration.findOne({
    $or: [{ email }, { mobileNumber }],
  });

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
  });

  res.status(201).json({
    success: true,
    registration,
  });
});

const Student = require("../models/student/studentModel");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcrypt");
const { sendOtpEmail } = require("../utils/sendSMS");
const Otp = require("../models/Otp");

exports.signup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if user already exists
  const existingStudent = await Student.findOne({ emailId: email });
  if (existingStudent) {
    return res.status(409).json({ message: "Email already registered" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const student = new Student({
    name,
    emailId: email,
    password: hashedPassword,
    authProvider: "local",
  });

  await student.save();

  await sendOtpEmail(email);

  // Return minimal user data
  res.status(201).json({
    message: "User registered successfully",
    student: {
      _id: student._id,
      customId:student?.customId,
      name: student.name,
      emailId: student.emailId,
    },
  });
});

exports.verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const otpDoc = await Otp.findOne({ email });

  if (
    !otpDoc ||
    otpDoc.otp !== parseInt(otp) ||
    otpDoc.otpExpiresAt < new Date()
  ) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // Mark Student as emailVerified
  const student = await Student.findOneAndUpdate(
    { emailId: email },
    { emailVerified: true },
    { new: true }
  );

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  res.status(200).json({ message: "Email verified successfully" });
});



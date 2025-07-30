const Student = require("../models/student/studentModel");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcrypt");
const { sendOtpEmail } = require("../utils/sendSMS");
const Otp = require("../models/Otp");
const {
  generateRefreshToken,
  generateAccessToken,
  setTokenCookies,
} = require("../utils/token");

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
      customId: student?.customId,
      name: student.name,
      emailId: student.emailId,
    },
  });
});

exports.resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const student = await Student.findOne({ emailId: email });
  if (!student) {
    return res.status(404).json({ message: "No user found with that email" });
  }

  await sendOtpEmail(email);

  res.status(200).json({ message: "OTP resent successfully" });
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

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // 1. Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // 2. Find the student by email
  const student = await Student.findOne({ emailId: email }).select("+password");
  if (!student) {
    return res.status(401).json({ message: "Invalid email" });
  }

  // 3. Compare password
  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid password" });
  }

  // 4. Create JWT token and store in cookies
  const refreshToken = await generateRefreshToken({
    id: student?._id,
    customId: student?.customId,
    tokenVersion: student?.tokenVersion,
  });
  const accessToken = await generateAccessToken({
    id: student?._id,
    customId: student?.customId,
    tokenVersion: student?.tokenVersion,
  });

  student.refreshToken = refreshToken;
  await student.save();

  setTokenCookies({
    res,
    accessToken,
    refreshToken,
  });

  // 5. Send response
  res.status(200).json({
    message: "Login successful",
    isAuthenticated: true,
    student: {
      id: student._id,
      customId: student.customId,
      name: student.name,
      emailId: student.emailId,
    },
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const student = await Student.findOne({ emailId: email });

  // If user doesn't exist, return an error
  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student not found",
    });
  }

  // Reset token version to invalidate all refresh tokens
  student.tokenVersion = (student.tokenVersion || 0) + 1; // Increment instead of reset to 0
  await student.save();

  // Clear cookies
  setTokenCookies({
    res,
    accessToken: "",
    refreshToken: "",
    accessTokenMaxAge: 0,
    refreshTokenMaxAge: 0,
  });

  res.status(200).json({
    success: true,
    message: "Logged out from all devices",
  });
});

exports.signup2 = catchAsync(async (req, res) => {
  const {
    email,
    studentId,
    bringsYouHere = [],
    tech = [],
    business = [],
    creative = [],
    academic = [],
    currentRole = "",
    educationLevel = "",
  } = req.body;

  // 1. Basic validation – check all required fields
  // const hasAtLeastOneInterest =
  //   (Array.isArray(tech) && tech.length > 0) ||
  //   (Array.isArray(business) && business.length > 0) ||
  //   (Array.isArray(creative) && creative.length > 0) ||
  //   (Array.isArray(academic) && academic.length > 0);

  // if (
  //   !email ||
  //   !studentId ||
  //   !Array.isArray(bringsYouHere) ||
  //   bringsYouHere.length === 0 ||
  //   !hasAtLeastOneInterest ||
  //   !currentRole ||
  //   !educationLevel
  // ) {
  //   return res.status(400).json({
  //     message: "All fields are required and must be non-empty",
  //   });
  // }

  if (
    !email ||
    !studentId ||
    !Array.isArray(bringsYouHere) ||
    bringsYouHere.length === 0 ||
    !Array.isArray(tech) ||
    tech.length === 0 ||
    !Array.isArray(business) ||
    business.length === 0 ||
    !Array.isArray(creative) ||
    creative.length === 0 ||
    !Array.isArray(academic) ||
    academic.length === 0 ||
    !currentRole ||
    !educationLevel
  ) {
    return res.status(400).json({
      message: "All fields are required and must be non-empty",
    });
  }

  // 2. Build update object
  const updateFields = {
    bringsYouHere,
    areaOfInterest: {
      tech,
      business,
      creative,
      academic,
    },
    currentRole,
    education: [{ level: educationLevel }],
  };

  // 3. Update the student
  const student = await Student.findOneAndUpdate(
    { emailId: email, _id: studentId },
    { $set: updateFields },
    { new: true }
  );

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // 4. Send response
  res.status(200).json({
    message: "Updated student info successfully",
    student,
  });
});

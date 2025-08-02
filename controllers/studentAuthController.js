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
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");

exports.signup = catchAsync(async (req, res) => {
  const { name, email, password, rememberMe } = req.body;

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
    rememberMe,
  });

  await student.save();

  await sendOtpEmail(email,res);

  // Return minimal user data
  res.status(201).json({
    message: "User registered successfully. Please verify your email.",
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

  await sendOtpEmail(email, res);

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

  const userInfo = {
    name: student.name,
    email: student.emailId,
    image: student.image,
  };
  setTokenCookies({
    res,
    accessToken,
    refreshToken,
    userInfo,
  });

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

  const userInfo = {
    name: student.name,
    email: student.emailId,
    image: student.image,
  };
  setTokenCookies({
    res,
    accessToken,
    refreshToken,
    userInfo,
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

exports.googleCallback = catchAsync(async (req, res) => {
  const { _json } = req.user || {};
  console.log("_json", _json);
  const { name, email, email_verified, sub } = _json || {};
  const intent = req.query.state;

  // 1. Find the student by email
  let student = await Student.findOne({ emailId: email });
  if (!student) {
    student = new Student({
      name,
      emailId: email,
      authProvider: "google",
      emailVerified: email_verified,
      providerId: sub,
    });
  }

  await student.save();

  // 2. Create JWT token and store in cookies
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

  const userInfo = {
    name: student.name,
    email: student.emailId,
    image: student.image,
  };
  setTokenCookies({
    res,
    accessToken,
    refreshToken,
    userInfo,
  });

  intent === "signup"
    ? res.redirect(`${process.env.FRONT_END_URL}/sign-up/information`)
    : res.redirect(process.env.FRONT_END_URL);
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

  await new Promise((resolve, reject) => {
    req.logout((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
  req.session?.destroy();

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

exports.failure = catchAsync(async (req, res, next) => {
  res.redirect(`${process.env.FRONT_END_URL}/login`);
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

exports.checkAuthStatus = catchAsync(async (req, res, next) => {
  console.log("=== DEBUG: Inside protect middleware ===");
  console.log("Cookies:", req.cookies);
  const { accessToken, refreshToken } = req.cookies || {};
  console.log("Cookies: refreshToken", refreshToken);

  const isProduction = process.env.NODE_ENV === "production";

  // Check if refresh token exists
  if (!refreshToken || refreshToken === "undefined") {
    return res.status(200).json({
      success: true,
      isAuthenticated: false,
      message: "refresh token expired",
      shouldLoggOut: true,
    });
  }

  // First try to verify access token
  if (accessToken && accessToken !== "undefined") {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
      console.log("Access token decoded:", decoded);

      // Find user based on role
      let user = await Student.findById(decoded.id);

      if (user) {
        res.cookie("isAuthenticated", true, {
          httpOnly: false,
          secure: true,
          sameSite: isProduction ? "strict" : "none",
          maxAge: 90 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
          success: true,
          isAuthenticated: true,
          data: {
            id: user._id,
            name: user.name,
            email: user.emailId,
          },
        });
      }
    } catch (error) {
      console.log("Access token verification failed:", error.message);
      // Don't return error here, fall through to refresh token logic
    }
  }

  // If access token is invalid/expired, try refresh token
  if (refreshToken && refreshToken !== "undefined") {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      console.log("Refresh token decoded:", decoded);

      let user = await Student.findById(decoded.id);

      console.log("User found:", user);
      console.log(
        "Token versions - User:",
        user?.tokenVersion,
        "Decoded:",
        decoded.tokenVersion
      );

      // Verify token version
      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        return next(
          new AppError("Invalid refresh token - please login again", 401)
        );
      }

      // Generate new access token
      const newAccessToken = await generateAccessToken({
        id: user?._id,
        customId: user?.customId,
        tokenVersion: user?.tokenVersion,
      });

      // Set new access token cookie
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "none",
        maxAge: 5 * 60 * 1000,
      });

      res.cookie("isAuthenticated", true, {
        httpOnly: false,
        secure: true,
        sameSite: isProduction ? "strict" : "none",
        maxAge: 90 * 24 * 60 * 60 * 1000,
      });

      // Send new token in header for frontend to update
      res.setHeader("X-New-Token", newAccessToken);
      res.setHeader("X-Token-Refreshed", "true");

      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.emailId,
        },
      });
    } catch (error) {
      console.log("Refresh token verification failed:", error.message);
      return next(new AppError("Session expired - please login again", 401));
    }
  }

  // If we reach here, both tokens are missing or invalid
  res.cookie("isAuthenticated", false, {
    httpOnly: false,
    secure: true,
    sameSite: isProduction ? "strict" : "none",
    maxAge: 90 * 24 * 60 * 60 * 1000,
  });
  // return next(new AppError("Authentication required - please login", 401));
  return res.status(200).json({
    success: false,
    isAuthenticated: false,
    message: "Authentication required - please login",
    shouldLoggOut: true,
  });
});

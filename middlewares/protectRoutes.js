const Student = require("../models/studentModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { generateAccessToken } = require("../utils/token");
const jwt = require("jsonwebtoken");

exports.protect = catchAsync(async (req, res, next) => {
  console.log("=== DEBUG: Inside protect middleware ===");
  console.log("Cookies:", req.cookies);
  const { accessToken = "", refreshToken = "" } = req.cookies || {};

  const isProduction = process.env.NODE_ENV === "production";

  // Check if refresh token exists
  if (!refreshToken || refreshToken === "undefined") {
    return next(new AppError("Not authorized to access this route", 401));
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
          // sameSite: isProduction ? "strict" : "none",
          sameSite: "none",
          maxAge: 90 * 24 * 60 * 60 * 1000,
        });
        req.user = user;
        return next();
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
        // sameSite: isProduction ? "strict" : "none",
        sameSite: "none",
        maxAge: 5 * 60 * 1000,
      });

      res.cookie("isAuthenticated", true, {
        httpOnly: false,
        secure: true,
        // sameSite: isProduction ? "strict" : "none",
        sameSite: "none",
        maxAge: 90 * 24 * 60 * 60 * 1000,
      });

      // Send new token in header for frontend to update
      res.setHeader("X-New-Token", newAccessToken);
      res.setHeader("X-Token-Refreshed", "true");

      req.user = user;
      return next();
    } catch (error) {
      console.log("Refresh token verification failed:", error.message);
      return next(new AppError("Session expired - please login again", 401));
    }
  }

  // If we reach here, both tokens are missing or invalid
  res.cookie("isAuthenticated", false, {
    httpOnly: false,
    secure: true,
    // sameSite: isProduction ? "strict" : "none",
    sameSite: "none",
    maxAge: 90 * 24 * 60 * 60 * 1000,
  });
  return next(new AppError("Authentication required - please login", 401));
});

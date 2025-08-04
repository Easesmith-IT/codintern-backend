const jwt = require("jsonwebtoken");

exports.generateAccessToken = (data) => {
  return jwt.sign(data, process.env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
};

// Generate refresh token (long-lived)
exports.generateRefreshToken = (data) => {
  return jwt.sign(data, process.env.JWT_REFRESH_SECRET, { expiresIn: "90d" });
};

// Set token cookies with consistent settings
// exports.setTokenCookies = (data) => {
//   const {
//     res,
//     refreshToken,
//     refreshTokenMaxAge = 90 * 24 * 60 * 60 * 1000,
//     accessToken,
//     accessTokenMaxAge = 5 * 60 * 1000,
//     userInfo,
//   } = data || {};

//   const isProduction = process.env.NODE_ENV === "production";

//   // Set HttpOnly cookie for refresh token
//   res.cookie("refreshToken", refreshToken, {
//     httpOnly: true,
//     secure: true,
//     // sameSite: isProduction ? "strict" : "none",
//     sameSite: "none",
//     maxAge: refreshTokenMaxAge,
//   });

//   // Set HttpOnly cookie for access token
//   res.cookie("accessToken", accessToken, {
//     httpOnly: true,
//     secure: true,
//     // sameSite: isProduction ? "strict" : "none",
//     sameSite: "none",
//     maxAge: accessTokenMaxAge,
//   });

//   res.cookie("isAuthenticated", true, {
//     httpOnly: false,
//     secure: true,
//     // sameSite: isProduction ? "strict" : "none",
//     sameSite: "none",
//     maxAge: refreshTokenMaxAge,
//   });

//   res.cookie("userInfo", JSON.stringify(userInfo), {
//     httpOnly: false,
//     secure: true,
//     // sameSite: isProduction ? "strict" : "none",
//     sameSite: "none",
//     maxAge: refreshTokenMaxAge,
//   });
// };

exports.setTokenCookies = (data) => {
  const {
    res,
    refreshToken,
    refreshTokenMaxAge = 90 * 24 * 60 * 60 * 1000,
    accessToken,
    accessTokenMaxAge = 5 * 60 * 1000,
    userInfo,
  } = data || {};

  const cookies = [];

  // Refresh token cookie (HttpOnly)
  cookies.push(
    `refreshToken=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${refreshTokenMaxAge / 1000}`
  );

  // Access token cookie (HttpOnly)
  cookies.push(
    `accessToken=${accessToken}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${accessTokenMaxAge / 1000}`
  );

  // Non-HttpOnly cookie: isAuthenticated
  cookies.push(
    `isAuthenticated=true; Path=/; Secure; SameSite=None; Partitioned; Max-Age=${refreshTokenMaxAge / 1000}`
  );

  // Non-HttpOnly cookie: userInfo
  cookies.push(
    `userInfo=${encodeURIComponent(JSON.stringify(userInfo))}; Path=/; Secure; SameSite=None; Partitioned; Max-Age=${refreshTokenMaxAge / 1000}`
  );

  // Set all cookies
  res.setHeader("Set-Cookie", cookies);
};


const express = require("express");
const {
  signup,
  verifyOtp,
  login,
  logout,
  signup2,
  resendOtp,
  checkAuthStatus,
  googleCallback,
  failure,
} = require("../controllers/studentAuthController");
const passport = require("passport");
const router = express.Router();

router.post("/signup", signup);
router.patch("/signup-2", signup2);

router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.post("/login", login);

router.get("/google", (req, res, next) => {
  const intent = req.query.intent || "login"; // "signup" or "login"
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    state: intent, // pass intent to callback
  })(req, res, next);
  // passport.authenticate("google", {
  //   scope: ["profile", "email"],
  //   prompt: "select_account",
  // })
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/student/auth/failure",
  }),
  googleCallback
);

router.post("/failure", failure);

router.post("/logout", logout);

router.get("/status", checkAuthStatus);

module.exports = router;

const express = require("express");
const {
  signup,
  verifyOtp,
  login,
  logout,
  signup2,
  resendOtp,
} = require("../controllers/studentAuthController");
const router = express.Router();

router.post("/signup", signup);
router.patch("/signup-2", signup2);

router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.post("/login", login);

router.post("/logout", logout);


module.exports = router;

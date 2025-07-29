const express = require("express");
const { signup, verifyOtp } = require("../controller/studentAuthController");
const router = express.Router();

// POST /api/user/auth/signup
router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);

module.exports = router;

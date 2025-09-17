const express = require("express");
const {
  registerWorkshop,
  sendOtp,
  verifyOtp,
} = require("../controllers/studentWorkshopController");
const router = express.Router();

router.post("/register", registerWorkshop);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

module.exports = router;

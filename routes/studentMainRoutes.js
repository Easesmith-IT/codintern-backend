const express = require("express");
const {
  changePassword,
  updateProfile,
  getProfile,
} = require("../controllers/studentMainController");
const { protect } = require("../middlewares/protectRoutes");
const upload = require("../middlewares/imgUpload");
const router = express.Router();

router.patch("/change-password", protect, changePassword);

// TODO:
// 1. login with google and facebook
// 2. forget password

router.patch("/update-profile", protect, upload.single("image"), updateProfile);
router.get("/get-profile", protect, getProfile);

module.exports = router;

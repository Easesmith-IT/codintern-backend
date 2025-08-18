const express = require("express");
const {
  changePassword,
  updateProfile,
  getProfile,
} = require("../controllers/studentMainController");
const { protect } = require("../middlewares/protectRoutes");
const upload = require("../middlewares/imgUpload");
const router = express.Router();

router.patch("/change-password", changePassword);

// TODO:
// 1. forget password

router.patch("/update-profile", upload.single("image"), updateProfile);
router.get("/get-profile", getProfile);

module.exports = router;

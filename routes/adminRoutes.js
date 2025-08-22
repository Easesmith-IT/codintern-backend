const express = require("express");
const {
  createAdmin,
  loginAdmin,
  getAdmins,
  getAdminDetails,
  updateAdmin,
  updateAdminStatus,
  deleteAdmin,
  changePassword,
  logout,
} = require("../controllers/adminController");
const upload = require("../middlewares/imgUpload");
const { protect } = require("../middlewares/protectRoutes");
const { authorize } = require("../middlewares/authorizePermission");
const router = express.Router();

router.post(
  "/create",
  // protect,
  // authorize("admin", "read&write"),
  upload.single("image"),
  createAdmin
);
router.post("/login", loginAdmin);

router.get(
  "/get",
  // protect,
  // authorize("admin", "read"),
  getAdmins
);
router.get(
  "/get-details/:id",
  // protect,
  // authorize("admin", "read"),
  getAdminDetails
);
router.patch(
  "/update/:id",
  // protect,
  // authorize("admin", "read&write"),
  upload.single("image"),
  updateAdmin
);
router.patch(
  "/update-status/:id",
  // protect,
  // authorize("admin", "read&write"),
  updateAdminStatus
);
router.delete(
  "/delete/:id",
  // protect,
  // authorize("admin", "read&write"),
  deleteAdmin
);

router.patch(
  "/change-password",
  // protect,
  // authorize("admin", "read&write"),
  changePassword
);
router.post(
  "/logout",
  // protect,
  logout
);

module.exports = router;

const express = require("express");
const {
  getAllStudents,
  getStudentDetails,
  updateStudent,
  updateStudentStatus,
  getStudentStats,
  deleteStudent,
} = require("../controllers/adminStudentController");
const upload = require("../middlewares/imgUpload");
const { protect } = require("../middlewares/protectRoutes");
const { authorize } = require("../middlewares/authorizePermission");

const router = express.Router();

// Get all students with filters and pagination
router.get(
  "/",
  // protect,
  // authorize("admin", "read"),
  getAllStudents
);

// Get student statistics for dashboard
router.get(
  "/stats",
  // protect,
  // authorize("admin", "read"),
  getStudentStats
);

// Get specific student details by ID
router.get(
  "/:id",
  // protect,
  // authorize("admin", "read"),
  getStudentDetails
);

// Update student information
router.patch(
  "/:id",
  // protect,
  // authorize("admin", "read&write"),
  upload.single("image"),
  updateStudent
);

// Update student status only
router.patch(
  "/:id/status",
  // protect,
  // authorize("admin", "read&write"),
  updateStudentStatus
);

// Soft delete student (deactivate)
router.delete(
  "/:id",
  // protect,
  // authorize("admin", "read&write"),
  deleteStudent
);

module.exports = router;

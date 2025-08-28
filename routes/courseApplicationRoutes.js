const express = require("express");
const {
  getCourseApplications,
  getCourseApplicationById,
  updateCourseApplication,
  updateApplicationStatus,
  getMyApplications,
  getApplicationsByCourse,
  deleteCourseApplication,
  getApplicationStats,
  addNoteToApplication,
  bulkUpdateApplicationStatus,
  exportApplicationsByCourse,
} = require("../controllers/courseApplicationController");

const {
  updateCourseApplicationSchema,
  updateStatusSchema,
  deleteCourseApplicationSchema,
} = require("../validations/courseApplicationValidation");

const validate = require("../middlewares/validate");
const router = express.Router();

// Get applications by course ID
router.get("/:courseId", getApplicationsByCourse);

// Get applications by course ID to export as csv
router.get("/export/:courseId", exportApplicationsByCourse);

// Bulk update application statuses (admin only)
router.post("/bulk-update-status", bulkUpdateApplicationStatus);

// GET Routes
// Get all course applications with filtering, pagination and search
router.get("/", getCourseApplications);

// Get application statistics
router.get("/stats", getApplicationStats);


// Get applications by student ID (for student dashboard)
router.get("/student/:studentId", getMyApplications);

// Get course application by ID
router.get("/:id", getCourseApplicationById);

// PATCH/PUT Routes
// Update course application (general update)
router.patch(
  "/:id",
  validate(updateCourseApplicationSchema),
  updateCourseApplication
);

// Update application status specifically (admin/instructor only)
router.patch(
  "/:id/status",
  validate(updateStatusSchema),
  updateApplicationStatus
);

// Add note to application (admin/instructor only)
router.patch("/:id/note", addNoteToApplication);

// DELETE Routes
// Delete course application (soft delete by default, hard delete if specified)
router.delete(
  "/:id",
  validate(deleteCourseApplicationSchema),
  deleteCourseApplication
);

module.exports = router;

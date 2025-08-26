const express = require("express");
const {
  createInstructor,
  getInstructors,
  getInstructorDetails,
  updateInstructor,
  deleteInstructor,
  toggleInstructorStatus,
} = require("../controllers/instructorController");
const {
  createInstructorSchema,
  updateInstructorSchema,
} = require("../validations/instructorValidation");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/imgUpload");
const router = express.Router();

// Create instructor
router.post(
  "/create",
  validate(createInstructorSchema),
  upload.single("profileImage"),
  createInstructor
);

// Get all instructors with filtering, pagination and search
router.get("/", getInstructors);

// Get instructor details by ID
router.get("/:id", getInstructorDetails);

// Update instructor
router.put(
  "/:id",
  validate(updateInstructorSchema),
  upload.single("profileImage"),
  updateInstructor
);

// Delete instructor
router.delete("/:id", deleteInstructor);

// Toggle instructor status (active/inactive)
router.patch("/:id/toggle-status", toggleInstructorStatus);

module.exports = router;

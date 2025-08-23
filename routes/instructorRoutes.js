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



module.exports = router;

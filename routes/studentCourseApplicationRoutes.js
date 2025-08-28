const express = require("express");
const {
  createCourseApplication,
} = require("../controllers/courseApplicationController");

const {
  createCourseApplicationSchema,
} = require("../validations/courseApplicationValidation");

const validate = require("../middlewares/validate");
const router = express.Router();

// POST Routes
// Create new course application
router.post(
  "/create",
  validate(createCourseApplicationSchema),
  createCourseApplication
);

module.exports = router;

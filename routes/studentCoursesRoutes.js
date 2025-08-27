const express = require("express");
const {
  getCourses,
  getCourseDetails,
} = require("../controllers/studentCoursesController");
const router = express.Router();

router.get("/", getCourses);
router.get("/:id", getCourseDetails);

module.exports = router;

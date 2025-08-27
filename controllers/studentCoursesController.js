const catchAsync = require("../utils/catchAsync");
const courseService = require("../services/courseService");

exports.getCourses = catchAsync(async (req, res, next) => {
  const result = await courseService.getCourses(req.query);

  res.json({
    success: true,
    pagination: result.pagination,
    courses: result.courses,
  });
});

// Get course details by ID, customId or slug
exports.getCourseDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const course = await courseService.getCourseById(id);

  res.status(200).json({
    success: true,
    course,
  });
});
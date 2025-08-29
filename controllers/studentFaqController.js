const FAQ = require("../models/Faq");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

// Get FAQs by category for students
exports.getFaqsByCategoryForStudents = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const { courseId } = req.query;

  console.log("category", category);

  const validCategories = ["General", "Courses"];
  if (!validCategories.includes(category)) {
    return next(
      new AppError("Invalid category. Must be 'General' or 'Courses'", 400)
    );
  }

  const query = { category, isActive: true };

  if (category === "Courses" && courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return next(new AppError("Invalid courseId format", 400));
    }
    query.courseId = courseId;
  }

  const faqs = await FAQ.find(query)
    .populate("courseId", "title description")
    .sort({ order: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    message: `${category} FAQs fetched successfully`,
    faqs,
  });
});

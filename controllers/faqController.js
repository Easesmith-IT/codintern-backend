const FAQ = require("../models/Faq");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

// Create FAQ
exports.createFaq = catchAsync(async (req, res, next) => {
  const { question, answer, category, courseId, order, isActive } = req.body;

  // Validate required fields
  if (!question || !answer || !category) {
    return next(
      new AppError("Please provide question, answer, and category", 400)
    );
  }

  // Validate category
  const validCategories = ["General", "Courses"];
  if (!validCategories.includes(category)) {
    return next(
      new AppError("Invalid category. Must be 'General' or 'Courses'", 400)
    );
  }

  // If category is "Courses", courseId is required
  if (category === "Courses" && !courseId) {
    return next(
      new AppError("CourseId is required for 'Courses' category", 400)
    );
  }

  // Validate courseId format if provided
  if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
    return next(new AppError("Invalid courseId format", 400));
  }

  const newFaq = await FAQ.create({
    question,
    answer,
    category,
    courseId: category === "Courses" ? courseId : undefined,
    order: order || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    success: true,
    message: "FAQ created successfully",
    faq: newFaq,
  });
});

// Get all FAQs with filtering and pagination
exports.getFaqs = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    courseId,
    isActive,
    search,
    sortField = "order",
    sortOrder = "asc",
  } = req.query;

  const query = {};

  // Filters
  if (category) query.category = category;
  if (courseId) query.courseId = courseId;
  if (isActive !== undefined && isActive !== "") query.isActive = isActive === "true";

  // Search in question and answer
  if (search) {
    query.$or = [
      { question: { $regex: search, $options: "i" } },
      { answer: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sort = {};
  sort[sortField] = sortOrder === "desc" ? -1 : 1;

  const faqs = await FAQ.find(query)
    .populate("courseId", "title description")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await FAQ.countDocuments(query);

  res.status(200).json({
    success: true,
    message: "FAQs fetched successfully",
    faqs,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalFaqs: total,
      limit: limitNum,
    },
  });
});

// Get single FAQ by ID
exports.getFaqById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid FAQ ID format", 400));
  }

  const faq = await FAQ.findById(id).populate("courseId", "title description");

  if (!faq) {
    return next(new AppError("FAQ not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "FAQ fetched successfully",
    faq,
  });
});

// Update FAQ
exports.updateFaq = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { question, answer, category, courseId, order, isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid FAQ ID format", 400));
  }

  const faq = await FAQ.findById(id);
  if (!faq) {
    return next(new AppError("FAQ not found", 404));
  }

  // Validate category if provided
  if (category) {
    const validCategories = ["General", "Courses"];
    if (!validCategories.includes(category)) {
      return next(
        new AppError("Invalid category. Must be 'General' or 'Courses'", 400)
      );
    }
  }

  // Validate courseId format if provided
  if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
    return next(new AppError("Invalid courseId format", 400));
  }

  // If category is being updated to "Courses", courseId is required
  const updatedCategory = category || faq.category;
  if (updatedCategory === "Courses" && !courseId && !faq.courseId) {
    return next(
      new AppError("CourseId is required for 'Courses' category", 400)
    );
  }

  // Update fields
  if (question !== undefined) faq.question = question;
  if (answer !== undefined) faq.answer = answer;
  if (category !== undefined) faq.category = category;
  if (courseId !== undefined)
    faq.courseId = updatedCategory === "Courses" ? courseId : undefined;
  if (order !== undefined) faq.order = order;
  if (isActive !== undefined) faq.isActive = isActive;

  const updatedFaq = await faq.save();

  res.status(200).json({
    success: true,
    message: "FAQ updated successfully",
    faq: updatedFaq,
  });
});

// Delete FAQ
exports.deleteFaq = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid FAQ ID format", 400));
  }

  const faq = await FAQ.findById(id);
  if (!faq) {
    return next(new AppError("FAQ not found", 404));
  }

  await FAQ.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "FAQ deleted successfully",
  });
});

// Get FAQs by category
exports.getFaqsByCategory = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const { courseId, isActive = true } = req.query;

  const validCategories = ["General", "Courses"];
  if (!validCategories.includes(category)) {
    return next(
      new AppError("Invalid category. Must be 'General' or 'Courses'", 400)
    );
  }

  const query = { category, isActive };

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

const catchAsync = require("../utils/catchAsync");
const Review = require("../models/Review");
const mongoose = require("mongoose");
const Course = require("../models/course/Course");

exports.createReview = catchAsync(async (req, res, next) => {
  if (req.body.category === "Course") {
    if (!mongoose.isValidObjectId(req.body.course)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Course ID",
      });
    }

    const courseExists = await Course.findById(req.body.course);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
  }
  const review = new Review(req.body); // safe validated data
  await review.save();

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: review,
  });
});

exports.getReviewsByCategory = catchAsync(async (req, res, next) => {
  const {
    category,
    courseId,
    status, // ✅ new filter
    page = 1,
    limit = 10,
    sortField = "createdAt",
    sortOrder = "desc",
  } = req.query;

  console.log("req.query", req.query);
  

  // ✅ Validate category
  if (!category || !["General", "Course"].includes(category)) {
    return res.status(400).json({
      success: false,
      message: "Category is required and must be either 'General' or 'Course'",
    });
  }

  let filter = { category };

  // ✅ Filter by status if provided
  if (status && ["active", "inactive"].includes(status)) {
    filter.status = status;
  }

  // ✅ If category is Course → courseId is required
  if (category === "Course") {
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required when category is 'Course'",
      });
    }

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Course ID",
      });
    }

    filter.course = courseId;
  }

  // ✅ Pagination & Sorting
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const sort = {};
  sort[sortField] = sortOrder === "desc" ? -1 : 1;

  // ✅ Fetch reviews with pagination
  const reviews = await Review.find(filter)
    .populate("course", "title description")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Review.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",
    reviews,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalReviews: total,
      limit: limitNum,
    },
  });
});

exports.updateReviewStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate MongoDB ID
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid review ID",
    });
  }

  // Validate status
  if (!status || !["active", "inactive"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be either 'active' or 'inactive'",
    });
  }

  const review = await Review.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!review) {
    return res.status(404).json({
      success: false,
      message: "Review not found",
    });
  }

  res.status(200).json({
    success: true,
    message: `Review status updated to '${status}' successfully`,
    data: review,
  });
});

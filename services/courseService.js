const Course = require("../models/course/Course");
const AppError = require("../utils/appError");

// Create draft
exports.createCourse = async (data) => {
  const course = new Course(data);
  return await course.save();
};

// Generic update
exports.updateCourse = async (id, update, next) => {
  const course = await Course.findByIdAndUpdate(id, update, { new: true });
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  return course;
};

// Add module
exports.addModules = async (courseId, modulesData, next) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  course.modules =modulesData;
  await course.save();

  return course;
};

// Additional Info (career + materials + features + venue)
exports.updateAdditionalDetails = async (courseId, data, next) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (data.instructors) course.instructors = data.instructors;

  if (!course.pricing || !course.modules.length) {
    throw new AppError("Course is missing pricing or modules", 400);
  }

  if (data.publish) {
    course.status = "published";
    course.publishedAt = new Date();
  }

  await course.save();
  return course;
};

// Publish course (assign instructors + validate required fields)
exports.publishCourse = async (courseId, data, next) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (data.instructors) course.instructors = data.instructors;

  if (!course.pricing || !course.modules.length) {
    throw new AppError("Course is missing pricing or modules", 400);
  }

  if (data.status) {
    course.status = data.status;
    course.publishedAt = new Date();
  }

  await course.save();
  return course;
};

// Get all courses with filtering, pagination and search
exports.getCourses = async (queryParams) => {
  let {
    page = 1,
    limit = 10,
    status,
    category,
    level,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = queryParams;
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  // Build query object
  let query = {};

  if (
    status &&
    ["draft", "published", "archived"].includes(status.toLowerCase())
  ) {
    query.status = status.toLowerCase();
  }

  if (category) {
    query.category = { $regex: category, $options: "i" };
  }

  if (
    level &&
    ["beginner", "intermediate", "advanced"].includes(level.toLowerCase())
  ) {
    query.level = level.toLowerCase();
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { overview: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { subCategory: { $regex: search, $options: "i" } },
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const totalCourses = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .populate("instructors", "firstName lastName email expertise")
    .select("-modules.lessons.contentUrl") // Hide content URLs for security
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    courses,
    pagination: {
      totalPages: Math.ceil(totalCourses / limit),
      page,
      limit,
      totalCourses,
    },
  };
};

// Get course by ID or customId
exports.getCourseById = async (id) => {
  let course;

  // Check if it's MongoDB ObjectId
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    course = await Course.findById(id).populate(
      "instructors",
      "name email expertise bio profileImage"
    );
  } else {
    // Else search by customId or slug
    course = await Course.findOne({
      $or: [{ customId: id }, { slug: id }],
    }).populate("instructors", "name email expertise bio profileImage");
  }

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  return course;
};

// Delete course
exports.deleteCourse = async (id, deleteType = "soft") => {
  let course;

  // Check if it's MongoDB ObjectId
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    course = await Course.findById(id);
  } else {
    // Else search by customId or slug
    course = await Course.findOne({
      $or: [{ customId: id }, { slug: id }],
    });
  }

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  // Check if course has enrolled students
  const hasEnrolledStudents = course.batches.some(
    (batch) => batch.students && batch.students.length > 0
  );

  if (hasEnrolledStudents && deleteType === "hard") {
    throw new AppError(
      "Cannot delete course with enrolled students. Consider archiving instead.",
      400
    );
  }

  // Check if course is published and has ongoing batches
  const hasOngoingBatches = course.batches.some(
    (batch) => batch.status === "ongoing"
  );

  if (hasOngoingBatches) {
    throw new AppError(
      "Cannot delete course with ongoing batches. Please complete or cancel batches first.",
      400
    );
  }

  let deletedCourse;

  if (deleteType === "hard") {
    // Hard delete - permanently remove from database
    deletedCourse = await Course.findByIdAndDelete(course._id);
  } else {
    // Soft delete - archive the course
    deletedCourse = await Course.findByIdAndUpdate(
      course._id,
      {
        status: "archived",
        archivedAt: new Date(),
      },
      { new: true }
    );
  }

  return {
    course: deletedCourse,
    deleteType,
    message:
      deleteType === "hard"
        ? "Course permanently deleted successfully"
        : "Course archived successfully",
  };
};

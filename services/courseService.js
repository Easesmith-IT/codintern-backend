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
exports.addModule = async (courseId, moduleData, next) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  course.modules.push(moduleData);
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

  if (data.publish) {
    course.status = "published";
    course.publishedAt = new Date();
  }

  await course.save();
  return course;
};

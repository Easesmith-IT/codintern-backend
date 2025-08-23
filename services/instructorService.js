const Instructor = require("../models/course/Instructor");
const AppError = require("../utils/appError");
const bcrypt = require("bcrypt");

// Create instructor
exports.createInstructor = async (data) => {
  // Check if instructor already exists
  const existingInstructor = await Instructor.findOne({ email: data.email });
  if (existingInstructor) {
    throw new AppError("Instructor with this email already exists", 400);
  }

  // Hash password
  if (data.password) {
    const saltRounds = 12;
    data.password = await bcrypt.hash(data.password, saltRounds);
  }

  const instructor = new Instructor(data);
  return await instructor.save();
};


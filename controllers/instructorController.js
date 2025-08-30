const instructorService = require("../services/instructorService");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { uploadImage } = require("../utils/fileUploadToAzure");

// Create instructor
exports.createInstructor = catchAsync(async (req, res, next) => {
  const image = req?.file;
  let profileImageUrl;

  console.log("image", image);

  // Upload profile image if provided
  if (image) {
    try {
      profileImageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      return next(new AppError("Failed to upload profile image", 500));
    }
  }
  console.log("profileImageUrl", profileImageUrl);

  const instructorData = {
    ...req.body,
    profileImage: profileImageUrl,
  };

  // Parse arrays if they come as JSON strings
  if (req.body.expertise) {
    instructorData.expertise = JSON.parse(req.body.expertise);
  }
  if (req.body.certifications) {
    instructorData.certifications = JSON.parse(req.body.certifications);
  }
  if (req.body.socialLinks) {
    instructorData.socialLinks = JSON.parse(req.body.socialLinks);
  }
  if (req.body.achievements) {
    instructorData.achievements = JSON.parse(req.body.achievements);
  }

  const instructor = await instructorService.createInstructor(instructorData);

  res.status(201).json({
    success: true,
    message: "Instructor created successfully",
    instructor,
  });
});

// Get all instructors with filtering, pagination and search
exports.getInstructors = catchAsync(async (req, res, next) => {
  const result = await instructorService.getInstructors(req.query);

  res.json({
    success: true,
    pagination: result.pagination,
    instructors: result.instructors,
  });
});

// Get instructor details by ID
exports.getInstructorDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const instructor = await instructorService.getInstructorById(id);

  res.status(200).json({
    success: true,
    instructor,
  });
});

// Update instructor
exports.updateInstructor = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const image = req?.file;
  let profileImageUrl;

  console.log("image", image);

  // Upload new profile image if provided
  if (image) {
    try {
      profileImageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      return next(new AppError("Failed to upload profile image", 500));
    }
  }

  const updateData = {
    ...req.body,
  };

  // Add profile image URL if uploaded
  if (profileImageUrl) {
    updateData.profileImage = profileImageUrl;
  }

  // Parse arrays if they come as JSON strings
  if (req.body.expertise) {
    updateData.expertise = JSON.parse(req.body.expertise);
  }
  if (req.body.certifications) {
    updateData.certifications = JSON.parse(req.body.certifications);
  }
  if (req.body.socialLinks) {
    updateData.socialLinks = JSON.parse(req.body.socialLinks);
  }
  if (req.body.achievements) {
    updateData.achievements = JSON.parse(req.body.achievements);
  }

  const instructor = await instructorService.updateInstructor(id, updateData);

  res.status(200).json({
    success: true,
    message: "Instructor updated successfully",
    instructor,
  });
});

// Delete instructor
exports.deleteInstructor = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const instructor = await instructorService.deleteInstructor(id);

  res.status(200).json({
    success: true,
    message: "Instructor deleted successfully",
    instructor,
  });
});

// Toggle instructor status (active/inactive)
exports.toggleInstructorStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const instructor = await instructorService.toggleInstructorStatus(id);

  res.status(200).json({
    success: true,
    message: `Instructor status updated to ${instructor.isActive ? "active" : "inactive"}`,
    instructor,
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, newPassword, instructorId } = req.body;

  const instructor = await instructorService.changePassword(
    instructorId,
    oldPassword,
    newPassword
  );

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
    instructor: {
      id: instructor._id,
      email: instructor.email,
      firstName: instructor.firstName,
      lastName: instructor.lastName,
    },
  });
});

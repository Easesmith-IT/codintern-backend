const instructorService = require("../services/instructorService");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { uploadImage } = require("../utils/fileUploadToAzure");

// Create instructor
exports.createInstructor = catchAsync(async (req, res, next) => {
  const image = req?.file;
  let profileImageUrl;

  // Upload profile image if provided
  if (image) {
    try {
      profileImageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      return next(new AppError("Failed to upload profile image", 500));
    }
  }

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



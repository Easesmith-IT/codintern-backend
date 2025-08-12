const Student = require("../models/studentModel");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcrypt");
const { uploadImage } = require("../utils/fileUploadToAzure");

exports.changePassword = catchAsync(async (req, res) => {
  console.log("req.user", req.user);

  const { _id: studentId } = req.user; // or from req.body or JWT token
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Both old and new passwords are required" });
  }

  const student = await Student.findById(studentId).select("+password");
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const isMatch = await bcrypt.compare(oldPassword, student.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Old password is incorrect" });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  student.password = hashedNewPassword;
  await student.save();

  res
    .status(200)
    .json({ success: true, message: "Password changed successfully" });
});

exports.updateProfile = catchAsync(async (req, res) => {
  // const studentId = req.user._id;

  const {
    name,
    emailId,
    phone,
    contactMethod,
    bio,
    profileVisibility,
    studentId,
  } = req.body;

  const image = req?.file;

  const updates = {};

  if (name !== undefined) updates.name = name;
  if (emailId !== undefined) updates.emailId = emailId;
  if (phone !== undefined) updates.phone = phone;
  if (contactMethod !== undefined) updates.contactMethod = contactMethod;
  if (bio !== undefined) updates.bio = bio;
  if (profileVisibility !== undefined)
    updates.profileVisibility = profileVisibility;

  let imageUrl;
  if (image) {
    try {
      imageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading student image:", error);
      return next(new AppError("Failed to upload student image", 500));
    }
  }

  if (imageUrl) {
    updates.image = imageUrl;
  }

  const updatedStudent = await Student.findByIdAndUpdate(
    studentId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password -refreshToken"); // hide sensitive data

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedStudent,
  });
});

exports.getProfile = catchAsync(async (req, res) => {
  const studentId = req.query.studentId;

  const student = await Student.findById(studentId).select(
    "-password -refreshToken"
  ); // exclude sensitive fields

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    student,
  });
});

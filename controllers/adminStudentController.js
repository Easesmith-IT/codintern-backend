const Student = require("../models/studentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");
const { uploadImage } = require("../utils/fileUploadToAzure");

// Get all students with filters, search, and pagination
exports.getAllStudents = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    sortField = "createdAt",
    sortOrder = "desc",
    emailVerified,
    authProvider,
  } = req.query;

  const query = {};

  // Filters
  if (status) query.status = status;
  if (emailVerified !== undefined && emailVerified !== "all") query.emailVerified = emailVerified === "true";
  if (authProvider) query.authProvider = authProvider;

  // Search in name, email, phone, customId
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { emailId: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { customId: { $regex: search, $options: "i" } },
    ];
  }

  // Sorting
  const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  console.log("query", query);
  

  const [students, total] = await Promise.all([
    Student.find(query)
      .select(
        "customId name emailId phone image status emailVerified authProvider createdAt updatedAt currentRole"
      )
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Student.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

// Get student details by ID
exports.getStudentDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid student ID format", 400));
  }

  const student = await Student.findById(id).select("-password -refreshToken");

  if (!student) {
    return next(new AppError("Student not found", 404));
  }

  res.status(200).json({
    success: true,
    data: {
      student,
    },
  });
});

// Update student information
exports.updateStudent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const image = req?.file;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid student ID format", 400));
  }

  // Check if student exists
  const existingStudent = await Student.findById(id);
  if (!existingStudent) {
    return next(new AppError("Student not found", 404));
  }

  // Allowed fields for update by admin
  const allowedFields = [
    "name",
    "emailId",
    "phone",
    "alternatePhone",
    "bio",
    "currentRole",
    "profileVisibility",
    "contactMethod",
    "emailVerified",
    "status",
    "skills",
    "portfolioLinks",
  ];

  // Build update object
  const updates = {};
  for (let key of allowedFields) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  // Handle image upload if provided
  if (image) {
    try {
      const imageUrl = await uploadImage(image);
      updates.image = imageUrl;
    } catch (error) {
      console.error("Error uploading student image:", error);
      return next(new AppError("Failed to upload student image", 500));
    }
  }

  // Check for email uniqueness if email is being updated
  if (updates.emailId && updates.emailId !== existingStudent.emailId) {
    const emailExists = await Student.findOne({
      emailId: updates.emailId,
      _id: { $ne: id },
    });
    if (emailExists) {
      return next(new AppError("Email already in use by another student", 400));
    }
  }

  // Update student
  const updatedStudent = await Student.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
    select: "-password -refreshToken",
  });

  res.status(200).json({
    success: true,
    message: "Student updated successfully",
    data: {
      student: updatedStudent,
    },
  });
});

// Update student status
exports.updateStudentStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid student ID format", 400));
  }

  // Validate status
  const validStatuses = ["active", "inactive", "suspended", "pending"];
  if (!validStatuses.includes(status)) {
    return next(
      new AppError(
        `Status must be one of: ${validStatuses.join(", ")}`,
        400
      )
    );
  }

  const updatedStudent = await Student.findByIdAndUpdate(
    id,
    { status },
    {
      new: true,
      runValidators: true,
      select: "-password -refreshToken",
    }
  );

  if (!updatedStudent) {
    return next(new AppError("Student not found", 404));
  }

  res.status(200).json({
    success: true,
    message: `Student status updated to ${status}`,
    data: {
      student: updatedStudent,
    },
  });
});

// Get student statistics for admin dashboard
exports.getStudentStats = catchAsync(async (req, res, next) => {
  const stats = await Student.aggregate([
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        activeStudents: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        inactiveStudents: {
          $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
        },
        suspendedStudents: {
          $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] },
        },
        pendingStudents: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        verifiedEmails: {
          $sum: { $cond: [{ $eq: ["$emailVerified", true] }, 1, 0] },
        },
        unverifiedEmails: {
          $sum: { $cond: [{ $eq: ["$emailVerified", false] }, 1, 0] },
        },
      },
    },
  ]);

  const statusBreakdown = await Student.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const authProviderBreakdown = await Student.aggregate([
    {
      $group: {
        _id: "$authProvider",
        count: { $sum: 1 },
      },
    },
  ]);

  const recentRegistrations = await Student.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        suspendedStudents: 0,
        pendingStudents: 0,
        verifiedEmails: 0,
        unverifiedEmails: 0,
      },
      statusBreakdown,
      authProviderBreakdown,
      recentRegistrations,
    },
  });
});

// Delete student (soft delete by updating status)
exports.deleteStudent = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid student ID format", 400));
  }

  const student = await Student.findByIdAndUpdate(
    id,
    { status: "inactive", deletedAt: new Date() },
    {
      new: true,
      runValidators: true,
      select: "-password -refreshToken",
    }
  );

  if (!student) {
    return next(new AppError("Student not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Student deactivated successfully",
    data: {
      student,
    },
  });
});

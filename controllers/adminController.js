const { Admin } = require("../models/admin");
const catchAsync = require("../utils/catchAsync");
const { uploadImage } = require("../utils/fileUploadToAzure");
const bcrypt = require("bcryptjs");
const {
  setTokenCookies,
  generateRefreshToken,
  generateAccessToken,
} = require("../utils/token");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");
const parseIfString = require("../utils/parseIfString");

exports.createAdmin = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    password,
    position, // manager, support, analyst
    permissions,
  } = req.body;

  const image = req?.file;

  console.log("req?.admin?", req?.user);

  // 1. Check if creator is superAdmin
  if (req?.user?.role !== "superAdmin") {
    return next(new AppError("Only super admins can create sub admins", 403));
  }

  // 2. Validate required fields
  if (!name || !email || !phone || !password || !position || !image) {
    return next(new AppError("Please provide all required fields", 400));
  }

  // 3. Check if email or phone already exists
  const existingAdmin = await Admin.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingAdmin) {
    return next(
      new AppError("An admin with this email or phone already exists", 400)
    );
  }

  // 4. Validate position
  const validPositions = ["manager", "support", "analyst"];
  if (!validPositions.includes(position)) {
    return next(new AppError("Invalid position", 400));
  }

  // 5. Validate permissions format
  const permissionModules = ["dashboard", "admin", "job", "student", "review"];

  const validPermissionLevels = ["none", "read", "read&write"];

  const validatedPermissions = {};
  permissionModules.forEach((module) => {
    const permissionLevel = parseIfString(permissions)?.[module] || "none";
    if (!validPermissionLevels.includes(permissionLevel)) {
      return next(new AppError(`Invalid permission level for ${module}`, 400));
    }
    validatedPermissions[module] = permissionLevel;
  });

  let imageUrl;
  if (image) {
    try {
      imageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading admin image:", error);
      return next(new AppError("Failed to upload admin image", 500));
    }
  }

  // 6. Create sub admin
  const newSubAdmin = await Admin.create({
    name,
    email,
    phone,
    password,
    position,
    profileImage: imageUrl,
    role: "subAdmin",
    // role: "superAdmin",
    permissions: validatedPermissions,
    createdBy: req.user._id,
    status: "active",
  });

  // 7. Remove sensitive data from response
  newSubAdmin.password = undefined;
  newSubAdmin.refreshToken = undefined;

  res.status(201).json({
    success: true,
    message: "Admin created successfully",
    admin: newSubAdmin,
  });
});

exports.loginAdmin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  const foundAdmin = await Admin.findOne({ email: email }).select("+password");
  if (!foundAdmin) {
    return next(new AppError("Admin doesn't exist", 400));
  }

  console.log("foundAdmin", foundAdmin);
  const matchedPassword = await bcrypt.compare(password, foundAdmin.password);
  if (!matchedPassword) {
    return next(new AppError("password is incorrect", 400));
  }
  const refreshToken = await generateRefreshToken({
    id: foundAdmin._id,
    customId: foundAdmin.customId,
    role: foundAdmin.role,
    tokenVersion: foundAdmin.tokenVersion,
  });
  const accessToken = await generateAccessToken({
    id: foundAdmin._id,
    customId: foundAdmin.customId,
    role: foundAdmin.role,
    tokenVersion: foundAdmin.tokenVersion,
  });

  foundAdmin.refreshToken = refreshToken;
  await foundAdmin.save();

  const userInfo = {
    id: foundAdmin._id,
    customId: foundAdmin.customId,
    name: foundAdmin.name,
    email: foundAdmin.email,
    image: foundAdmin.profileImage,
  };

  setTokenCookies({
    res,
    accessToken,
    refreshToken,
    userInfo,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    isAuthenticated: true,
    cookies: {
      accessToken,
      refreshToken,
      userInfo,
    },
    accessToken,
    admin: {
      id: foundAdmin?._id,
      name: foundAdmin?.name,
      email: foundAdmin?.email,
      phone: foundAdmin?.phone,
      status: foundAdmin?.status,
      role: foundAdmin?.role,
      permissions: foundAdmin.permissions,
    },
  });
});

exports.getAdmins = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    // role = "superAdmin",
    role,
    status,
    search,
    sortField = "createdAt",
    // sortOrder = "desc",
    sortOrder = "asc",
  } = req.query;

  const query = {};

  // Filters
  if (role) query.role = role;
  if (status) query.status = status;

  // Search in name, email, phone
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  // Sorting
  const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [admins, total] = await Promise.all([
    Admin.find(query)
      .select(
        "-password -refreshToken -passwordResetToken -passwordResetExpires"
      )
      .populate("createdBy", "name email role")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Admin.countDocuments(query),
  ]);

  res.json({
    success: true,
    admins,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
});

exports.getAdminDetails = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid admin ID", 400));
  }

  const admin = await Admin.findById(id)
    .select("-password -refreshToken -passwordResetToken -passwordResetExpires")
    .populate("createdBy", "name email role");

  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }

  res.json({
    success: true,
    admin,
  });
});

exports.updateAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const image = req?.file;

  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid admin ID", 400));
  }

  // Allowed fields for update
  const allowedFields = [
    "name",
    "email",
    "phone",
    "position",
    "role",
    "permissions",
    "status",
    "profileImage",
  ];

  // Build update object
  const updates = {};
  for (let key of allowedFields) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  if (req.body.permissions) {
    console.log("type of req.body.permissions", typeof req.body.permissions);

    updates.permissions = parseIfString(req.body.permissions);
  }

  // If role changes to superAdmin → give all permissions
  if (updates.role === "superAdmin") {
    updates.permissions = {
      dashboard: "read&write",
      admin: "read&write",
      job: "read&write",
      student: "read&write",
      review: "read&write",
    };
  }

  // Check for email uniqueness
  if (updates.email) {
    const emailExists = await Admin.findOne({
      email: updates.email,
      _id: { $ne: id },
    });
    if (emailExists) {
      return next(new AppError("Email already in use", 400));
    }
  }

  // Check for phone uniqueness
  if (updates.phone) {
    const phoneExists = await Admin.findOne({
      phone: updates.phone,
      _id: { $ne: id },
    });
    if (phoneExists) {
      return next(new AppError("Phone number already in use", 400));
    }
  }

  let imageUrl;
  if (image) {
    try {
      imageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading admin image:", error);
      return next(new AppError("Failed to upload admin image", 500));
    }
  }

  if (imageUrl) {
    updates.profileImage = imageUrl;
  }

  // Update admin
  const updatedAdmin = await Admin.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
    select: "-password -refreshToken -passwordResetToken -passwordResetExpires",
  }).populate("createdBy", "name email role");

  if (!updatedAdmin) {
    return next(new AppError("Admin not found", 404));
  }

  res.json({
    success: true,
    message: "Admin updated successfully",
    admin: updatedAdmin,
  });
});

exports.updateAdminStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive", "blocked"].includes(status)) {
    return next(
      new AppError("Status must be 'active' or 'inactive' or 'blocked'", 400)
    );
  }

  const updatedAdmin = await Admin.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedAdmin) {
    return next(new AppError("Admin not found", 404));
  }

  res.json({
    success: true,
    message: `Admin status updated to ${status}`,
    admin: updatedAdmin,
  });
});

exports.deleteAdmin = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // 1 Check if ID is provided
  if (!id) {
    return next(new AppError("Admin ID is required", 400));
  }

  // 2 Check if ID format is valid Mongo ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Admin ID format", 400));
  }

  // 3 Try to find and delete the job
  const deletedAdmin = await Admin.findByIdAndDelete(id);

  // 4 Check if job exists
  if (!deletedAdmin) {
    return next(new AppError("Admin not found", 404));
  }

  // 5 Return success response
  res.status(200).json({
    success: true,
    message: "Admin deleted successfully",
    admin: deletedAdmin,
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { _id: adminId } = req.user; // or from req.body or JWT token
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new AppError("Both old and new passwords are required", 400));
  }

  const admin = await Admin.findById(adminId).select("+password");
  if (!admin) {
    return next(new AppError("Admin not found", 404));
  }

  const isMatch = await bcrypt.compare(oldPassword, admin.password);
  if (!isMatch) {
    return next(new AppError("Old password is incorrect", 401));
  }

  admin.password = newPassword;
  await admin.save();

  res
    .status(200)
    .json({ success: true, message: "Password changed successfully" });
});

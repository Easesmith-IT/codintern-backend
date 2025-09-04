const HomeHeroSection = require("../models/content/HomeHeroSection");
const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { uploadImage } = require("../utils/fileUploadToAzure");
const parseIfString = require("../utils/parseIfString");

// ✅ Create HomeHeroSection
exports.upsertHomeHeroSection = catchAsync(async (req, res, next) => {
  const { id } = req.query; // optional: if passed → update, else create
  let data = req.body;

  const { image1, image2, image3 } = req.files || {};

  // 1. Parse JSON fields (coming as strings from FormData)
  data.banner1 = parseIfString(data.banner1);
  data.banner2 = parseIfString(data.banner2);
  data.banner3 = parseIfString(data.banner3);

  // 2. Handle uploaded images (async cloud upload)
  const uploadAndSet = async (file, field) => {
    try {
      const imageUrl = await uploadImage(file);
      data[field] = imageUrl;
    } catch (error) {
      console.error(`Error uploading ${field}:`, error);
      return next(new AppError(`Failed to upload ${field}`, 500));
    }
  };

  if (image1?.[0]) await uploadAndSet(image1[0], "image1");
  if (image2?.[0]) await uploadAndSet(image2[0], "image2");
  if (image3?.[0]) await uploadAndSet(image3[0], "image3");

  let heroSection;

  if (id) {
    // 🔹 Update
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid ID format", 400));
    }

    // Fetch existing doc first to avoid overwriting fields with ""
    const existing = await HomeHeroSection.findById(id);
    if (!existing) {
      return next(new AppError("HomeHeroSection not found", 404));
    }

    // Preserve existing images if not updated
    if (!data.image1) data.image1 = existing.image1;
    if (!data.image2) data.image2 = existing.image2;
    if (!data.image3) data.image3 = existing.image3;

    heroSection = await HomeHeroSection.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  } else {
    // 🔹 Create
    heroSection = await HomeHeroSection.create(data);
  }

  res.status(id ? 200 : 201).json({
    success: true,
    message: id
      ? "HomeHeroSection updated successfully"
      : "HomeHeroSection created successfully",
    data: heroSection,
  });
});

// ✅ Get all HomeHeroSections
exports.getHomeHeroSections = catchAsync(async (req, res, next) => {
  const heroSections = await HomeHeroSection.findOne();

  res.status(200).json({
    success: true,
    results: heroSections.length,
    data: heroSections,
  });
});

// ✅ Get single HomeHeroSection by ID
exports.getHomeHeroSectionById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid ID format", 400));
  }

  const heroSection = await HomeHeroSection.findById(id);

  if (!heroSection) {
    return next(new AppError("HomeHeroSection not found", 404));
  }

  res.status(200).json({
    success: true,
    data: heroSection,
  });
});

// controllers/contentController.js
const mongoose = require("mongoose");
const Content = require("../models/content/Content");
const catchAsync = require("../utils/catchAsync");
const parseIfString = require("../utils/parseIfString");
const { uploadImage } = require("../utils/fileUploadToAzure");
const AppError = require("../utils/appError");

// 🔹 Upsert content (create or update)
exports.upsertContentSection = catchAsync(async (req, res, next) => {
  const { id } = req.query; // optional: if passed → update, else create
  console.log("req.query", req.query);
  console.log("req.files", req.files);
  console.log("req.body", req.body);

  let data = req.body;

  const files = req.files || {};

  // 1. Handle JSON fields if sent as strings
  data.content = parseIfString(data.content);

  // 2. Handle uploaded images
  if (files.images) {
    const results = await Promise.allSettled(
      files.images.map((file) => uploadImage(file))
    );

    const successes = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length) {
      console.warn("Some image uploads failed:", failures);
      // optionally: return next(new AppError("Some uploads failed", 500));
    }

    console.log("results", results);

    // const uploadedImages = await Promise.all(
    //   files.images.map(async (file) => {
    //     try {
    //       return await uploadImage(file); // returns URL
    //     } catch (error) {
    //       console.error("Error uploading image:", error);
    //       return next(new AppError("Failed to upload image", 500));
    //     }
    //   })
    // );

    // console.log("uploadedImages", uploadedImages);

    data.images = successes.map((url) => ({ image: url }));
  }

  let contentSection;

  if (id) {
    // 🔹 Update
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid ID format", 400));
    }

    const existing = await Content.findById(id);
    if (!existing) {
      return next(new AppError("Content section not found", 404));
    }

    // Preserve existing images if none uploaded
    if (!data.images) data.images = existing.images;

    contentSection = await Content.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  } else {
    // 🔹 Create
    contentSection = await Content.create(data);
  }

  res.status(id ? 200 : 201).json({
    success: true,
    message: id
      ? "Content section updated successfully"
      : "Content section created successfully",
    data: contentSection,
  });
});

// 🔹 Get all sections for a page
exports.getContentByPage = catchAsync(async (req, res, next) => {
  const { pageName } = req.params;
  if (!pageName) return next(new AppError("Page name is required", 400));

  const sections = await Content.find({ pageName });
  res.status(200).json({ success: true, data: sections });
});

// exports.getContentByPage = catchAsync(async (req, res, next) => {
//   const { pageName, sectionName } = req.query;

//   if (!pageName || !sectionName) {
//     return next(
//       new AppError("Please provide both pageName and sectionName", 400)
//     );
//   }

//   const content = await Content.findOne({ pageName, sectionName });

//   if (!content) {
//     return res.status(404).json({
//       success: false,
//       message: `Content not found for page: ${pageName}, section: ${sectionName}`,
//     });
//   }

//   res.status(200).json({
//     success: true,
//     data: content,
//   });
// });

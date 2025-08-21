const courseService = require("../services/courseService");
const catchAsync = require("../utils/catchAsync");
const { uploadImage } = require("../utils/fileUploadToAzure");

// STEP 1: Create draft
exports.createCourse = catchAsync(async (req, res) => {
  const image = req?.file;
  let imageUrl;
  if (image) {
    try {
      imageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading job image:", error);
      return next(new AppError("Failed to upload job image", 500));
    }
  }
  const course = await courseService.createCourse({
    ...req.body,
    thumbnail: imageUrl,
  });
  res
    .status(201)
    .json({ success: true, message: "Course created successfully", course });
});

// STEP 2: Update details (pricing + certificate + highlights)
exports.updateCourseDetails = catchAsync(async (req, res, next) => {
  let { pricing, certificate, courseHighlights, studentBenefits } =
    req.body || {};
  certificate = JSON.parse(certificate);
  const image = req?.file;
  let imageUrl;
  console.log("image", image);

  if (image) {
    try {
      imageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading job image:", error);
      return next(new AppError("Failed to upload job image", 500));
    }
  }

  console.log("imageUrl", imageUrl);

  const update = {
    pricing: JSON.parse(pricing),
    certificate: {
      ...certificate,
      certificateLink: imageUrl ? imageUrl : certificate.certificateLink,
    },
    courseHighlights: JSON.parse(courseHighlights),
    studentBenefits: JSON.parse(studentBenefits),
  };
  const course = await courseService.updateCourse(req.params.id, update);
  res
    .status(200)
    .json({ success: true, message: "Course updated successfully", course });
});

// STEP 3: Add modules
exports.addModule = catchAsync(async (req, res) => {
  const course = await courseService.addModule(req.params.id, req.body);
  res
    .status(201)
    .json({ success: true, message: "Module added successfully", course });
});

// STEP 4: Update extras (projects + batches)
exports.updateCourseExtras = catchAsync(async (req, res) => {
  const update = {};
  if (req.body.projects) update.projects = req.body.projects;
  if (req.body.batches) update.batches = req.body.batches;

  const course = await courseService.updateCourse(req.params.id, update);
  res.status(200).json({
    success: true,
    message: "Projects and Batches added successfully",
    course,
  });
});

// STEP 5: Assign instructors + publish
exports.publishCourse = catchAsync(async (req, res, next) => {
  const course = await courseService.publishCourse(
    req.params.id,
    req.body,
    next
  );
  res
    .status(200)
    .json({ success: true, message: "Course published successfully", course });
});

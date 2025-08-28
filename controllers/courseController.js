const courseService = require("../services/courseService");
const AppError = require("../utils/appError");
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

// STEP 1: Edit basic course info
exports.updateCourseBasicInfo = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const image = req?.file;
  let imageUrl;

  // Handle thumbnail upload if provided
  if (image) {
    try {
      imageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      return next(new AppError("Failed to upload thumbnail", 500));
    }
  }

  // Prepare update object
  const updateData = {
    ...req.body,
    ...(imageUrl && { thumbnail: imageUrl }), // Only add thumbnail if new image was uploaded
  };

  const course = await courseService.updateCourse(id, updateData);

  res.status(200).json({
    success: true,
    message: "Course basic information updated successfully",
    course,
  });
});

// STEP 2: Update details (pricing + certificate + highlights)
exports.updateCourseDetails = catchAsync(async (req, res, next) => {
  let { pricing, certificate, courseHighlights, studentBenefits } =
    req.body || {};

  certificate = JSON.parse(certificate);

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
exports.addModules = catchAsync(async (req, res) => {
  const course = await courseService.addModules(
    req.params.id,
    req.body.modules
  );
  res
    .status(201)
    .json({ success: true, message: "Module added successfully", course });
});

// STEP 4: Update extras (projects + batches)
exports.updateCourseExtras = catchAsync(async (req, res) => {
  const update = {};

  if (req.body.projects) {
    let projects = JSON.parse(req.body.projects); // because form-data will stringify JSON

    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map(async (file) => {
          try {
            const url = await uploadImage(file); // your Azure upload helper
            return url;
          } catch (error) {
            console.error("Error uploading project icon:", error);
            throw new AppError("Failed to upload project icon", 500);
          }
        })
      );

      projects = projects.map((project, index) => ({
        ...project,
        icon: uploadedImages[index] || project.icon, // fallback if not uploaded
      }));
    }

    update.projects = projects;
  }

  if (req.body.batches) {
    update.batches = JSON.parse(req.body.batches);
  }

  const course = await courseService.updateCourse(req.params.id, update);

  res.status(200).json({
    success: true,
    message: "Projects and Batches added successfully",
    course,
  });
});

// STEP 5: Additional Info (career + materials + features + venue)
exports.updateAdditionalDetails = catchAsync(async (req, res, next) => {
  const {
    courseDuration,
    classTiming,
    totalSeats,
    interviews,
    integratedInternship,
  } = req.body;
  const { brochure = [], syllabusFile = [], featureIcons = [] } = req.files;

  console.log("req.files", req.files);

  const update = {
    courseDuration,
    classTiming,
    totalSeats,
    interviews,
    integratedInternship: JSON.parse(integratedInternship),
  };

  if (req.body.features) {
    let features = JSON.parse(req.body.features); // because form-data will stringify JSON

    if (featureIcons && featureIcons?.length > 0) {
      const uploadedImages = await Promise.all(
        featureIcons.map(async (file) => {
          try {
            const url = await uploadImage(file); // your Azure upload helper
            return url;
          } catch (error) {
            console.error("Error uploading icon:", error);
            throw new AppError("Failed to upload feature icons", 500);
          }
        })
      );

      features = features.map((feature, index) => ({
        ...feature,
        icon: uploadedImages[index] || feature.icon, // fallback if not uploaded
      }));
    }

    update.features = features;
  }

  if (brochure[0]) {
    let imageUrl;

    try {
      imageUrl = await uploadImage(brochure[0]);
    } catch (error) {
      console.error("Error uploading image:", error);
      return next(new AppError("Failed to upload brochure pdf", 500));
    }
    update.brochure = imageUrl;
  }

  if (syllabusFile[0]) {
    let imageUrl;

    try {
      imageUrl = await uploadImage(syllabusFile[0]);
    } catch (error) {
      console.error("Error uploading image:", error);
      return next(new AppError("Failed to upload syllabus pdf", 500));
    }
    update.syllabusFile = imageUrl;
  }

  const course = await courseService.updateCourse(req.params.id, update);

  res.status(200).json({
    success: true,
    message: "Course info updated successfully",
    course,
  });
});

// STEP 6: Assign instructors + publish
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

exports.updateCourseStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const course = await courseService.updateCourse(id, { status });

  res.status(200).json({
    success: true,
    message: `Course status updated to ${status}`,
    course,
  });
});

// Get all courses with filtering, pagination and search
exports.getCourses = catchAsync(async (req, res, next) => {
  const result = await courseService.getCourses(req.query);

  res.json({
    success: true,
    pagination: result.pagination,
    courses: result.courses,
  });
});

// Get course details by ID, customId or slug
exports.getCourseDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const course = await courseService.getCourseById(id);

  res.status(200).json({
    success: true,
    course,
  });
});

// Delete course
exports.deleteCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  console.log("req.body", req.query);

  const { deleteType = "soft" } = req.query;

  const result = await courseService.deleteCourse(id, deleteType);

  res.status(200).json({
    success: true,
    message: result.message,
    deleteType: result.deleteType,
    course: result.deleteType === "soft" ? result.course : null,
  });
});

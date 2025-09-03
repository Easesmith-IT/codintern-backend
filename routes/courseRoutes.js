const express = require("express");
const {
  createCourse,
  updateCourseBasicInfo,
  updateCourseDetails,
  updateCourseExtras,
  publishCourse,
  addModules,
  updateAdditionalDetails,
  updateCourseStatus,
  getCourses,
  getCourseDetails,
  deleteCourse,
} = require("../controllers/courseController");
const {
  addModulesSchema,
  createCourseSchema,
  updateDetailsSchema,
  updateExtrasSchema,
  publishSchema,
  updateAdditionalSchema,
  updateStatusSchema,
  deleteCourseSchema,
} = require("../validations/courseValidation");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/imgUpload");
const router = express.Router();

// STEP 1: Draft
router.post(
  "/create",
  validate(createCourseSchema),
  upload.single("thumbnail"),
  createCourse
);

// STEP 1: Edit basic course info
router.patch(
  "/:id/edit",
  validate(createCourseSchema),
  upload.single("thumbnail"),
  updateCourseBasicInfo
);

// STEP 2: Details
router.patch(
  "/:id/details",
  validate(updateDetailsSchema),
  upload.single("image"),
  updateCourseDetails
);

// STEP 3: Modules
router.post("/:id/modules", validate(addModulesSchema), addModules);

// STEP 4: Extras
router.patch(
  "/:id/extras",
  upload.fields([
    { name: "projectImages", maxCount: 10 }, // multiple images for projects
    { name: "batchImages", maxCount: 10 }, // multiple images for batches
  ]),
  // validate(updateExtrasSchema),
  updateCourseExtras
);

// STEP 5: Update additional course details
router.put(
  "/:id/update-additional",
  validate(updateAdditionalSchema),
  upload.fields([
    { name: "brochure", maxCount: 1 },
    { name: "syllabusFile", maxCount: 1 },
    { name: "featureIcons", maxCount: 10 }, // multiple icons for features
  ]),
  updateAdditionalDetails
);

// STEP 5: Publish
router.patch("/:id/publish", validate(publishSchema), publishCourse);

router.patch("/:id/status", validate(updateStatusSchema), updateCourseStatus);

// GET Routes
// Get all courses with filtering, pagination and search
router.get("/", getCourses);

// Get course details by ID, customId or slug
router.get("/:id", getCourseDetails);

// DELETE Routes
// Delete course (soft delete by default, hard delete if specified)
router.delete("/:id", validate(deleteCourseSchema), deleteCourse);

module.exports = router;

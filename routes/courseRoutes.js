const express = require("express");
const {
  createCourse,
  updateCourseDetails,
  updateCourseExtras,
  publishCourse,
  addModules,
  updateAdditionalDetails,
  updateCourseStatus,
} = require("../controllers/courseController");
const {
  addModulesSchema,
  createCourseSchema,
  updateDetailsSchema,
  updateExtrasSchema,
  publishSchema,
  updateAdditionalSchema,
  updateStatusSchema,
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
  validate(updateExtrasSchema),
  upload.array("projectImages"),
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

module.exports = router;

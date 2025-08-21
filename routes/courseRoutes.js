const express = require("express");
const {
  createCourse,
  updateCourseDetails,
  addModule,
  updateCourseExtras,
  publishCourse,
} = require("../controllers/courseController");
const {
  addModuleSchema,
  createCourseSchema,
  updateDetailsSchema,
  updateExtrasSchema,
  publishSchema,
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
router.post("/:id/modules", validate(addModuleSchema), addModule);

// STEP 4: Extras
router.patch("/:id/extras", validate(updateExtrasSchema), updateCourseExtras);

// STEP 5: Publish
router.patch("/:id/publish", validate(publishSchema), publishCourse);

module.exports = router;

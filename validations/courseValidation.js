const Joi = require("joi");

// STEP 1: Draft (basic + media)
exports.createCourseSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  overview: Joi.string().required(),
  category: Joi.string().required(),
  subCategory: Joi.string().optional(),
  level: Joi.string().valid("beginner", "intermediate", "advanced"),
  language: Joi.string().default("English"),
  thumbnail: Joi.string().uri().optional(),
  introVideo: Joi.string().uri().optional(),
});

// STEP 2: Details (pricing + certificate + highlights)
exports.updateDetailsSchema = Joi.object({
  pricing: Joi.object({
    price: Joi.number().min(0).required(),
    discountPrice: Joi.number().min(0).optional(),
    currency: Joi.string().default("INR"),
    isFree: Joi.boolean().default(false),
  }).required(),

  certificate: Joi.object({
    title: Joi.string().required(),
    provider: Joi.string().optional(),
    certificateLink: Joi.string().uri().optional(),
    issueDate: Joi.date().optional(),
    expiryDate: Joi.date().optional(),
  }).optional(),

  courseHighlights: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().required(),
        type: Joi.string().valid(
          "feature",
          "highlight",
          "certification",
          "update"
        ),
        value: Joi.string().optional(),
      })
    )
    .optional(),

  studentBenefits: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().required(),
        type: Joi.string().valid(
          "feature",
          "highlight",
          "certification",
          "update"
        ),
        value: Joi.string().optional(),
      })
    )
    .optional(),
});

// STEP 3: Module + lessons
exports.addModuleSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  lessons: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        contentType: Joi.string()
          .valid("video", "article", "quiz", "assignment")
          .required(),
        contentUrl: Joi.string().uri().optional(),
        duration: Joi.number().min(1).required(),
        isPreviewFree: Joi.boolean().optional(),
      })
    )
    .min(1)
    .required(),
});

// STEP 4: Extras (projects + batches)
exports.updateExtrasSchema = Joi.object({
  projects: Joi.array()
    .items(
      Joi.object({
        icon: Joi.string().optional(),
        title: Joi.string().required(),
        description: Joi.string().required(),
        tools: Joi.array().items(Joi.string()).optional(),
      })
    )
    .optional(),

  batches: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().optional(),
        schedule: Joi.object({
          days: Joi.array().items(Joi.string()).min(1).required(),
          time: Joi.object({
            start: Joi.string().required(),
            end: Joi.string().required(),
          }).required(),
        }).required(),
        seatsLimit: Joi.number().default(50),
        price: Joi.number().min(0).required(),
        offerPrice: Joi.number().min(0).optional(),
        status: Joi.string()
          .valid("upcoming", "ongoing", "completed")
          .default("upcoming"),
        batchHighlights: Joi.array().items(Joi.string()).optional(),
      })
    )
    .optional(),
});

// STEP 5: Publish
exports.publishSchema = Joi.object({
  instructors: Joi.array().items(Joi.string()).min(1).required(),
  publish: Joi.boolean().default(false),
});

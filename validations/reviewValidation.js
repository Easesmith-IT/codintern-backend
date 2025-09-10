const Joi = require("joi");

exports.reviewSchema = Joi.object({
  platform: Joi.string().trim().optional(),
  rating: Joi.number().min(0).max(5).precision(1).required(),
  reviewText: Joi.string().min(10).required(),
  reviewerName: Joi.string().trim().required(),
  reviewerRole: Joi.string().trim().optional().default("User"),
  status: Joi.string().valid("active", "inactive").default("active"),
  category: Joi.string().valid("General", "Course").required(),
  course: Joi.when("category", {
    is: "Course",
    then: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid Course ID format",
      }),
    otherwise: Joi.forbidden(),
  }),
});

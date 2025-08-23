const Joi = require("joi");

// Create instructor validation
exports.createInstructorSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().email().lowercase().required(),
  phone: Joi.string().optional(),
  password: Joi.string().min(6).required(),
  bio: Joi.string().max(2000).optional(),
  expertise: Joi.array().items(Joi.string()).optional(),
  
  socialLinks: Joi.object({
    linkedin: Joi.string().uri().optional(),
    twitter: Joi.string().uri().optional(),
    github: Joi.string().uri().optional(),
    website: Joi.string().uri().optional(),
  }).optional(),

  certifications: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      provider: Joi.string().optional(),
      year: Joi.number().min(1900).max(new Date().getFullYear()).optional(),
      certificateLink: Joi.string().uri().optional(),
    })
  ).optional(),

  achievements: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().optional(),
      date: Joi.date().optional(),
    })
  ).optional(),

  isActive: Joi.boolean().default(true),
});

// Update instructor validation
exports.updateInstructorSchema = Joi.object({
  firstName: Joi.string().trim().optional(),
  lastName: Joi.string().trim().optional(),
  email: Joi.string().email().lowercase().optional(),
  phone: Joi.string().optional(),
  password: Joi.string().min(6).optional(),
  bio: Joi.string().max(2000).optional(),
  expertise: Joi.array().items(Joi.string()).optional(),
  
  socialLinks: Joi.object({
    linkedin: Joi.string().uri().optional(),
    twitter: Joi.string().uri().optional(),
    github: Joi.string().uri().optional(),
    website: Joi.string().uri().optional(),
  }).optional(),

  certifications: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      provider: Joi.string().optional(),
      year: Joi.number().min(1900).max(new Date().getFullYear()).optional(),
      certificateLink: Joi.string().uri().optional(),
    })
  ).optional(),

  achievements: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().optional(),
      date: Joi.date().optional(),
    })
  ).optional(),

  isActive: Joi.boolean().optional(),
});

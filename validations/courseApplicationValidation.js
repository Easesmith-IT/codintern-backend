const Joi = require("joi");

// Create CourseApplication validation schema
exports.createCourseApplicationSchema = Joi.object({
  student: Joi.string().optional(), // ObjectId as string, optional if provided by auth middleware
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().lowercase().trim().required(),
  education: Joi.string().required(),
  graduationYear: Joi.number().integer().min(1950).max(new Date().getFullYear() + 10).required(),
  course: Joi.string().required(), // ObjectId as string
});

// Update CourseApplication validation schema (for admin/instructor updates)
exports.updateCourseApplicationSchema = Joi.object({
  status: Joi.string().valid("pending", "reviewed", "accepted", "rejected").optional(),
  notes: Joi.object({
    remark: Joi.string().required(),
    addedBy: Joi.string().required(), // ObjectId as string
    addedByModel: Joi.string().valid("Admin", "Instructor").required(),
  }).optional(),
}).min(1); // At least one field must be provided

// Get CourseApplications query validation
exports.getCourseApplicationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid("pending", "reviewed", "accepted", "rejected").optional(),
  course: Joi.string().optional(), // ObjectId as string
  search: Joi.string().optional(), // For searching by name or email
  sortBy: Joi.string().valid("appliedAt", "firstName", "lastName", "email", "status").default("appliedAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

// Update status validation schema
exports.updateStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "reviewed", "accepted", "rejected").required(),
  remark: Joi.string().optional(), // Optional note when updating status
  updatedBy: Joi.string().required(), // ObjectId as string
  updatedByModel: Joi.string().valid("Admin", "Instructor").required(),
});

// Delete CourseApplication validation schema
exports.deleteCourseApplicationSchema = Joi.object({
  deleteType: Joi.string().valid('soft', 'hard').default('soft').optional(),
});

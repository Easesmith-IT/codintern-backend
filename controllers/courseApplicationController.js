const courseApplicationService = require("../services/courseApplicationService");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Create new course application
exports.createCourseApplication = catchAsync(async (req, res) => {
  const applicationData = {
    ...req.body,
    // If student is authenticated, add student ID from auth middleware
    // student: req.user?.id, // Uncomment if you have auth middleware
  };

  const application =
    await courseApplicationService.createCourseApplication(applicationData);

  res.status(201).json({
    success: true,
    message: "Course application submitted successfully",
    application,
  });
});

// Get all course applications with filtering, pagination and search
exports.getCourseApplications = catchAsync(async (req, res) => {
  const result = await courseApplicationService.getCourseApplications(
    req.query
  );

  res.json({
    success: true,
    pagination: result.pagination,
    applications: result.applications,
  });
});

// Get course application by ID
exports.getCourseApplicationById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const application =
    await courseApplicationService.getCourseApplicationById(id);

  res.status(200).json({
    success: true,
    application,
  });
});

// Update course application
exports.updateCourseApplication = catchAsync(async (req, res) => {
  const { id } = req.params;
  const application = await courseApplicationService.updateCourseApplication(
    id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Course application updated successfully",
    application,
  });
});

// Update application status (for admin/instructor use)
exports.updateApplicationStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const statusData = {
    ...req.body,
    // These should be set by authentication middleware based on user role
    // updatedBy: req.user?.id,
    // updatedByModel: req.user?.role === 'admin' ? 'Admin' : 'Instructor',
  };

  const application = await courseApplicationService.updateApplicationStatus(
    id,
    statusData
  );

  res.status(200).json({
    success: true,
    message: `Application status updated to ${req.body.status}`,
    application,
  });
});

// Get applications by student (for student dashboard)
exports.getMyApplications = catchAsync(async (req, res) => {
  // This would typically get the student ID from authenticated user
  // const studentId = req.user.id;
  const { studentId } = req.params; // For now, get from params

  const result = await courseApplicationService.getApplicationsByStudent(
    studentId,
    req.query
  );

  res.json({
    success: true,
    pagination: result.pagination,
    applications: result.applications,
  });
});

// Get applications by course (for admin/instructor course management)
exports.getApplicationsByCourse = catchAsync(async (req, res) => {
  console.log("");
  
  const { courseId } = req.params;
  const result = await courseApplicationService.getApplicationsByCourse(
    courseId,
    req.query
  );

  res.json({
    success: true,
    pagination: result.pagination,
    applications: result.applications,
  });
});

exports.exportApplicationsByCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const csv = await courseApplicationService.exportApplicationsByCourse(
    courseId,
    req.query
  );

  res.header("Content-Type", "text/csv");
  res.attachment("applications.csv");
  res.send(csv);
});

// Delete course application
exports.deleteCourseApplication = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { deleteType = "soft" } = req.query;

  const result = await courseApplicationService.deleteCourseApplication(
    id,
    deleteType
  );

  res.status(200).json({
    success: true,
    message: result.message,
    deleteType: result.deleteType,
    application: result.deleteType === "soft" ? result.application : null,
  });
});

// Get application statistics
exports.getApplicationStats = catchAsync(async (req, res) => {
  const stats = await courseApplicationService.getApplicationStats(req.query);

  res.json({
    success: true,
    stats,
  });
});

// Add note to application (admin/instructor only)
exports.addNoteToApplication = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!remark) {
    throw new AppError("Remark is required", 400);
  }

  const updateData = {
    notes: {
      remark,
      // These should be set by authentication middleware
      // addedBy: req.user?.id,
      // addedByModel: req.user?.role === 'admin' ? 'Admin' : 'Instructor',
      addedBy: req.body.addedBy, // For now, get from request body
      addedByModel: req.body.addedByModel, // For now, get from request body
    },
  };

  const application = await courseApplicationService.updateCourseApplication(
    id,
    updateData
  );

  res.status(200).json({
    success: true,
    message: "Note added successfully",
    application,
  });
});

// Bulk update application statuses (admin only)
exports.bulkUpdateApplicationStatus = catchAsync(async (req, res) => {
  const { applicationIds, status, remark } = req.body;

  if (
    !applicationIds ||
    !Array.isArray(applicationIds) ||
    applicationIds.length === 0
  ) {
    throw new AppError("Application IDs array is required", 400);
  }

  if (
    !status ||
    !["pending", "reviewed", "accepted", "rejected"].includes(status)
  ) {
    throw new AppError("Valid status is required", 400);
  }

  const statusData = {
    status,
    remark,
    // These should be set by authentication middleware
    // updatedBy: req.user?.id,
    // updatedByModel: req.user?.role === 'admin' ? 'Admin' : 'Instructor',
    updatedBy: req.body.updatedBy, // For now, get from request body
    updatedByModel: req.body.updatedByModel, // For now, get from request body
  };

  const updatedApplications = [];
  const errors = [];

  // Process each application
  for (const applicationId of applicationIds) {
    try {
      const application =
        await courseApplicationService.updateApplicationStatus(
          applicationId,
          statusData
        );
      updatedApplications.push(application);
    } catch (error) {
      errors.push({
        applicationId,
        error: error.message,
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Bulk update completed. ${updatedApplications.length} applications updated successfully.`,
    updated: updatedApplications.length,
    errors: errors.length,
    updatedApplications: updatedApplications.map((app) => ({
      id: app._id,
      status: app.status,
    })),
    failedUpdates: errors,
  });
});

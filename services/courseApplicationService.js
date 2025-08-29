const CourseApplication = require("../models/course/CourseApplication");
const AppError = require("../utils/appError");
const { Parser } = require("json2csv");

// Create new course application
exports.createCourseApplication = async (data) => {
  // Check if student has already applied for this course
  if (data.student) {
    const existingApplication = await CourseApplication.findOne({
      student: data.student,
      course: data.course,
    });

    if (existingApplication) {
      throw new AppError("Student has already applied for this course", 400);
    }
  } else {
    // Check by email if no student ID provided
    const existingApplication = await CourseApplication.findOne({
      email: data.email,
      course: data.course,
    });

    if (existingApplication) {
      throw new AppError(
        "Email has already been used to apply for this course",
        400
      );
    }
  }

  const courseApplication = new CourseApplication(data);
  return await courseApplication.save();
};

// Get all course applications with filtering, pagination and search
exports.getCourseApplications = async (queryParams) => {
  let {
    page = 1,
    limit = 10,
    status,
    course,
    search,
    sortBy = "appliedAt",
    sortOrder = "desc",
  } = queryParams;

  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  // Build query object
  let query = {};

  if (
    status &&
    ["pending", "reviewed", "accepted", "rejected"].includes(status)
  ) {
    query.status = status;
  }

  if (course) {
    query.course = course;
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { education: { $regex: search, $options: "i" } },
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const totalApplications = await CourseApplication.countDocuments(query);
  const applications = await CourseApplication.find(query)
    .populate("course", "title category level")
    .populate("student", "firstName lastName email phone")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    applications,
    pagination: {
      totalPages: Math.ceil(totalApplications / limit),
      page,
      limit,
      totalApplications,
    },
  };
};

// Get course application by ID
exports.getCourseApplicationById = async (id) => {
  const application = await CourseApplication.findById(id)
    .populate("course", "title category level pricing")
    .populate("student", "firstName lastName email phone")
    .populate("notes.addedBy", "firstName lastName email")
    .populate("statusHistory.changedBy", "firstName lastName email");

  if (!application) {
    throw new AppError("Course application not found", 404);
  }

  return application;
};

// Update course application
exports.updateCourseApplication = async (id, updateData) => {
  const application = await CourseApplication.findById(id);

  if (!application) {
    throw new AppError("Course application not found", 404);
  }

  // Handle status update with history tracking
  if (updateData.status && updateData.status !== application.status) {
    // Add to status history
    application.statusHistory.push({
      status: updateData.status,
      changedBy: updateData.updatedBy,
      changedByModel: updateData.updatedByModel,
      changedAt: new Date(),
    });

    application.status = updateData.status;
  }

  // Handle notes addition
  if (updateData.notes) {
    application.notes.push({
      remark: updateData.notes.remark,
      addedBy: updateData.notes.addedBy,
      addedByModel: updateData.notes.addedByModel,
      createdAt: new Date(),
    });
  }

  // Update other fields
  const allowedUpdates = [
    "firstName",
    "lastName",
    "phone",
    "email",
    "education",
    "graduationYear",
  ];
  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      application[field] = updateData[field];
    }
  });

  return await application.save();
};

// Update application status (separate method for cleaner API)
exports.updateApplicationStatus = async (id, statusData) => {
  const application = await CourseApplication.findById(id);

  if (!application) {
    throw new AppError("Course application not found", 404);
  }

  if (statusData.status === application.status) {
    throw new AppError("Application is already in this status", 400);
  }

  // Add to status history
  application.statusHistory.push({
    status: statusData.status,
    changedBy: statusData.updatedBy,
    changedByModel: statusData.updatedByModel,
    changedAt: new Date(),
  });

  // Add optional remark as note
  if (statusData.remark) {
    application.notes.push({
      remark: statusData.remark,
      addedBy: statusData.updatedBy,
      addedByModel: statusData.updatedByModel,
      createdAt: new Date(),
    });
  }

  application.status = statusData.status;
  return await application.save();
};

// Get applications by student ID
exports.getApplicationsByStudent = async (studentId, queryParams) => {
  let {
    page = 1,
    limit = 10,
    status,
    sortBy = "appliedAt",
    sortOrder = "desc",
  } = queryParams;

  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  let query = { student: studentId };

  if (
    status &&
    ["pending", "reviewed", "accepted", "rejected"].includes(status)
  ) {
    query.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const totalApplications = await CourseApplication.countDocuments(query);
  const applications = await CourseApplication.find(query)
    .populate("course", "title category level pricing thumbnail")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    applications,
    pagination: {
      totalPages: Math.ceil(totalApplications / limit),
      page,
      limit,
      totalApplications,
    },
  };
};

// Get applications by course ID
exports.getApplicationsByCourse = async (courseId, queryParams) => {
  let {
    page = 1,
    limit = 10,
    status,
    search,
    sortBy = "appliedAt",
    sortOrder = "desc",
  } = queryParams;

  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  let query = { course: courseId };

  if (
    status &&
    ["pending", "reviewed", "accepted", "rejected"].includes(status)
  ) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const totalApplications = await CourseApplication.countDocuments(query);
  const applications = await CourseApplication.find(query)
    .populate("student", "firstName lastName email phone")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    applications,
    pagination: {
      totalPages: Math.ceil(totalApplications / limit),
      page,
      limit,
      totalApplications,
    },
  };
};

exports.exportApplicationsByCourse = async (courseId, queryParams) => {
  let { from, to } = queryParams;

  let query = { course: courseId };
  if (from || to) {
    query.appliedAt = {};
    if (from) {
      from = new Date(from).toISOString(); // ensure valid format
      query.appliedAt.$gte = new Date(from);
    }
    if (to) {
      to = new Date(to).toISOString();
      query.appliedAt.$lte = new Date(to);
    }
  }

  const fields = [
    "firstName",
    "lastName",
    "phone",
    "email",
    "education",
    "graduationYear",
  ];

  const records = await CourseApplication.find(query)
    .select(fields.join(" "))
    .lean();

  console.log("records", records);

  const parser = new Parser({ fields });
  const csv = parser.parse(records);

  return csv;
};

// Delete course application
exports.exportApplicationsByCourse = async (courseId, queryParams) => {
  let { from, to } = queryParams;

  let query = { course: courseId };
  if (from || to) {
    query.appliedAt = {};
    if (from) {
      const fromDate = new Date(from);
      query.appliedAt.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      // push to end of the day
      toDate.setHours(23, 59, 59, 999);
      query.appliedAt.$lte = toDate;
    }
  }

  const fields = [
    "firstName",
    "lastName",
    "phone",
    "email",
    "education",
    "graduationYear",
    "appliedAt",
  ];

  let records = await CourseApplication.find(query)
    .select(fields.join(" "))
    .lean();

    records = records.map((r) => ({
      ...r,
      appliedAt: r.appliedAt
        ? new Date(r.appliedAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    }));

  const parser = new Parser({ fields });
  const csv = parser.parse(records);

  return csv;
};


// Get application statistics
exports.getApplicationStats = async (queryParams = {}) => {
  const { course, dateFrom, dateTo } = queryParams;

  let matchStage = {};

  if (course) {
    matchStage.course = course;
  }

  if (dateFrom || dateTo) {
    matchStage.appliedAt = {};
    if (dateFrom) matchStage.appliedAt.$gte = new Date(dateFrom);
    if (dateTo) matchStage.appliedAt.$lte = new Date(dateTo);
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ];

  const stats = await CourseApplication.aggregate(pipeline);

  // Convert to object format
  const statusStats = {
    pending: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
    total: 0,
  };

  stats.forEach((stat) => {
    statusStats[stat._id] = stat.count;
    statusStats.total += stat.count;
  });

  return statusStats;
};

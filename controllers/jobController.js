const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Job = require("../models/jobModel");
const mongoose = require("mongoose");
const { uploadImage } = require("../utils/fileUploadToAzure");
const JobApplication = require("../models/jobApplication");

exports.createJob = catchAsync(async (req, res, next) => {
  const {
    title,
    postingDate,
    status,
    category,
    city,
    state,
    country,
    education,
    aboutCompany,
    aboutJob,
    rolesAndReponsibilities,
    goodToHave,
    company,
    externalLink,
    jobId,
  } = req.body;

  const image = req?.file;

  // basic validation
  if (
    !title ||
    !status ||
    !category ||
    !city ||
    !state ||
    !country ||
    !aboutCompany ||
    !company ||
    !aboutJob ||
    !rolesAndReponsibilities ||
    !goodToHave ||
    !education?.length ||
    !image
  ) {
    return next(new AppError("All required fields must be filled", 400));
  }

  // check for duplicates
  const existingJob = await Job.findOne({
    title: title.trim(),
    company: company.trim(),
    city: city.trim(),
    state: state.trim(),
    country: country.trim(),
    jobId: jobId.trim(),
  });

  if (existingJob) {
    return next(new AppError("A job with these details already exists", 400));
  }

  let imageUrl;
  if (image) {
    try {
      imageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading job image:", error);
      return next(new AppError("Failed to upload job image", 500));
    }
  }

  const newJob = new Job({
    jobImage: imageUrl,
    title,
    postingDate,
    status,
    category,
    city,
    state,
    country,
    education: JSON.parse(education),
    company,
    aboutCompany,
    aboutJob,
    rolesAndReponsibilities,
    goodToHave,
    externalLink,
    jobId,
  });

  const savedJob = await newJob.save();
  return res.status(201).json({
    success: true,
    message: "Job created successfully",
    job: savedJob,
  });
});

exports.updateJob = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const image = req?.file;
  const jobData = req.body;

  // Prevent status updates here
  // if (jobData.status) {
  //   return next(new AppError("Use the /status endpoint to update status", 400));
  // }

  let imageUrl;
  if (image) {
    try {
      imageUrl = await uploadImage(image);
    } catch (error) {
      console.error("Error uploading job image:", error);
      return next(new AppError("Failed to upload job image", 500));
    }
  }

  const updatedJob = await Job.findByIdAndUpdate(
    id,
    {
      ...jobData,
      education: JSON.parse(jobData?.education),
      ...(imageUrl && { jobImage: imageUrl }),
    },
    {
      new: true,
      // runValidators: true,
    }
  );

  if (!updatedJob) {
    return next(new AppError("Job not found", 404));
  }

  res.json({
    success: true,
    message: "Job updated successfully",
    job: updatedJob,
  });
});

exports.updateJobStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return next(new AppError("Status must be 'active' or 'inactive'", 400));
  }

  const updatedJob = await Job.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedJob) {
    return next(new AppError("Job not found", 404));
  }

  res.json({
    success: true,
    message: `Job status updated to ${status}`,
    job: updatedJob,
  });
});

exports.getJobs = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10, status, category, search } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;

  // Build query object
  let query = {};

  if (status && ["active", "inactive"].includes(status.toLowerCase())) {
    query.status = status.toLowerCase();
  }

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { aboutCompany: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { state: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
    ];
  }

  const totalJobs = await Job.countDocuments(query);
  const jobs = await Job.aggregate([
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "jobapplications", // collection name (check in MongoDB, usually lowercase + plural)
        localField: "_id",
        foreignField: "jobId",
        as: "applications",
      },
    },
    {
      $addFields: {
        applicationCount: { $size: "$applications" },
      },
    },
    {
      $project: {
        applications: 0, // hide actual applications array
      },
    },
  ]);

  res.json({
    success: true,
    pagination: {
      totalPages: Math.ceil(totalJobs / limit),
      page,
      limit,
      totalJobs,
    },
    jobs,
  });
});

exports.getJobDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let job;

  // Check if it's MongoDB ObjectId
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    job = await Job.findById(id);
  } else {
    // Else search by customId
    job = await Job.findOne({ customId: id });
  }

  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  res.status(200).json({
    success: true,
    job,
  });
});

exports.deleteJob = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // 1️⃣ Check if ID is provided
  if (!id) {
    return next(new AppError("Job ID is required", 400));
  }

  // 2️⃣ Check if ID format is valid Mongo ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Job ID format", 400));
  }

  // 3️⃣ Try to find and delete the job
  const deletedJob = await Job.findByIdAndDelete(id);

  // 4️⃣ Check if job exists
  if (!deletedJob) {
    return next(new AppError("Job not found", 404));
  }

  // 5️⃣ Return success response
  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
    job: deletedJob,
  });
});

exports.getJobApplications = catchAsync(async (req, res, next) => {
  const { id } = req.params; // jobId
  let { page = 1, limit = 10, status, search } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Job ID is required",
    });
  }

  // build query
  let query = { jobId: id };

  if (
    status &&
    ["pending", "reviewed", "shortlisted", "rejected", "accepted"].includes(
      status.toLowerCase()
    )
  ) {
    query.status = status.toLowerCase();
  }

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
    ];
  }

  // get counts
  const totalApplications = await JobApplication.countDocuments(query);

  // get applications with pagination
  const applications = await JobApplication.find(query)
    .populate("jobId", "title company category postingDate")
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    pagination: {
      totalPages: Math.ceil(totalApplications / limit),
      page,
      limit,
      totalApplications,
    },
    applications,
  });
});

exports.updateJobApplicationStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, note } = req.body;

  // Ensure status is valid
  const allowedStatuses = [
    "pending",
    "reviewed",
    "shortlisted",
    "rejected",
    "accepted",
  ];
  if (!allowedStatuses.includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  const application = await JobApplication.findById(id);
  if (!application) {
    return next(new AppError("Job application not found", 404));
  }

  // Update status
  application.status = status;

  // Push history entry
  application.statusHistory.push({
    status,
    changedBy: req.user?._id, // assumes you set req.user in auth middleware
    note,
  });

  await application.save();

  res.status(200).json({
    success: true,
    message: "Status updated successfully",
    data: application,
  });
});

exports.getJobApplicationDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const application = await JobApplication.findById(id)
    .populate("jobId", "title company") // get job title + company name
    .populate("statusHistory.changedBy", "name email"); // who updated status

  if (!application) {
    return next(new AppError("Job application not found", 404));
  }

  res.status(200).json({
    success: true,
    data: application,
  });
});

const JobApplication = require("../models/jobApplication");
const Job = require("../models/jobModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getJobs = catchAsync(async (req, res, next) => {
  let {
    page = 1,
    limit = 10,
    status,
    category,
    search,
    getAll = false,
  } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  getAll = getAll === "true" || getAll === true; // ensure boolean

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

  let jobsQuery = Job.find(query).sort({ createdAt: -1 }); // latest first

  if (!getAll) {
    const skip = (page - 1) * limit;
    jobsQuery = jobsQuery.skip(skip).limit(limit);
  }

  const jobs = await jobsQuery;

  res.json({
    success: true,
    ...(getAll
      ? {}
      : {
          pagination: {
            totalPages: Math.ceil(totalJobs / limit),
            page,
            limit,
            totalJobs,
          },
        }),
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

exports.applyJob = catchAsync(async (req, res, next) => {
  const {
    fullName,
    dateOfBirth,
    gender,
    email,
    phoneNumber,
    jobId,
    userId,
    resumeUrl,
    coverLetter,
  } = req.body;

  console.log("req.body", req.body);

  // Validate required fields
  if (
    !fullName ||
    !dateOfBirth ||
    !gender ||
    !email ||
    !phoneNumber ||
    !jobId
  ) {
    return next(new AppError("Missing required fields", 400));
  }

  // Check if job exists
  const job = await Job.findById(jobId);
  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  // Prevent duplicate applications by same user for same job
  const existingApplication = await JobApplication.findOne({ jobId, email });
  if (existingApplication) {
    return next(new AppError("You have already applied for this job", 400));
  }

  // Create job application
  const application = new JobApplication({
    fullName,
    dateOfBirth,
    gender,
    email,
    phoneNumber,
    jobId,
    resumeUrl,
    coverLetter,
  });

  await application.save();

  res.status(201).json({
    message: "Job application submitted successfully",
    application,
  });
});

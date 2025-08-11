const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Job = require("../models/jobModel");
const mongoose = require("mongoose");

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
  });

  if (existingJob) {
    return next(new AppError("A job with these details already exists", 400));
  }

  const newJob = new Job({
    jobImage: image.path,
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

  console.log("image", image);
  

  const updatedJob = await Job.findByIdAndUpdate(
    id,
    {
      ...jobData,
      education: JSON.parse(jobData?.education),
      ...(image?.path && {jobImage: image?.path || ""})
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
  const jobs = await Job.find(query)
    .sort({ createdAt: -1 }) // latest first
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    pagination: {
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: page,
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
    status: "success",
    message: "Job deleted successfully",
    job: deletedJob,
  });
});

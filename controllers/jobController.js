const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Job = require("../models/jobModel");

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
  } = req.body;

  const image = req?.file;
  console.log("image", req?.file);
  console.log("body", req.body);

  // basic validation
  if (
    !title ||
    !status ||
    !category ||
    !city ||
    !state ||
    !country ||
    !aboutCompany ||
    !aboutJob ||
    !rolesAndReponsibilities ||
    !goodToHave ||
    !education?.length ||
    !image
  ) {
    return next(new AppError("All required fields must be filled", 400));
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
    education,
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

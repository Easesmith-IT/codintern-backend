const { Parser } = require("json2csv");
const WorkshopRegistration = require("../models/WorkshopRegistration");
const catchAsync = require("../utils/catchAsync");
const WorkshopFeedback = require("../models/formModel");

exports.getWorkshops = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    gender,
    year,
    branch,
    collegeName,
    search,
    sortField = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  // Filters
  if (gender) query.gender = gender;
  if (year) query.year = year;
  if (branch) query.branch = branch;
  if (collegeName) query.collegeName = { $regex: collegeName, $options: "i" };

  // Search in name, email, mobile, rollNo
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobileNumber: { $regex: search, $options: "i" } },
      { universityRollNo: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sort = {};
  sort[sortField] = sortOrder === "desc" ? -1 : 1;

  // Fetch records
  const workshops = await WorkshopRegistration.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await WorkshopRegistration.countDocuments(query);

  res.status(200).json({
    success: true,
    message: "Workshop registrations fetched successfully",
    workshops,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalRegistrations: total,
      limit: limitNum,
    },
  });
});

exports.exportWorkshops = catchAsync(async (req, res) => {
  let { from, to } = req.query;

  let query = {};
  if (from || to) {
    query.createdAt = {};
    if (from) {
      from = new Date(from).toISOString(); // ensure valid format
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      to = new Date(to).toISOString();
      query.createdAt.$lte = new Date(to);
    }
  }

  const fields = [
    "fullName",
    "dateOfBirth",
    "gender",
    "email",
    "mobileNumber",
    "collegeName",
    "branch",
    "year",
    "universityRollNo",
  ];

  const records = await WorkshopRegistration.find(query)
    .select(fields.join(" "))
    .lean();

  console.log("records", records);

  const parser = new Parser({ fields });
  const csv = parser.parse(records);

  res.header("Content-Type", "text/csv");
  res.attachment("workshops.csv");
  res.send(csv);
});

exports.getFeedbacks = catchAsync(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    search,
    workshopId,
    satisfaction,
    effectiveness,
    experience,
    fromDate,
    toDate,
    sortField = "submittedAt",
    sortOrder = "desc",
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const query = {};

  // 🔎 Search (on name, email, enrolment, college)
  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { emailId: regex },
      { enrolmentNumber: regex },
      { collegeName: regex },
    ];
  }

  // 🎯 Filters
  if (workshopId) query.workshopId = workshopId;
  if (satisfaction) query.overallSatisfaction = satisfaction;
  if (effectiveness) query.trainerEffectiveness = effectiveness;
  if (experience) query.overallExperience = experience;

  // 📅 Date filter
  if (fromDate || toDate) {
    query.workshopDate = {};
    if (fromDate) query.workshopDate.$gte = new Date(fromDate);
    if (toDate) query.workshopDate.$lte = new Date(toDate);
  }

  // Sorting
  const sortOptions = {};
  sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

  // Pagination + Query
  const feedbacks = await WorkshopFeedback.find(query)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await WorkshopFeedback.countDocuments(query);

  res.json({
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    feedbacks,
  });
});

exports.exportFeedbacks = catchAsync(async (req, res) => {
  let { from, to } = req.query;

  let query = {};
  if (from || to) {
    query.createdAt = {};
    if (from) {
      from = new Date(from).toISOString(); // ensure valid format
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      to = new Date(to).toISOString();
      query.createdAt.$lte = new Date(to);
    }
  }

  const fields = [
    "firstName",
    "lastName",
    "collegeName",
    "enrolmentNumber",
    "contactNumber",
    "emailId",
    "overallSatisfaction",
    "topicRelevance",
    "trainerEffectiveness",
    "overallExperience",
    "additionalComments",
    "submittedAt",
    "workshopDate",
  ];

  const records = await WorkshopFeedback.find(query)
    .select(fields.join(" "))
    .lean();

  console.log("records", records);

  const parser = new Parser({ fields });
  const csv = parser.parse(records);

  res.header("Content-Type", "text/csv");
  res.attachment("workshops.csv");
  res.send(csv);
});

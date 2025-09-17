const { Parser, Transform } = require("json2csv");
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
    type,
  } = req.query;

  const query = {};

  // Filters
  if (gender) query.gender = gender;
  if (year) query.year = year;
  if (branch) query.branch = branch;
  if (type) query.type = type;
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
  let { from, to, type = "workshop" } = req.query;

  let query = { type };
  if (from || to) {
    query.createdAt = {};
    if (from) {
      const startOfDay = new Date(from);
      startOfDay.setHours(0, 0, 0, 0);
      query.createdAt.$gte = startOfDay;
    }
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endOfDay;
    }
  }

  console.log("Export query:", query);

  const count = await WorkshopRegistration.countDocuments(query);
  console.log("Matched docs:", count);

  const fields = [
    { label: "Full Name", value: "fullName" },
    {
      label: "Date of Birth",
      value: (row) =>
        row.dateOfBirth
          ? new Date(row.dateOfBirth).toISOString().split("T")[0]
          : "",
    },
    { label: "Gender", value: "gender" },
    { label: "Email", value: "email" },
    { label: "Mobile Number", value: "mobileNumber" },
    { label: "College Name", value: "collegeName" },
    { label: "Branch", value: "branch" },
    { label: "Year", value: "year" },
    { label: "University Roll No", value: "universityRollNo" },
    {
      label: "Registered At",
      value: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toISOString().split("T")[0]
          : "",
    },
  ];

  res.header("Content-Type", "text/csv");
  res.attachment("workshops.csv");

  const json2csv = new Transform(
    { fields },
    { objectMode: true, highWaterMark: 16384, encoding: "utf-8" }
  );

  // Stream MongoDB results
  const cursor = WorkshopRegistration.find(query).lean().cursor();

  cursor.pipe(json2csv).pipe(res);
});

exports.exportGenerativeAIWorkshops = catchAsync(async (req, res) => {
  let { from, to, type = "generative-ai" } = req.query;

  let query = { type };
  if (from || to) {
    query.createdAt = {};
    if (from) {
      const startOfDay = new Date(from);
      startOfDay.setHours(0, 0, 0, 0);
      query.createdAt.$gte = startOfDay;
    }
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endOfDay;
    }
  }

  const fields = [
    { label: "Full Name", value: "fullName" },
    {
      label: "Date of Birth",
      value: (row) =>
        row.dateOfBirth
          ? new Date(row.dateOfBirth).toISOString().split("T")[0]
          : "",
    },
    { label: "Gender", value: "gender" },
    { label: "Email", value: "email" },
    { label: "Mobile Number", value: "mobileNumber" },
    { label: "College Name", value: "collegeName" },
    { label: "Branch", value: "branch" },
    { label: "Year", value: "year" },
    { label: "University Roll No", value: "universityRollNo" },
    { label: "Status", value: "status" },
    { label: "Payment ID", value: "paymentInfo.paymentId" },
    { label: "Order ID", value: "paymentInfo.orderId" },
    { label: "Signature", value: "paymentInfo.signature" },
    { label: "Amount", value: "paymentInfo.amount" },
    { label: "Method", value: "paymentInfo.method" },
    {
      label: "Registered At",
      value: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toISOString().split("T")[0]
          : "",
    },
  ];

  res.header("Content-Type", "text/csv");
  res.attachment("workshops.csv");

  const json2csv = new Transform(
    { fields },
    { objectMode: true, highWaterMark: 16384, encoding: "utf-8" }
  );

  // Stream MongoDB results
  const cursor = WorkshopRegistration.find(query).lean().cursor();

  cursor.pipe(json2csv).pipe(res);
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
      const startOfDay = new Date(from);
      startOfDay.setHours(0, 0, 0, 0);
      query.createdAt.$gte = startOfDay;
    }
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endOfDay;
    }
  }

  const fields = [
    { label: "First Name", value: "firstName" },
    { label: "Last Name", value: "lastName" },
    { label: "College Name", value: "collegeName" },
    { label: "Enrollment Number", value: "enrolmentNumber" },
    { label: "Contact Number", value: "contactNumber" },
    { label: "Email ID", value: "emailId" },
    { label: "Overall Satisfaction", value: "overallSatisfaction" },
    { label: "Topic Relevance", value: "topicRelevance" },
    { label: "Trainer Effectiveness", value: "trainerEffectiveness" },
    { label: "Overall Experience", value: "overallExperience" },
    { label: "Additional Comments", value: "additionalComments" },
    {
      label: "Submitted At",
      value: (row) =>
        row.submittedAt
          ? new Date(row.submittedAt).toISOString().split("T")[0]
          : "",
    },
    {
      label: "Workshop Date",
      value: (row) =>
        row.workshopDate
          ? new Date(row.workshopDate).toISOString().split("T")[0]
          : "",
    },
  ];

  res.header("Content-Type", "text/csv");
  res.attachment("workshops.csv");

  const json2csv = new Transform(
    { fields },
    { objectMode: true, highWaterMark: 16384, encoding: "utf-8" }
  );

  // Stream MongoDB results
  const cursor = WorkshopFeedback.find(query).lean().cursor();

  cursor.pipe(json2csv).pipe(res);
});

const Instructor = require("../models/course/Instructor");
const AppError = require("../utils/appError");
const bcrypt = require("bcrypt");

// Create instructor
exports.createInstructor = async (data) => {
  // Check if instructor already exists
  const existingInstructor = await Instructor.findOne({ email: data.email });
  if (existingInstructor) {
    throw new AppError("Instructor with this email already exists", 400);
  }

  // Hash password
  if (data.password) {
    const saltRounds = 12;
    data.password = await bcrypt.hash(data.password, saltRounds);
  }

  const instructor = new Instructor(data);
  return await instructor.save();
};

// Get all instructors with filtering, pagination and search
exports.getInstructors = async (queryParams) => {
  let {
    page = 1,
    limit = 10,
    isActive,
    expertise,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    getAll = false,
  } = queryParams;
  console.log("queryParams", queryParams);

  page = parseInt(page);
  limit = parseInt(limit);
  getAll = getAll === "true" || getAll === true; // ensure boolean

  const skip = (page - 1) * limit;

  // Build query object
  let query = {};

  if (isActive !== undefined && isActive !== "all") {
    query.isActive = isActive === "true";
  }

  if (expertise) {
    query.expertise = { $in: [expertise] };
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { bio: { $regex: search, $options: "i" } },
      { expertise: { $elemMatch: { $regex: search, $options: "i" } } },
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const totalInstructors = await Instructor.countDocuments(query);
  // const instructors = await Instructor.find(query)
  //   .select("-password") // Never return password
  //   .populate("courses", "title status")
  //   .sort(sort)
  //   .skip(skip)
  //   .limit(limit)
  //   .lean();

  console.log("query", query);
  let instructorsQuery = Instructor.find(query).sort({ createdAt: -1 }); // latest first

  if (!getAll) {
    const skip = (page - 1) * limit;
    instructorsQuery = instructorsQuery
      .select("-password") // Never return password
      .populate("courses", "title status")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  const instructors = await instructorsQuery;

  console.log("instructors", instructors);

  return {
    instructors,
    pagination: {
      totalPages: Math.ceil(totalInstructors / limit),
      page,
      limit,
      totalInstructors,
    },
  };
};

// Get instructor by ID
exports.getInstructorById = async (id) => {
  const instructor = await Instructor.findById(id)
    .select("-password")
    .populate("courses", "title status category level");

  if (!instructor) {
    throw new AppError("Instructor not found", 404);
  }

  return instructor;
};

// Update instructor
exports.updateInstructor = async (id, updateData) => {
  // If updating password, hash it
  if (updateData.password) {
    const saltRounds = 12;
    updateData.password = await bcrypt.hash(updateData.password, saltRounds);
  }

  // If updating email, check for duplicates
  if (updateData.email) {
    const existingInstructor = await Instructor.findOne({
      email: updateData.email,
      _id: { $ne: id },
    });
    if (existingInstructor) {
      throw new AppError(
        "Another instructor with this email already exists",
        400
      );
    }
  }

  const instructor = await Instructor.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!instructor) {
    throw new AppError("Instructor not found", 404);
  }

  return instructor;
};

// Delete instructor
exports.deleteInstructor = async (id) => {
  const instructor = await Instructor.findByIdAndDelete(id).select("-password");

  if (!instructor) {
    throw new AppError("Instructor not found", 404);
  }

  return instructor;
};

// Toggle instructor status
exports.toggleInstructorStatus = async (id) => {
  const instructor = await Instructor.findById(id);

  if (!instructor) {
    throw new AppError("Instructor not found", 404);
  }

  instructor.isActive = !instructor.isActive;
  await instructor.save();

  return instructor;
};

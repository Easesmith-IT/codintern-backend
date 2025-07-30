const mongoose = require("mongoose");
const Counter = require("./Counter");

const addressSchema = new mongoose.Schema(
  {
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["10th", "12th", "Diploma", "Bachelors", "Masters", "PhD", "Other"],
      required: true,
    },
    institutionName: { type: String, trim: true },
    boardOrUniversity: { type: String, trim: true },
    streamOrSpecialization: { type: String, trim: true },
    gradeFormat: {
      type: String,
      enum: ["Percentage", "CGPA", "GPA"],
      default: "Percentage",
    },
    grade: {
      type: Number,
      // required: function () {
      //   return !this.isPursuing;
      // },
    },
    isPursuing: { type: Boolean, default: false },
    startYear: { type: Number },
    endYear: {
      type: Number,
      // required: function () {
      //   return !this.isPursuing;
      // },
    },
    certificateUrl: { type: String },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true },
    companyName: { type: String, required: true },
    location: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const certificateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    issuedBy: { type: String, required: true },
    issueDate: { type: Date, required: true },
    certificateUrl: { type: String },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    progress: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["not started", "in progress", "completed"],
      default: "not started",
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { _id: false }
);

const jobApplicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    status: {
      type: String,
      enum: ["applied", "interview", "offer", "rejected"],
      default: "applied",
    },
    appliedAt: { type: Date, default: Date.now },
    resumeVersion: { type: String },
    coverLetter: { type: String, trim: true },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    // Basic Info
    customId: {
      type: String,
      unique: true,
      // required: true,
    },

    name: { type: String, required: true, trim: true },
    emailId: {
      type: String,
      required: true,
      trim: true,
      // unique: true,
      lowercase: true,
      validate: {
        validator: (v) => /^[\w\.-]+@[\w\.-]+\.\w+$/.test(v),
        message: "Please enter a valid email address",
      },
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
      required: function () {
        return this.authProvider === "local";
      },
    },
    image: { type: String },
    phone: { type: String },
    alternatePhone: { type: String },
    bio: { type: String, trim: true },
    currentRole: { type: String },
    profileVisibility: { type: Boolean, default: false },
    contactMethod: {
      type: String,
      required: false,
    },

    // Authentication
    authProvider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    providerId: {
      type: String,
      required: function () {
        return this.authProvider !== "local";
      },
    },
    emailVerified: { type: Boolean, default: false },

    // Learning
    courses: [courseSchema],

    // Jobs
    jobApplications: [jobApplicationSchema],

    // Education & Experience
    education: [educationSchema],
    experience: [experienceSchema],

    // Career & Skills
    skills: [String],
    resumeUrl: { type: String },
    portfolioLinks: [String],

    // Certificates
    certificates: [certificateSchema],

    // Optional fields
    addresses: [addressSchema],
    notificationSettings: {
      pauseAllNotifications: { type: Boolean, default: false },
      courseProgressReminders: { type: Boolean, default: false },
      assignmentDeadlines: { type: Boolean, default: false },
      jobAlerts: { type: Boolean, default: false },
      promotionsAndDiscounts: { type: Boolean, default: false },
    },
    settings: {
      playbackSpeed: {
        type: String,
        enum: ["0.5x", "1.0x", "1.5x", "2.0x"],
        default: "1.0x",
      },
      subtitles: { type: Boolean, default: false },
      courseLanguage: { type: String, default: "english" },
      weeklyLearningGoal: { type: Number, default: 4 },
    },
    bringsYouHere: {
      type: [String], // array of strings
      default: [],
    },
    areaOfInterest: {
      tech: {
        type: [String],
        default: [],
      },
      business: {
        type: [String],
        default: [],
      },
      creative: {
        type: [String],
        default: [],
      },
      academic: {
        type: [String],
        default: [],
      },
    },
    currentRole: {
      type: String,
    },
    refreshToken: String,
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

studentSchema.index({ emailId: 1 });

studentSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "Student" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.customId = `STU${counter.seq.toString().padStart(4, "0")}`;
  }
  next();
});

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;

const mongoose = require("mongoose");

const InstructorSchema = new mongoose.Schema(
  {
    // 🔹 Basic Info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },

    // 🔹 Authentication (if instructors log in separately)
    password: { type: String, required: true },

    // 🔹 Profile Details
    bio: { type: String, maxlength: 2000 },
    profileImage: { type: String }, // URL
    expertise: [{ type: String }], // ["AI", "ML", "Marketing"]

    // 🔹 Social / External Links
    socialLinks: {
      linkedin: { type: String },
      twitter: { type: String },
      github: { type: String },
      website: { type: String },
    },

    // 🔹 Certifications
    certifications: [
      {
        title: { type: String, required: true }, // e.g., "PhD in AI"
        provider: { type: String },
        year: { type: Number },
        certificateLink: { type: String },
      },
    ],

    // 🔹 Teaching
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    // 🔹 Ratings & Reviews
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    // 🔹 Achievements & Badges
    achievements: [
      {
        title: { type: String },
        description: { type: String },
        date: { type: Date },
      },
    ],

    // 🔹 Status
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Instructor", InstructorSchema);

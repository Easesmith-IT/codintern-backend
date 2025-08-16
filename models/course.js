const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String, // e.g. "Web Development", "Data Science"
      required: true,
    },
    subCategory: {
      type: String, // optional sub-category
    },
    thumbnail: {
      type: String, // image URL
    },
    introVideo: {
      type: String, // optional course intro video
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    language: {
      type: String,
      default: "English",
    },

    // Course Content
    modules: [
      {
        title: { type: String, required: true },
        description: { type: String },
        lessons: [
          {
            title: { type: String, required: true },
            contentType: {
              type: String,
              enum: ["video", "article", "quiz", "assignment"],
              required: true,
            },
            contentUrl: { type: String }, // for video/article
            duration: { type: Number }, // in minutes
            isPreviewFree: { type: Boolean, default: false },
          },
        ],
      },
    ],

    // Pricing
    pricing: {
      price: { type: Number, required: true },
      discountPrice: { type: Number }, // optional discounted price
      currency: { type: String, default: "INR" },
      isFree: { type: Boolean, default: false },
    },

    // Instructors
    instructors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // user model with instructor role
      },
    ],

    // Enrollments
    students: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        enrolledAt: { type: Date, default: Date.now },
        progress: {
          completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
          percentage: { type: Number, default: 0 },
        },
      },
    ],

    // Reviews & Ratings
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },

    // Course Status
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);

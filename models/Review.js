const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    platform: {
      type: String, // e.g. "LinkedIn", "Google", "Website"
      enum: ["LinkedIn", "Google", "Website"],
    },
    rating: {
      type: Number,
      required: true,
      min: [0, "Rating must be at least 0"],
      max: [5, "Rating cannot exceed 5"],
    },

    reviewText: {
      type: String,
      required: true,
      trim: true,
    },
    reviewerName: {
      type: String,
      required: true,
      trim: true,
    },
    reviewerRole: {
      type: String, // e.g. "Student", "Professional"
      default: "User",
      trim: true,
    },
    category: {
      type: String,
      enum: ["General", "Course"],
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: function () {
        return this.category === "Course";
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

reviewSchema.index({ category: 1, status: 1 });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;

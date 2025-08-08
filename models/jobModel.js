const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    jobImage: {
      type: String, // you can store file path or URL
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    postingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    education: {
      type: [String],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one education value is required",
      },
    },
    aboutCompany: {
      type: String,
      required: true,
    },
    aboutJob: {
      type: String,
      required: true,
    },
    rolesAndReponsibilities: {
      type: String,
      required: true,
    },
    goodToHave: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", JobSchema);
module.exports = Job;

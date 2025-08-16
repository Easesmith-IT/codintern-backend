const mongoose = require("mongoose");
const Counter = require("./Counter");

const JobSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
    },
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
    company: {
      type: String,
      required: true,
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
    externalLink: {
      type: String,
    },
    jobId: {
      type: String,
    },
  },
  { timestamps: true }
);

JobSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "Job" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.customId = `JOB${counter.seq.toString().padStart(4, "0")}`;
  }
  next();
});

const Job = mongoose.model("Job", JobSchema);
module.exports = Job;

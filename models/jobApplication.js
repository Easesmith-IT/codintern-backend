const mongoose = require("mongoose");
const Counter = require("./Counter");

const jobApplicationSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    resumeUrl: {
      type: String,
    },
    coverLetter: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected", "accepted"],
      default: "pending",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

jobApplicationSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "Job Application" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.customId = `JOB-APPLICATION${counter.seq.toString().padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("JobApplication", jobApplicationSchema);

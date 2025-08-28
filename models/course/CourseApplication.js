const mongoose = require("mongoose");
const Counter = require("../Counter");

const CourseApplicationSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      // required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    // Applicant info (snapshot even if Student exists)
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    education: { type: String, required: true },
    graduationYear: { type: Number, required: true },

    // Course reference
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // Current status
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },

    // 🔹 Notes from Admin or Instructor
    notes: [
      {
        remark: { type: String, required: true },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "notes.addedByModel", // dynamic ref
        },
        addedByModel: {
          type: String,
          required: true,
          enum: ["Admin", "Instructor"], // both supported
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 🔹 Status history with who changed it
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "reviewed", "accepted", "rejected"],
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "statusHistory.changedByModel",
        },
        changedByModel: {
          type: String,
          required: true,
          enum: ["Admin", "Instructor"],
        },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CourseApplicationSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "Course Application" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.customId = `CAP${counter.seq.toString().padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("CourseApplication", CourseApplicationSchema);

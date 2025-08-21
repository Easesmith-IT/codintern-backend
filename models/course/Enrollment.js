const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    enrolledAt: { type: Date, default: Date.now },
    progress: {
      completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
      percentage: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);

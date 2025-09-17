const mongoose = require("mongoose");

const workshopRegistrationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    gender: {
      type: String,
      // enum: ["male", "female", "other"],
      required: false,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    mobileNumber: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    collegeName: {
      type: String,
      required: false,
      trim: true,
    },
    branch: {
      type: String,
      required: false,
      trim: true,
    },
    year: {
      type: String,
      //   enum: ["1", "2", "3", "4"],
      // enum: [1, 2, 3, 4],
      required: false,
    },
    universityRollNo: {
      type: String,
      required: false,
      trim: true,
    },
    type: {
      type: String,
      default: "workshop",
      enum: ["workshop", "generative-ai"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentInfo: {
      paymentId: { type: String }, // razorpay_payment_id
      orderId: { type: String }, // razorpay_order_id
      signature: { type: String }, // razorpay_signature
      amount: { type: Number },
      method: { type: String },
    },
    grade: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

workshopRegistrationSchema.index({ email: 1, type: 1 }, { unique: true });
workshopRegistrationSchema.index(
  { mobileNumber: 1, type: 1 },
  { unique: true }
);
workshopRegistrationSchema.index(
  { universityRollNo: 1, type: 1 },
  { unique: true }
);

// 🔹 Auto-update status before saving
workshopRegistrationSchema.pre("save", function (next) {
  if (this.type === "workshop") {
    this.status = "paid";
  }
  next();
});

const WorkshopRegistration = mongoose.model(
  "WorkshopRegistration",
  workshopRegistrationSchema
);

module.exports = WorkshopRegistration;

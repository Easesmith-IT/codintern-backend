const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phone: String,
    email: String,

    otp: {
      type: Number,
      required: true,
    },

    otpExpiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index — auto-removal after `otpExpiresAt`
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Otp = mongoose.model("Otp", otpSchema);
module.exports = Otp;

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Counter = require("./Counter");

// Schema for tracking admin actions/activity
const adminActivitySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Schema for admin permissions
const permissionSchema = new mongoose.Schema({
  dashboard: {
    type: String,
    enum: ["none", "read", "read&write"],
    default: "none",
  },
  admin: {
    type: String,
    enum: ["none", "read", "read&write"],
    default: "none",
  },
  job: {
    type: String,
    enum: ["none", "read", "read&write"],
    default: "none",
  },
  student: {
    type: String,
    enum: ["none", "read", "read&write"],
    default: "none",
  },
  review: {
    type: String,
    enum: ["none", "read", "read&write"],
    default: "none",
  },
});

// Main admin schema
const adminSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      required: false,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: "Please enter a valid email",
      },
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      // validate: {
      //   validator: function (v) {
      //     return /^[6-9]\d{9}$/.test(v);
      //   },
      //   message: "Please enter a valid phone number",
      // },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    position: {
      type: String,
      required: true,
      enum: ["manager", "support", "analyst"],
    },
    role: {
      type: String,
      enum: ["superAdmin", "subAdmin"],
      required: true,
      default: "subAdmin",
    },
    permissions: {
      type: permissionSchema,
      required: true,
      default: {},
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    lastLogin: {
      timestamp: Date,
      ipAddress: String,
    },
    profileImage: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: String,
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
adminSchema.index({ role: 1, status: 1 });
adminSchema.index({ cityName: 1 }); //added index for cityName ASsuggested by client

// Pre-save middleware to update lastLogin timestamp

// Methods for permission checking
adminSchema.methods.hasPermission = function (module, level) {
  if (this.role === "superAdmin") return true;

  const permission = this.permissions[module];
  if (level === "read") {
    return permission === "read" || permission === "read&write";
  }
  return permission === "read&write";
};

adminSchema.methods.canRead = function (module) {
  return this.hasPermission(module, "read");
};

adminSchema.methods.canWrite = function (module) {
  return this.hasPermission(module, "read&write");
};

// Password related methods
adminSchema.methods.isPasswordChanged = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

adminSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Password hashing middleware
adminSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "Admin" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.customId = `ADMIN${counter.seq.toString().padStart(4, "0")}`;
  }
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update passwordChangedAt middleware
adminSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Automatically grant all permissions to superAdmin
adminSchema.pre("save", function (next) {
  if (this.role === "superAdmin") {
    const allModules = ["dashboard", "admin", "job", "student", "review"];

    allModules.forEach((module) => {
      this.permissions[module] = "read&write";
    });
  }
  next();
});

const Admin = mongoose.model("Admin", adminSchema);
const AdminActivity = mongoose.model("AdminActivity", adminActivitySchema);

module.exports = { Admin, AdminActivity };

const mongoose = require("mongoose");
const slugify = require("slugify");
const Counter = require("../Counter");

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    contentType: {
      type: String,
      enum: ["video", "article", "quiz", "assignment"],
      required: true,
    },
    contentUrl: { type: String },
    duration: { type: Number }, // in milliseconds
    isPreviewFree: { type: Boolean, default: false },
  },
  { _id: true }
);

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    lessons: [lessonSchema],
    duration: { type: Number, default: 0 }, // total duration in milliseconds (auto-calc from lessons)
  },
  { _id: true }
);

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    schedule: {
      days: [String], // e.g. ["Mon", "Wed", "Fri"]
      time: { start: String, end: String }, // e.g. "10:00 AM"
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor" },
    seatsLimit: { type: Number, default: 50 },

    // Pricing
    price: { type: Number, required: true },
    offerPrice: { type: Number, default: null },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed"],
      default: "upcoming",
    },
    batchHighlights: [{ type: String }],
  },
  { timestamps: true }
);

batchSchema.virtual("savedAmount").get(function () {
  if (this.offerPrice && this.offerPrice < this.price) {
    return this.price - this.offerPrice;
  }
  return 0;
});

const projectSchema = new mongoose.Schema(
  {
    icon: { type: String }, // optional icon
    title: { type: String, required: true },
    description: { type: String, required: true },
    tools: [{ type: String }], // multiple tools
  },
  { _id: false }
);

const certificateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    }, // e.g. "Master Certification in Data Science & Analytics"

    provider: {
      type: String,
    }, // e.g. "CodIntern" / "Skill India"

    certificateLink: {
      type: String,
    }, // download or view link

    issueDate: {
      type: Date,
    }, // optional, when certificate is issued

    expiryDate: {
      type: Date,
    }, // optional (lifetime if not set)
  },
  { _id: false }
);

const badgeSchema = new mongoose.Schema({
  label: { type: String, required: true }, // e.g. "AI-Powered"
  type: {
    type: String,
    enum: ["feature", "highlight", "certification", "update"],
    default: "feature",
  },
  image: { type: String },
  value: { type: String }, // optional (for extra info like "May 2025")
});

const courseSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
    },
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
    overview: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true, // e.g. "Web Development"
    },
    subCategory: { type: String },
    thumbnail: { type: String },
    introVideo: { type: String },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    language: { type: String, default: "English" },
    studentCount: { type: Number, default: 0 },

    // Course Extras
    courseDuration: { type: String }, // e.g. "3 months"
    totalDuration: { type: Number, default: 0 },
    classTiming: { type: String }, // general info: "Weekdays 7-9 PM"
    totalSeats: { type: Number },
    brochure: {
      type: String, // PDF file URL
    },

    syllabusFile: {
      type: String, // PDF file URL
    },

    // Interviews & Internship
    interviews: {
      type: mongoose.Schema.Types.Mixed, // number or "unlimited"
      default: 0,
    },
    integratedInternship: {
      hasInternship: { type: Boolean, default: false },
      count: { type: mongoose.Schema.Types.Mixed, default: 0 }, // number or "unlimited"
    },

    // Course Content
    modules: [moduleSchema],

    // Pricing
    pricing: {
      price: { type: Number },
      discountPrice: { type: Number },
      currency: { type: String, default: "INR" },
      isFree: { type: Boolean, default: false },
    },

    // Instructors
    instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Instructor" }],

    averageRating: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: { type: Date },
    archivedAt: { type: Date },

    // Batches
    batches: [batchSchema],

    courseHighlights: [badgeSchema], // e.g. AI-Powered, Government Certified, Updated
    studentBenefits: [badgeSchema], // e.g. Live Coding Practice, Refund Guarantee

    features: [
      {
        icon: { type: String }, // e.g. "placement", "training", "certificate"
        title: { type: String, required: true }, // e.g. "Pan India Placements"
        subtitle: { type: String }, // optional, if you need small text under title
      },
    ],

    projects: [projectSchema],

    certificate: certificateSchema,

    venue: {
      type: String,
      enum: ["online"],
      default: "online",
    },
    onlinePlatform: { type: String }, // e.g. Zoom, Google Meet, MS Teams, custom LMS
    meetingLink: { type: String }, // optional, if generated per batch/session

    isFastTrack: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

courseSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  if (this.pricing.isFree) {
    this.pricing.price = 0;
    this.pricing.discountPrice = 0;
  }

  next();
});

// Course savedAmount (from pricing)
courseSchema.virtual("savedAmount").get(function () {
  if (
    this.pricing.discountPrice &&
    this.pricing.discountPrice < this.pricing.price
  ) {
    return this.pricing.price - this.pricing.discountPrice;
  }
  return 0;
});

courseSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "Course" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.customId = `COURSE${counter.seq.toString().padStart(4, "0")}`;
  }
  this.modules.forEach((mod) => {
    mod.duration = mod.lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  });

  this.totalDuration = this.modules.reduce(
    (sum, mod) => sum + (mod.duration || 0),
    0
  );

  next();
});

courseSchema.set("toJSON", { virtuals: true });
batchSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Course", courseSchema);

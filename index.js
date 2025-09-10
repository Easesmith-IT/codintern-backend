const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/connectDB");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const passport = require("passport");
const session = require("express-session");

const studentAuthRoutes = require("./routes/studentAuthRoutes");
const studentMainRoutes = require("./routes/studentMainRoutes");
const studentJobRoutes = require("./routes/studentJobRoutes");
const studentCoursesRoutes = require("./routes/studentCoursesRoutes");
const studentCourseApplicationRoutes = require("./routes/studentCourseApplicationRoutes");
const studentWorkshopRoutes = require("./routes/studentWorkshopRoutes");
const studentFaqRoutes = require("./routes/studentFaqRoutes");
const studentHeroSectionRoutes = require("./routes/StudentHeroSectionRoutes");
const studentContentRoutes = require("./routes/StudentContentRoutes");
const studentReviewRoutes = require("./routes/studentReviewRoutes");

const adminRoutes = require("./routes/adminRoutes");
const adminStudentRoutes = require("./routes/adminStudentRoutes");
const jobRoutes = require("./routes/jobRoutes");
const courseRoutes = require("./routes/courseRoutes");
const courseApplicationRoutes = require("./routes/courseApplicationRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const faqRoutes = require("./routes/faqRoutes");
const workshopRoutes = require("./routes/workshopRoutes");
const heroSectionContentRoutes = require("./routes/heroSectionContentRoutes");
const contentRoutes = require("./routes/contentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const { submitFeedback } = require("./controllers/feedbackController");
const globalErrorHandler = require("./controllers/errorController");

require("./passport");

const app = express();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
  })
);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.FRONT_END_URL,
      process.env.ADMIN_FRONT_END_URL,
      "https://cod-intern-admin-panel.vercel.app",
    ],
    credentials: true,
  })
);

// Connect to MongoDB
connectDB();

// Sample route
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/feedBack", submitFeedback);

// student routes
app.use("/api/student/auth", studentAuthRoutes);
app.use("/api/student/main", studentMainRoutes);
app.use("/api/student/jobs", studentJobRoutes);
app.use("/api/student/courses", studentCoursesRoutes);
app.use("/api/student/course-applications", studentCourseApplicationRoutes);
app.use("/api/student/workshop", studentWorkshopRoutes);
app.use("/api/student/faqs", studentFaqRoutes);
app.use("/api/student/content/hero-section", studentHeroSectionRoutes);
app.use("/api/student/content", studentContentRoutes);
app.use("/api/student/reviews", studentReviewRoutes);

// admin routes
app.use("/api/admin/admins", adminRoutes);
app.use("/api/admin/students", adminStudentRoutes);
app.use("/api/admin/jobs", jobRoutes);
app.use("/api/admin/courses", courseRoutes);
app.use("/api/admin/course-applications", courseApplicationRoutes);
app.use("/api/admin/instructors", instructorRoutes);
app.use("/api/admin/faqs", faqRoutes);
app.use("/api/admin/workshops", workshopRoutes);
app.use("/api/admin/content/hero-section", heroSectionContentRoutes);
app.use("/api/admin/content", contentRoutes);
app.use("/api/admin/reviews", reviewRoutes);

// public FAQ routes
// app.use("/api/faqs", faqRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use(globalErrorHandler);

// Error handling
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.error(err);
  server.close(() => process.exit(1));
});

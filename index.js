const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/connectDB");
const { submitFeedback } = require("./controllers/feedbackController");
const studentAuthRoutes = require("./routes/studentAuthRoutes");
const studentMainRoutes = require("./routes/studentMainRoutes");
const jobRoutes = require("./routes/jobRoutes");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const passport = require("passport");
const session = require("express-session");
const globalErrorHandler = require("./controllers/errorController");

// require("dotenv").config({
//   path: path.join(__dirname, "/.env"),
// });

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
      "https://cod-intern-frontend.vercel.app",
      "https://www.codintern.com",
      process.env.ADMIN_FRONT_END_URL,
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
app.use("/api/student/auth", studentAuthRoutes);
app.use("/api/student/main", studentMainRoutes);
app.use("/api/admin/jobs", jobRoutes);

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

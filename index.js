const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/connectDB");
const { submitFeedback } = require("./controller/feedbackController");
const cors = require("cors");
const studentAuthRoutes = require("./routes/studentAuthRoutes");

dotenv.config(); 

const app = express();


app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://cod-intern-frontend.vercel.app",
      "https://www.codintern.com",
      // process.env.DEV_FRONT_END_URL,
      // process.env.PROD_FRONT_END_URL,
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


app.use('/api/feedBack',submitFeedback)
app.use("/api/student/auth", studentAuthRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

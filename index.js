const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/connectDB");
const { submitFeedback } = require("./controller/feedbackController");

dotenv.config(); 

const app = express();


app.use(express.json());

// Connect to MongoDB
connectDB();

// Sample route
app.get("/", (req, res) => {
  res.send("API is running...");
});


app.use('/api/feedBack',submitFeedback)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

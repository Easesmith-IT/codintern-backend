const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/connectDB");

dotenv.config(); 

const app = express();


app.use(express.json());

// Connect to MongoDB
connectDB();

// Sample route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

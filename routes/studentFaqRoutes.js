const express = require("express");
const {
  getFaqsByCategoryForStudents,
} = require("../controllers/studentFaqController");

const router = express.Router();

router.get("/category/:category", getFaqsByCategoryForStudents);

module.exports = router;

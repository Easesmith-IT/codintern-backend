const express = require("express");
const {
  registerWorkshop,
} = require("../controllers/studentWorkshopController");
const router = express.Router();

router.post("/register", registerWorkshop);

module.exports = router;

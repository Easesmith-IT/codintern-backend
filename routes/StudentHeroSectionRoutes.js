const express = require("express");
const { getHomeHeroSections } = require("../controllers/heroSectionController");

const router = express.Router();

router.get("/", getHomeHeroSections); // Get all

module.exports = router;

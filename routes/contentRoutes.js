const express = require("express");

const { addHomeHeroSection, getHomeHeroSections, getHomeHeroSectionById, updateHomeHeroSection } = require("../controllers/heroSectionController");

const router = express.Router();

router.post("/", addHomeHeroSection); // Add new
router.get("/", getHomeHeroSections); // Get all
router.get("/:id", getHomeHeroSectionById); // Get by ID
router.put("/:id", updateHomeHeroSection); // Update

module.exports = router;
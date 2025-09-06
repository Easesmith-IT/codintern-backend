const express = require("express");

const {
  getHomeHeroSections,
  getHomeHeroSectionById,
  upsertHomeHeroSection,
} = require("../controllers/heroSectionController");
const upload = require("../middlewares/imgUpload");

const router = express.Router();

// Add new or update existing HomeHeroSection
router.post(
  "/",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
  ]),
  upsertHomeHeroSection
);
router.get("/", getHomeHeroSections); // Get all
router.get("/:id", getHomeHeroSectionById); // Get by ID

module.exports = router;

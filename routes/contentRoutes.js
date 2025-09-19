const express = require("express");
const router = express.Router();
const {
  getContentByPage,
  upsertContentSection,
  createSeo,
  getSeoByPage,
} = require("../controllers/contentController");
const upload = require("../middlewares/imgUpload");

router.post("/create-seo", createSeo);

router.get("/get-seo", getSeoByPage);

// If you expect multiple images for a section, e.g., `images[]`
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 }, // generic multiple images
    // { name: "image1", maxCount: 1 }, // HeroSection
    // { name: "image2", maxCount: 1 },
    // { name: "image3", maxCount: 1 },
  ]),
  upsertContentSection
);

router.get("/:pageName", getContentByPage);

module.exports = router;

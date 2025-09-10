const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const { reviewSchema } = require("../validations/reviewValidation");
const {
  createReview,
  getReviewsByCategory,
} = require("../controllers/reviewController");

router.post("/create", validate(reviewSchema), createReview);
router.get("/get", getReviewsByCategory);

module.exports = router;

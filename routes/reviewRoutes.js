const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const { reviewSchema } = require("../validations/reviewValidation");
const {
  createReview,
  getReviewsByCategory,
  updateReviewStatus,
  deleteReview,
  updateReview,
} = require("../controllers/reviewController");

router.post("/create", validate(reviewSchema), createReview);
router.get("/get", getReviewsByCategory);
router.patch("/:id/status", updateReviewStatus);

router.patch("/update/:id", updateReview);

router.delete("/:id", deleteReview);

module.exports = router;

const express = require("express");
const {
  createFaq,
  getFaqs,
  updateFaq,
  deleteFaq,
  getFaqsByCategory,
  getFaqById,
} = require("../controllers/faqController");
const { protect } = require("../middlewares/protectRoutes");
const { authorize } = require("../middlewares/authorizePermission");

const router = express.Router();

// Public routes (no authentication required)
router.get("/get", getFaqs);
router.get("/get/:id", getFaqById);
router.get("/category/:category", getFaqsByCategory);

// Admin protected routes
router.post("/create", 
  // protect,
  //  authorize("admin", "read&write"),
    createFaq);

router.patch(
  "/update/:id",
  // protect,
  // authorize("admin", "read&write"),
  updateFaq
);

router.delete(
  "/delete/:id",
  // protect,
  // authorize("admin", "read&write"),
  deleteFaq
);

module.exports = router;

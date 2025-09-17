const express = require("express");
const { makePayment, verifyPayment } = require("../controllers/paymentController");
const router = express.Router();

router.post(
  "/make-payment",
  makePayment
);

router.post(
  "/verify-payment",
  verifyPayment
);

module.exports = router;

const express = require("express");

const { getWorkshops, exportWorkshops, getFeedbacks, exportFeedbacks, exportGenerativeAIWorkshops } = require("../controllers/workshopController");

const router = express.Router();

router.get("/get", getWorkshops);
router.get("/export", exportWorkshops);
router.get("/generative-ai/export", exportGenerativeAIWorkshops);

router.get("/feedbacks/get", getFeedbacks);
router.get("/feedbacks/export", exportFeedbacks);

module.exports = router;
const express = require("express");

const { getWorkshops, exportWorkshops, getFeedbacks, exportFeedbacks } = require("../controllers/workshopController");

const router = express.Router();

router.get("/get", getWorkshops);
router.get("/export", exportWorkshops);

router.get("/feedbacks/get", getFeedbacks);
router.get("/feedbacks/export", exportFeedbacks);

module.exports = router;
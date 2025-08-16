const express = require("express");
const {
  getJobs,
  getJobDetails,
  applyJob,
} = require("../controllers/studentJobController");
const { protect } = require("../middlewares/protectRoutes");
const router = express.Router();

router.get("/get", getJobs);
router.get("/get-details/:id", getJobDetails);
router.post("/apply-job", protect, applyJob);

module.exports = router;

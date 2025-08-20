const express = require("express");
const {
  getJobs,
  getJobDetails,
  applyJob,
  getJobApplications,
} = require("../controllers/studentJobController");
const { protect } = require("../middlewares/protectRoutes");
const router = express.Router();

router.get("/get", getJobs);
router.get("/get-details/:id", getJobDetails);
router.post("/apply-job", applyJob);
router.get("/job-applications/get", getJobApplications);

module.exports = router;

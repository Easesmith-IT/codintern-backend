const express = require("express");
const { createJob, updateJob, updateJobStatus, getJobs, deleteJob, getJobDetails, getJobApplications, updateJobApplicationStatus, getJobApplicationDetails } = require("../controllers/jobController");
const upload = require("../middlewares/imgUpload");
const router = express.Router();

router.post("/create", upload.single("image"), createJob);
router.get("/get", getJobs);
router.get("/get-details/:id", getJobDetails);
router.patch("/update/:id", upload.single("image"), updateJob);
router.patch("/update-status/:id", updateJobStatus);
router.delete("/delete/:id", deleteJob);

// job application routes
router.get("/job-applications/get/:id", getJobApplications);
router.get("/job-applications/get-details/:id", getJobApplicationDetails);
router.get("/job-applications/:id/status", updateJobApplicationStatus);

module.exports = router;

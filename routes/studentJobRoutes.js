const express = require("express");
const {
  getJobs,
  getJobDetails,
} = require("../controllers/studentJobController");
const router = express.Router();

router.get("/get", getJobs);
router.get("/get-details/:id", getJobDetails);

module.exports = router;

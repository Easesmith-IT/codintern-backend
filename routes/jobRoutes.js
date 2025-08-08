const express = require("express");
const { createJob } = require("../controllers/jobController");
const upload = require("../middlewares/imgUpload");
const router = express.Router();

router.post("/create", upload.single("image"), createJob);
// router.get("/get", getJob);
// router.patch("/update", upload.single("image"), updateJob);

module.exports = router;

const express = require("express");
const {
  getContentByPage,
  getSeoByPage,
} = require("../controllers/contentController");
const router = express.Router();

router.get("/get-seo", getSeoByPage);

router.get("/:pageName", getContentByPage);

module.exports = router;

const express = require("express");
const { getContentByPage } = require("../controllers/contentController");
const router = express.Router();

router.get("/:pageName", getContentByPage);

module.exports = router;

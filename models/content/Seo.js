const mongoose = require("mongoose");

const seoModel = new mongoose.Schema({
  pageName: {
    type: String,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  keywords: {
    type: [String],
    default: [],
  },
});

const Seo = mongoose.model("Seo", seoModel);
module.exports = Seo;

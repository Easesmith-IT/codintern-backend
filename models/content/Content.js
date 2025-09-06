const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: false, // optional
    },
  },
  { _id: true }
);

const contentModel = new mongoose.Schema(
  {
    pageName: {
      type: String,
      required: [true, "please provide page name"],
    },
    sectionName: {
      type: String,
      required: [true, "please provide section name"],
    },
    content: {
      type: mongoose.Schema.Types.Mixed, // <-- now can store any JSON object
    //   required: true,
    },
    images: [imageSchema],
  },
  {
    timestamps: true,
  }
);

const Content = mongoose.model("Content", contentModel);
module.exports = Content;

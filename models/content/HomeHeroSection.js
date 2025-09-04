const mongoose = require("mongoose");

const ButtonSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, "Button text required"],
  },
  link: {
    type: String,
    required: [true, "Button link required"],
  },
});

const Banner1CardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title required"],
  },
  desc: {
    type: String,
    required: [true, "Description required"],
  },
  button: {
    type: ButtonSchema,
    required: true,
  },
});

const Banner1Schema = new mongoose.Schema({
  card1: {
    type: Banner1CardSchema,
    required: true,
  },
  card2: {
    type: Banner1CardSchema,
    required: true,
  },
});

const Banner2Schema = new mongoose.Schema({
  button1: {
    type: ButtonSchema,
    required: true,
  },
  button2: {
    type: ButtonSchema,
    required: true,
  },
});

const Banner3Schema = new mongoose.Schema({
  button1: {
    type: ButtonSchema,
    required: true,
  },
  button2: {
    type: ButtonSchema,
    required: true,
  },
});

const HomeHeroSectionSchema = new mongoose.Schema(
  {
    image1: { type: String }, // store uploaded image path / URL
    image2: { type: String },
    image3: { type: String },
    banner1: { type: Banner1Schema, required: true },
    banner2: { type: Banner2Schema, required: true },
    banner3: { type: Banner3Schema, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeHeroSection", HomeHeroSectionSchema);

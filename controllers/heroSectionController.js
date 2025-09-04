const HomeHeroSection = require("../models/content/HomeHeroSection");

// Create new HomeHeroSection
exports.addHomeHeroSection = async (req, res) => {
  try {
    const data = req.body;

    const heroSection = new HomeHeroSection(data);
    await heroSection.save();

    res.status(201).json({ success: true, data: heroSection });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all HomeHeroSections
exports.getHomeHeroSections = async (req, res) => {
  try {
    const heroSections = await HomeHeroSection.find();
    res.status(200).json({ success: true, data: heroSections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single HomeHeroSection by ID
exports.getHomeHeroSectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const heroSection = await HomeHeroSection.findById(id);

    if (!heroSection) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.status(200).json({ success: true, data: heroSection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update HomeHeroSection
exports.updateHomeHeroSection = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedHeroSection = await HomeHeroSection.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedHeroSection) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.status(200).json({ success: true, data: updatedHeroSection });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

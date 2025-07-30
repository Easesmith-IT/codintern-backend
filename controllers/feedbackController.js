const WorkshopFeedback = require('../models/formModel');


const submitFeedback = async (req, res) => {
  try {
    const feedback = new WorkshopFeedback(req.body);
    const savedFeedback = await feedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      data: savedFeedback,
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(400).json({
      message: 'Failed to submit feedback',
      error: error.message,
    });
  }
};

module.exports = {
  submitFeedback,
};

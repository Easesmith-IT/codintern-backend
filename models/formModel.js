const mongoose = require('mongoose');

// Define the schema for workshop feedback
const workshopFeedbackSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: [50, 'First name cannot exceed 50 characters']
  },

  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxLength: [50, 'Last name cannot exceed 50 characters']
  },

  collegeName: {
    type: String,
    required: [true, 'College name is required'],
    trim: true,
    maxLength: [100, 'College name cannot exceed 100 characters']
  },

  enrolmentNumber: {
    type: String,
    required: [true, 'Enrolment number is required'],
    trim: true,
    unique: true,
    maxLength: [20, 'Enrolment number cannot exceed 20 characters']
  },

  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    validate: {
      validator: function (v) {
        return /^\+?[\d\s\-\(\)]+$/.test(v);
      },
      message: 'Please enter a valid contact number'
    }
  },

  emailId: {
    type: String,
    required: [true, 'Email ID is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^[\w\.-]+@[\w\.-]+\.\w+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },

  // Feedback Questions
  overallSatisfaction: {
    type: String,
    required: [true, 'Overall satisfaction rating is required'],
    enum: {
      values: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'],
      message: '{VALUE} is not a valid satisfaction level'
    }
  },

  topicRelevance: {
    type: Number,
    required: [true, 'Topic relevance rating is required'],
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5']
  },

  trainerEffectiveness: {
    type: String,
    required: [true, 'Trainer effectiveness rating is required'],
    enum: {
      values: ['Very Effective', 'Effective', 'Neutral', 'Ineffective', 'Very Ineffective'],
      message: '{VALUE} is not a valid effectiveness level'
    }
  },

  overallExperience: {
    type: String,
    required: [true, 'Overall experience rating is required'],
    enum: {
      values: ['Excellent', 'Good', 'Average', 'Poor'],
      message: '{VALUE} is not a valid experience rating'
    }
  },

  additionalComments: {
    type: String,
    trim: true,
    maxLength: [1000, 'Comments cannot exceed 1000 characters'],
    default: ''
  },

  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },

  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    // required: [true, 'Workshop ID is required']
    required: false  //i could not find any workshop id in DB so for testing purpose i am making it false
  },

  workshopDate: {
    type: Date,
    required: [true, 'Workshop date is required']
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  versionKey: false // Removes __v field
});

// Indexes for better query performance
workshopFeedbackSchema.index({ enrolmentNumber: 1 }); // Unique index
workshopFeedbackSchema.index({ emailId: 1 });
workshopFeedbackSchema.index({ workshopId: 1 });
workshopFeedbackSchema.index({ submittedAt: -1 });
workshopFeedbackSchema.index({ collegeName: 1, workshopId: 1 }); // Compound index

// Virtual for full name
workshopFeedbackSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual to calculate average rating
workshopFeedbackSchema.virtual('averageRating').get(function () {
  const satisfactionScore = {
    'Very Satisfied': 5,
    'Satisfied': 4,
    'Neutral': 3,
    'Dissatisfied': 2
  };

  const effectivenessScore = {
    'Very Effective': 5,
    'Effective': 4,
    'Neutral': 3,
    'Ineffective': 2,
    'Very Ineffective': 1
  };

  const experienceScore = {
    'Excellent': 5,
    'Good': 4,
    'Average': 3,
    'Poor': 2
  };

  const totalScore = (
    satisfactionScore[this.overallSatisfaction] +
    this.topicRelevance +
    effectivenessScore[this.trainerEffectiveness] +
    experienceScore[this.overallExperience]
  );

  return (totalScore / 4).toFixed(2);
});

// Pre-save middleware to normalize data
workshopFeedbackSchema.pre('save', function (next) {
  // Capitalize first letter of names
  this.firstName = this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1).toLowerCase();
  this.lastName = this.lastName.charAt(0).toUpperCase() + this.lastName.slice(1).toLowerCase();

  // Fix typo in schema (Neutral instead of Neuteral)
  if (this.overallSatisfaction === 'Neuteral') {
    this.overallSatisfaction = 'Neutral';
  }

  next();
});

// Static method to get feedback statistics for a workshop
workshopFeedbackSchema.statics.getWorkshopStats = function (workshopId) {
  return this.aggregate([
    { $match: { workshopId: mongoose.Types.ObjectId(workshopId) } },
    {
      $group: {
        _id: '$workshopId',
        totalResponses: { $sum: 1 },
        avgTopicRelevance: { $avg: '$topicRelevance' },
        satisfactionDistribution: {
          $push: '$overallSatisfaction'
        },
        effectivenessDistribution: {
          $push: '$trainerEffectiveness'
        },
        experienceDistribution: {
          $push: '$overallExperience'
        }
      }
    }
  ]);
};

// Instance method to check if feedback is positive
workshopFeedbackSchema.methods.isPositiveFeedback = function () {
  const positiveConditions = [
    ['Very Satisfied', 'Satisfied'].includes(this.overallSatisfaction),
    this.topicRelevance >= 4,
    ['Very Effective', 'Effective'].includes(this.trainerEffectiveness),
    ['Excellent', 'Good'].includes(this.overallExperience)
  ];

  return positiveConditions.filter(Boolean).length >= 3;
};

// Create and export the model
const WorkshopFeedback = mongoose.model('WorkshopFeedback', workshopFeedbackSchema);

module.exports = WorkshopFeedback;

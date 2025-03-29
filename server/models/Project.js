const mongoose = require('mongoose');

const phaseSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['funding', 'vote-decide', 'vote-allocate'],
    required: [true, 'Phase type required']
  },
  title: {
    type: String,
    required: [true, 'Phase title required'],
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return v > Date.now();
      },
      message: 'End date must be in the future'
    }
  },
  targetAmount: {
    type: Number,
    min: [1000, 'Minimum target amount is 1000']
  },
  options: [{
    type: String,
    maxlength: 100
  }],
  formula: {
    type: String,
    enum: ['proportional', 'top-3', 'equal', 'custom'],
    default: 'proportional'
  },
  eligibility: mongoose.Schema.Types.Mixed
});

const projectSchema = new mongoose.Schema({
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Creator ID required'] 
  },
  title: { 
    type: String, 
    required: [true, 'Project title required'],
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000
  },
  images: [{
    type: String, // Store URLs from cloud storage
    validate: {
      validator: v => /^(https?:\/\/).+\.(jpg|jpeg|png|webp)$/.test(v),
      message: 'Invalid image URL format'
    }
  }],
  phases: {
    type: [phaseSchema],
    validate: {
      validator: v => v.length > 0,
      message: 'At least one phase required'
    }
  },
  followers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  status: { 
    type: String, 
    enum: ['draft', 'active', 'blocked', 'completed'],
    default: 'draft' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
const mongoose = require('mongoose');
const crypto = require('crypto');

const voteSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: [true, 'Project ID required'],
    index: true 
  },
  phaseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: [true, 'Phase ID required'],
    index: true 
  },
  option: { 
    type: String, 
    required: [true, 'Voting option required'],
    maxlength: 100 
  },
  anonymousId: {
    type: String,
    required: true,
    index: true,
    default: function() {
      return crypto.createHash('sha256')
        .update(this.userId + process.env.ANON_SALT)
        .digest('hex');
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// Add compound index for voting integrity
voteSchema.index({ projectId: 1, phaseId: 1, anonymousId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
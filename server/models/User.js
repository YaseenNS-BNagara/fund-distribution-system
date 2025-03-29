const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8,
    select: false
  },
  role: { 
    type: String, 
    enum: ['user', 'creator', 'admin'],
    default: 'user'
  },
  verified: { 
    type: Boolean, 
    default: false 
  },
  profile: {
    name: { type: String, trim: true },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other', 'prefer-not-to-say'] 
    },
    incomeLevel: {
      type: String,
      enum: ['BPL', 'APL', 'middle', 'upper-middle', 'high']
    },
    location: {
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      verified: Boolean
    }
  },
  verificationRequests: [{
    field: {
      type: String,
      enum: ['creator','gender', 'incomeLevel', 'location']
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Security Enhancements
  invalidatedAt: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Password Hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password Comparison
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

//creator verification auto-request
userSchema.pre('save', function(next) {
  if (this.role === 'creator' && this.isNew && !this.isModified('role')) {
    this.verificationRequests = [{
      field: 'creator',
      status: 'pending',
      submittedAt:new Date()
    }];
  }
  next();
});

// Account Locking
userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil > Date.now()) return;
  
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 15*60*1000; // 15 minute lock
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
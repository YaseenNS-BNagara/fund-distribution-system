const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register (Only Users/Creators)
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Security Fix: Remove admin from allowed roles
    if (!['creator', 'user'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid role. Allowed: creator, user' 
      });
    }

    const user = new User({ email, password, role });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        verified: user.verified
      },
      token
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: 'Registration failed',
      ...(process.env.NODE_ENV === 'development' && { debug: err.message })
    });
  }
});

// Login (Password Fix Maintained)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Security: Keep password selection only here
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        verified: user.verified
      },
      token
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      ...(process.env.NODE_ENV === 'development' && { debug: err.message })
    });
  }
});

module.exports = router;
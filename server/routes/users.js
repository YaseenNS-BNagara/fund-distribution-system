const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Update user profile
router.patch('/me', auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['profile'];
    const isValidOperation = updates.every(update => 
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates!' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: 'Update failed' 
    });
  }
});

module.exports = router;
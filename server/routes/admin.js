const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { admin } = require('../middleware/roles');
const User = require('../models/User');
const Project = require('../models/Project');

// Get pending creator verifications
router.get('/pending-verifications', auth, admin, async (req, res) => {
  try {
    const pendingCreators = await User.find({
      role: 'creator',
      verified: false,
      'verificationRequests.field': 'creator',
      'verificationRequests.status': 'pending'
    }).select('email verificationRequests');

    res.json({ success: true, pendingCreators });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending verifications'
    });
  }
});

// Approve Creator
router.put('/verify-creator/:userId', auth, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { 
        role: 'creator',
        verified: true,
        'verificationRequests.$[elem].status': 'approved' 
      },
      { 
        arrayFilters: [{ 'elem.field': 'creator' }],
        new: true
      }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: 'Approval failed',
      ...(process.env.NODE_ENV === 'development' && { debug: err.message })
    });
  }
});

// Toggle Project Status
router.put('/projects/:id/status', auth, admin, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project: {
        id: project._id,
        status: project.status
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: 'Status update failed',
      ...(process.env.NODE_ENV === 'development' && { debug: err.message })
    });
  }
});

module.exports = router;
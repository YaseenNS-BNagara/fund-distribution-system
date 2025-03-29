const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const auth = require('../middleware/auth');
const checkEligibility = require('../middleware/eligibility'); // Correct import

// Submit Vote
router.post('/:projectId/:phaseId', 
  auth, 
  checkEligibility, // Now properly imported as function
  async (req, res) => {
    try {
      const vote = new Vote({
        projectId: req.params.projectId,
        phaseId: req.params.phaseId,
        option: req.body.option,
        anonymousId: req.anonymousId // From middleware
      });

      await vote.save();
      
      res.status(201).json({
        success: true,
        message: 'Vote recorded successfully'
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: 'Vote submission failed',
        ...(process.env.NODE_ENV === 'development' && { debug: err.message })
      });
    }
  }
);

// Get Results (unchanged)
router.get('/:projectId/:phaseId/results', async (req, res) => {
  try {
    const results = await Vote.aggregate([
      { 
        $match: { 
          projectId: new mongoose.Types.ObjectId(req.params.projectId),
          phaseId: new mongoose.Types.ObjectId(req.params.phaseId)
        }
      },
      { $group: { _id: "$option", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      results
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate results',
      ...(process.env.NODE_ENV === 'development' && { debug: err.message })
    });
  }
});

module.exports = router;
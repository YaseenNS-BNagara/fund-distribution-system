const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const { creator } = require('../middleware/roles');
const validatePhase = require('../middleware/validatePhase');

// Create Project (Creator Only) - With validation
router.post('/', auth, creator, validatePhase, async (req, res) => {
  try {
    // Allow only whitelisted fields
    const projectData = {
      title: req.body.title,
      description: req.body.description,
      phases: req.body.phases,
      creator: req.user.id
    };

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      project: {
        id: project._id,
        title: project.title,
        status: project.status,
        phases: project.phases.length
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: 'Project creation failed',
      ...(process.env.NODE_ENV === 'development' && { debug: err.message })
    });
  }
});

// Add Phase to Project - With validation
router.post('/:id/phases', auth, creator, validatePhase, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Validate single phase structure
    if (!req.body.type || !req.body.title) {
      return res.status(400).json({
        success: false,
        error: 'Phase type and title are required'
      });
    }

    project.phases.push(req.body);
    await project.save();

    res.status(201).json({
      success: true,
      phase: project.phases[project.phases.length - 1]
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: 'Phase addition failed',
      ...(process.env.NODE_ENV === 'development' && { debug: err.message })
    });
  }
});

// Get Project Details
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('creator', 'email')
      .select('-__v');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: 'Failed to fetch project',
      ...(process.env.NODE_ENV === 'development' && { debug: err.message })
    });
  }
});

module.exports = router;
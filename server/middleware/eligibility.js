const crypto = require('crypto');
const Project = require('../models/Project');
const geolib = require('geolib');

const checkField = (userValue, requirement) => {
  // Handle OR conditions for array requirements
  if (Array.isArray(requirement)) {
    return requirement.some(r => checkField(userValue, r));
  }

  // Handle geographic radius check
  if (typeof requirement === 'object' && requirement.coordinates) {
    if (!userValue?.coordinates) return false;
    return geolib.isPointWithinRadius(
      { latitude: userValue.coordinates.latitude, longitude: userValue.coordinates.longitude },
      { latitude: requirement.coordinates.latitude, longitude: requirement.coordinates.longitude },
      requirement.radius || 50000 // Default 50km
    );
  }

  // Handle numeric range checks
  if (typeof requirement === 'object' && requirement.min !== undefined && requirement.max !== undefined) {
    return userValue >= requirement.min && userValue <= requirement.max;
  }

  // Direct equality check
  return userValue === requirement;
};

const checkEligibility = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .select('phases.eligibility phases.endDate');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const currentPhase = project.phases.id(req.params.phaseId);
    
    if (!currentPhase) {
      return res.status(404).json({
        success: false,
        error: 'Voting phase not found'
      });
    }

    // Phase time validation
    if (currentPhase.endDate && currentPhase.endDate < new Date()) {
      return res.status(403).json({
        success: false,
        error: 'Voting phase has ended'
      });
    }

    // Eligibility verification
    if (currentPhase.eligibility) {
      const missingFields = [];
      const failedChecks = [];

      const eligibilityMet = Object.entries(currentPhase.eligibility)
        .every(([field, requirement]) => {
          const userValue = req.user.profile[field];
          
          if (userValue === undefined || userValue === null) {
            missingFields.push(field);
            return false;
          }

          const meetsRequirement = checkField(userValue, requirement);
          if (!meetsRequirement) failedChecks.push(field);
          return meetsRequirement;
        });

      if (!eligibilityMet) {
        return res.status(403).json({
          success: false,
          error: 'Eligibility requirements not met',
          details: {
            missingFields,
            failedChecks,
            required: currentPhase.eligibility
          }
        });
      }
    }

    // Anonymous ID generation
    if (!process.env.ANON_SALT) {
      throw new Error('ANON_SALT environment variable missing');
    }
    
    req.anonymousId = crypto.createHash('sha256')
      .update(`${req.user.id}${process.env.ANON_SALT}`)
      .digest('hex');

    next();
  } catch (err) {
    console.error('Eligibility Check Error:', err);
    res.status(500).json({
      success: false,
      error: 'Eligibility verification failed',
      ...(process.env.NODE_ENV === 'development' && { debug: err.message })
    });
  }
};

module.exports = checkEligibility;
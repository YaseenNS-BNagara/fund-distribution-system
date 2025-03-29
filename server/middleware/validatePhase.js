const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  // 1. Validate phase types
  const validTypes = ['funding', 'vote-decide', 'vote-allocate'];
  const phases = req.body.phases || [];
  
  // 2. Check at least one phase exists
  if (!phases.length) {
    return res.status(400).json({
      success: false,
      error: 'At least one phase required'
    });
  }

  // 3. Validate each phase
  const invalidPhases = phases.filter(phase => {
    return !validTypes.includes(phase.type) ||
           !phase.title ||
           (phase.type === 'funding' && !phase.targetAmount) ||
           (phase.type.includes('vote') && !phase.options?.length);
  });

  if (invalidPhases.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phase structure',
      invalidPhases
    });
  }

  next();
};
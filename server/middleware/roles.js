const handleRoleCheck = (requiredRole) => (req, res, next) => {
  if (!req.user?.role || req.user.role !== requiredRole) {
    return res.status(403).json({
      success: false,
      error: `${requiredRole} privileges required`,
      currentRole: req.user?.role || 'unauthenticated'
    });
  }
  next();
};

module.exports = {
  creator: handleRoleCheck('creator'),
  admin: handleRoleCheck('admin')
};
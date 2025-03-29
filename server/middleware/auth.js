const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // 1. Extract and validate authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[Auth] Invalid authorization header format');
      return res.status(401).json({
        success: false,
        error: 'Authorization header must be: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('[Auth] Processing token:', token);

    // 2. Verify JWT with enhanced error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        ignoreExpiration: false,
        algorithms: ['HS256']
      });
      console.log('[Auth] Decoded token payload:', {
        userId: decoded.userId,
        issued: new Date(decoded.iat * 1000).toISOString(),
        expires: new Date(decoded.exp * 1000).toISOString()
      });
    } catch (jwtError) {
      console.error('[Auth] JWT verification failed:', {
        error: jwtError.name,
        message: jwtError.message
      });
      return handleAuthError(res, jwtError);
    }

    // 3. Validate user ID format
    if (!mongoose.isValidObjectId(decoded.userId)) {
      console.error('[Auth] Invalid user ID format:', decoded.userId);
      return res.status(401).json({
        success: false,
        error: 'Invalid user identifier',
        debug: { receivedId: decoded.userId }
      });
    }

    // 4. Retrieve user with security checks
    const user = await User.findOne({
      _id: decoded.userId,
      invalidatedAt: { $lt: new Date(decoded.iat * 1000) }
    }).select('+loginAttempts +lockUntil').lean();

console.log('[Debug] User Document from DB:', JSON.stringify(user, null, 2));
console.log('[Debug] Token Issued At Timestamp:', new Date(decoded.iat * 1000));
console.log('[Debug] invalidatedAt Value:', user?.invalidatedAt);

    if (!user) {
      console.error('[Auth] User not found for ID:', decoded.userId);
      return res.status(401).json({
        success: false,
        error: 'Account not found or session invalidated'
      });
    }

    // 5. Validate account status
    if (user.lockUntil?.getTime() > Date.now()) {
      console.log('[Auth] Account locked:', {
        userId: user._id,
        lockUntil: user.lockUntil.toISOString()
      });
      return res.status(403).json({
        success: false,
        error: 'Account temporarily locked. Try again later'
      });
    }

    // 6. Verify account status based on role
    if ((user.role === 'admin' || user.role === 'creator') && !user.verified) {
      console.error('[Auth] Unverified privileged account access:', {
        userId: user._id,
        role: user.role
      });
      return res.status(403).json({
        success: false,
        error: 'Account requires verification'
      });
    }

    // 7. Attach authenticated user context
    req.auth = {
      id: user._id,
      email: user.email,
      role: user.role,
      verified: user.verified,
      privileges: []
    };

    if (user.role === 'admin') {
      req.auth.privileges = ['manage-users', 'verify-creators', 'modify-projects'];
    }

    console.log('[Auth] Successful authentication:', {
      userId: user._id,
      role: user.role,
      verified: user.verified
    });

    next();
  } catch (error) {
    console.error('[Auth] Unexpected error:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Authentication system error'
    });
  }
};

function handleAuthError(res, error) {
  const response = {
    success: false,
    error: 'Invalid authentication token'
  };

  if (error.name === 'TokenExpiredError') {
    response.error = 'Session expired. Please login again';
    response.debug = { expiredAt: new Date(error.expiredAt * 1000) };
  } else if (error.name === 'JsonWebTokenError') {
    response.error = 'Malformed authentication token';
  }

  return res.status(401).json(response);
}
/**
 * JWT Authentication Middleware
 *
 * Validates JWT tokens and protects routes from unauthorized access
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to verify JWT token from Authorization header
 *
 * Expected header format: "Authorization: Bearer <token>"
 *
 * On success: Adds req.user = { email, timestamp } and calls next()
 * On failure: Returns 401 with error message
 */
function verifyToken(req, res, next) {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required. Please log in.'
      });
    }

    // Check format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Invalid authorization format. Expected: Bearer <token>'
      });
    }

    const token = parts[1];

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user info to request object
    req.user = {
      email: decoded.email,
      timestamp: decoded.timestamp
    };

    // Log request for audit trail
    console.log(`🔐 Authenticated request from: ${decoded.email}`);

    // Continue to next middleware/route handler
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session expired. Please log in again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid authentication token. Please log in again.'
      });
    }

    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Authentication failed. Please try again.'
    });
  }
}

module.exports = {
  verifyToken
};

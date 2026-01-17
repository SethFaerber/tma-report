/**
 * Authentication API Route
 *
 * POST /api/auth/verify
 * Verifies email against whitelist and issues JWT tokens
 */

const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';

/**
 * Parse whitelisted emails from environment variable
 * @returns {Set<string>} Set of normalized email addresses
 */
function getWhitelistedEmails() {
  const emailsString = process.env.WHITELISTED_EMAILS || '';

  if (!emailsString.trim()) {
    console.warn('⚠️  WARNING: WHITELISTED_EMAILS not configured. No emails will be authorized.');
    return new Set();
  }

  // Split by comma, normalize (lowercase and trim), and create Set for fast lookup
  const emails = emailsString
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);

  console.log(`✅ Loaded ${emails.length} whitelisted emails`);

  return new Set(emails);
}

// Load whitelist once at startup
const WHITELISTED_EMAILS = getWhitelistedEmails();

/**
 * POST /api/auth/verify
 *
 * Verifies if email is whitelisted and returns JWT token
 *
 * Request:
 * {
 *   email: "user@example.com"
 * }
 *
 * Response (success):
 * {
 *   success: true,
 *   token: "jwt.token.here",
 *   email: "user@example.com"
 * }
 *
 * Response (error):
 * {
 *   success: false,
 *   error: "Email not authorized"
 * }
 */
router.post('/verify', (req, res) => {
  try {
    const { email } = req.body;

    // Validate email provided
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.trim().toLowerCase();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if email is whitelisted
    if (!WHITELISTED_EMAILS.has(normalizedEmail)) {
      console.log(`🚫 Authentication attempt failed: ${normalizedEmail}`);
      return res.status(403).json({
        success: false,
        error: 'Email not authorized. Please contact your administrator.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        email: normalizedEmail,
        timestamp: Date.now()
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    console.log(`✅ Authentication successful: ${normalizedEmail}`);

    // Return success with token
    res.json({
      success: true,
      token,
      email: normalizedEmail
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed. Please try again.'
    });
  }
});

module.exports = router;

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Set timeout for routes that need longer processing (Claude API calls)
app.use('/api/analyze', (req, res, next) => {
  // Set 120 second timeout for analysis endpoint (Claude API takes 30-60s)
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
const authRoute = require('./routes/auth');
const analyzeRoute = require('./routes/analyze');
const { verifyToken } = require('./middleware/authMiddleware');

// Public routes (no authentication required)
app.use('/api/auth', authRoute);

// Protected routes (authentication required)
app.use('/api', verifyToken, analyzeRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Key configured: ${process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);
  console.log(`JWT Secret configured: ${process.env.JWT_SECRET ? 'Yes' : 'No (using default)'}`);
  console.log(`Whitelisted Emails configured: ${process.env.WHITELISTED_EMAILS ? 'Yes' : 'No'}`);
});

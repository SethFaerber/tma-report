require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (temporary storage)
const upload = multer({ dest: 'uploads/' });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes will be imported and mounted here
// const analyzeRoute = require('./routes/analyze');
// app.use('/api', analyzeRoute);

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
});

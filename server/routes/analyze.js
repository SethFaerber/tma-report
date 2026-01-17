/**
 * Analysis API Route
 *
 * POST /api/analyze
 * Orchestrates the full pipeline: Excel → Parse → Calculate → Claude → PDF
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parseExcelFile } = require('../services/excelParser');
const { calculateAll } = require('../services/calculator');
const { generateInsights } = require('../services/claudeService');
const { generatePDF } = require('../services/pdfGenerator');

const router = express.Router();

// Configure Multer for file uploads
// Save to temporary directory with sanitized filenames
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept .xlsx files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are accepted'), false);
    }
  }
});

/**
 * POST /api/analyze
 *
 * Request:
 * - file: Excel file (.xlsx)
 * - teamName: string (required)
 * - specialInstructions: string (optional)
 *
 * Response:
 * - Success: PDF file stream
 * - Error: JSON error message
 */
router.post('/analyze', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  let pdfPath = null;

  try {
    // Validate inputs
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please provide an Excel file.'
      });
    }

    const { teamName, specialInstructions = '' } = req.body;

    if (!teamName || teamName.trim() === '') {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Team name is required.'
      });
    }

    tempFilePath = req.file.path;

    console.log(`📊 Processing analysis request for team: "${teamName}"`);
    console.log(`📁 Uploaded file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Step 1: Parse Excel file
    console.log('🔍 Step 1: Parsing Excel file...');
    const parsedData = parseExcelFile(tempFilePath);
    console.log(`✅ Parsed ${parsedData.respondents.length} respondents, ${parsedData.questions.length} questions`);

    // Step 2: Calculate statistics
    console.log('📈 Step 2: Calculating statistics...');
    const calculatedData = calculateAll(parsedData);
    console.log(`✅ Calculated driver scores for ${Object.keys(calculatedData.driverScores).length} drivers`);

    // Step 3: Generate Claude insights
    console.log('🤖 Step 3: Calling Claude API for insights...');
    console.log('   (This may take 30-60 seconds...)');
    const claudeInsights = await generateInsights(teamName, calculatedData, specialInstructions);
    console.log('✅ Claude insights generated successfully');

    // Step 4: Generate PDF
    console.log('📄 Step 4: Generating PDF report...');
    pdfPath = path.join(__dirname, '../uploads', `report-${Date.now()}.pdf`);
    await generatePDF(teamName, calculatedData, claudeInsights, pdfPath);
    console.log('✅ PDF generated successfully');

    // Step 5: Stream PDF to client
    console.log('📤 Step 5: Sending PDF to client...');

    // Set headers for PDF download
    const sanitizedTeamName = teamName.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_');
    const filename = `Strategic_Maturity_Assessment_${sanitizedTeamName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the PDF file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

    // Clean up temporary files after streaming completes
    fileStream.on('end', () => {
      console.log('✅ PDF sent successfully');

      // Delete temporary files
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    });

    fileStream.on('error', (error) => {
      console.error('Error streaming PDF:', error);

      // Clean up on error
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    });

  } catch (error) {
    console.error('❌ Analysis pipeline error:', error);

    // Clean up temporary files on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (pdfPath && fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    // Send user-friendly error message
    let errorMessage = 'An error occurred while processing your request.';
    let statusCode = 500;

    if (error.message.includes('Excel file') || error.message.includes('respondent')) {
      errorMessage = `Invalid Excel file: ${error.message}`;
      statusCode = 400;
    } else if (error.message.includes('API key')) {
      errorMessage = 'Server configuration error. Please contact support.';
      statusCode = 500;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Service temporarily unavailable. Please try again in a few moments.';
      statusCode = 429;
    } else if (error.message.includes('Analysis failed')) {
      errorMessage = error.message;
      statusCode = 500;
    }

    res.status(statusCode).json({ error: errorMessage });
  }
});

module.exports = router;

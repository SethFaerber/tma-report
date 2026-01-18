/**
 * PDF Generator Service
 *
 * Creates professionally formatted PDF reports using PDFKit.
 * Handles multi-page layout with tables, charts, and AI-generated content.
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatDate } = require('./claudeService');

// Page layout constants
const MARGIN = 50;
const PAGE_WIDTH = 612; // Standard letter size
const PAGE_HEIGHT = 792;
const USABLE_WIDTH = PAGE_WIDTH - (MARGIN * 2);

/**
 * Creates a new page with consistent margins
 * @param {PDFDocument} doc - PDFKit document
 */
function addNewPage(doc) {
  doc.addPage({ margin: MARGIN });
}

/**
 * Draws a horizontal line
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} y - Y position
 */
function drawLine(doc, y) {
  doc.strokeColor('#cccccc')
     .lineWidth(0.5)
     .moveTo(MARGIN, y)
     .lineTo(PAGE_WIDTH - MARGIN, y)
     .stroke();
}

/**
 * Draws grid lines for distribution tables
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} x - Starting X position
 * @param {number} y - Row Y position
 * @param {number[]} colWidths - Array of column widths
 * @param {number} rowHeight - Height of the row
 */
function drawTableGrid(doc, x, y, colWidths, rowHeight) {
  doc.strokeColor('#b3b3b3').lineWidth(0.5);

  // Draw vertical lines between columns
  let currentX = x;
  colWidths.forEach((width, index) => {
    currentX += width;
    // Draw vertical line from row top to row bottom
    doc.moveTo(currentX, y - 2)
       .lineTo(currentX, y + rowHeight - 2)
       .stroke();
  });

  // Draw horizontal line at bottom of row
  doc.moveTo(x, y + rowHeight - 2)
     .lineTo(x + colWidths.reduce((sum, w) => sum + w, 0), y + rowHeight - 2)
     .stroke();
}

/**
 * Generates Page 1: Cover Page
 */
function generateCoverPage(doc, teamName, logoPath) {
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .text('Strategic Maturity Assessment', MARGIN, 200, { align: 'center' });

  doc.fontSize(24)
     .text('Results', MARGIN, 240, { align: 'center' });

  // Add logo if it exists
  if (fs.existsSync(logoPath)) {
    const logoX = (PAGE_WIDTH - 200) / 2;
    doc.image(logoPath, logoX, 320, { width: 200 });
  }

  // Team name
  doc.fontSize(18)
     .font('Helvetica')
     .text(teamName, MARGIN, 550, { align: 'center' });

  // Date
  doc.fontSize(14)
     .fillColor('#666666')
     .text(formatDate(), MARGIN, 580, { align: 'center' });
}

/**
 * Generates Page 2: Team Summary with Driver Scores
 */
function generateTeamSummary(doc, teamName, executiveSummary, driverScores, strongestDriver, weakestDriver) {
  addNewPage(doc);

  // Header
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor('#000000')
     .text('Your Team\'s Strategic Level', MARGIN, MARGIN);

  let y = MARGIN + 40;

  // Team name
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text(teamName, MARGIN, y);

  y += 25;

  // Executive summary
  doc.fontSize(11)
     .font('Helvetica')
     .text(executiveSummary, MARGIN, y, { width: USABLE_WIDTH, align: 'left' });

  y += doc.heightOfString(executiveSummary, { width: USABLE_WIDTH }) + 30;

  // Driver Scores Table Header
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Driver Scores', MARGIN, y);

  y += 25;

  // Table headers
  const colWidths = [200, 80, 200];
  const tableX = MARGIN;

  doc.fontSize(10)
     .font('Helvetica-Bold');
  doc.text('Competency', tableX, y);
  doc.text('Score', tableX + colWidths[0], y, { width: colWidths[1], align: 'center' });
  doc.text('Note', tableX + colWidths[0] + colWidths[1], y);

  y += 20;
  drawLine(doc, y);
  y += 10;

  // Sort drivers by score (descending)
  const sortedDrivers = Object.entries(driverScores).sort((a, b) => b[1] - a[1]);

  // Table rows
  doc.font('Helvetica');
  sortedDrivers.forEach(([driver, score]) => {
    let note = '';
    if (driver === strongestDriver.name) note = 'Your strongest driver';
    if (driver === weakestDriver.name) note = 'Your weakest driver';

    doc.text(driver, tableX, y);
    doc.text(score.toFixed(2), tableX + colWidths[0], y, { width: colWidths[1], align: 'center' });
    if (note) {
      doc.fillColor('#0066cc').text(note, tableX + colWidths[0] + colWidths[1], y);
      doc.fillColor('#000000');
    }

    y += 20;
  });
}

/**
 * Generates table pages for question data (alignment, differences, scores)
 * @param {PDFDocument} doc - PDFKit document
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {Array} questions - Sorted questions array
 * @param {string} format - 'distribution' or 'average'
 */
function generateQuestionTable(doc, title, description, questions, format = 'distribution') {
  addNewPage(doc);

  // Header
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#000000')
     .text(title, MARGIN, MARGIN);

  let y = MARGIN + 30;

  // Description
  doc.fontSize(10)
     .font('Helvetica')
     .text(description, MARGIN, y, { width: USABLE_WIDTH });

  y += 40;

  if (format === 'distribution') {
    // Distribution table: Driver | Skill & Competency | 1 | 2 | 3 | 4 | 5
    const colWidths = [70, 250, 30, 30, 30, 30, 30];
    const tableX = MARGIN;

    // Table headers
    doc.fontSize(9)
       .font('Helvetica-Bold');
    doc.text('Driver', tableX, y);
    doc.text('Skill & Competency', tableX + colWidths[0], y);
    doc.text('1', tableX + colWidths[0] + colWidths[1], y, { width: colWidths[2], align: 'center' });
    doc.text('2', tableX + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3], align: 'center' });
    doc.text('3', tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4], align: 'center' });
    doc.text('4', tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y, { width: colWidths[5], align: 'center' });
    doc.text('5', tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], y, { width: colWidths[6], align: 'center' });

    y += 15;
    drawLine(doc, y);
    y += 5;

    // Table rows
    doc.font('Helvetica').fontSize(8);

    questions.forEach((q, index) => {
      // Check if we need a new page
      if (y > PAGE_HEIGHT - 100) {
        addNewPage(doc);
        y = MARGIN;
      }

      // Show driver name in every row
      const driverText = q.driver;

      // Truncate text if too long
      const competencyText = `${q.skill}: ${q.text}`;
      const truncated = competencyText.length > 60 ? competencyText.substring(0, 57) + '...' : competencyText;

      // Vertical centering offset for 20px row height with 8px font
      const verticalOffset = 6;

      doc.text(driverText, tableX, y + verticalOffset, { width: colWidths[0] });
      doc.text(truncated, tableX + colWidths[0], y + verticalOffset, { width: colWidths[1] });

      // Distribution counts
      q.distribution.forEach((count, idx) => {
        const xPos = tableX + colWidths[0] + colWidths[1] + colWidths.slice(2, 2 + idx).reduce((sum, w) => sum + w, 0);
        doc.text(String(count), xPos, y + verticalOffset, { width: colWidths[2 + idx], align: 'center' });
      });

      // Draw grid lines for this row
      drawTableGrid(doc, tableX, y, colWidths, 20);

      y += 20;
    });

  } else {
    // Average table: Driver | Skill & Competency | Average
    const colWidths = [70, 380, 60];
    const tableX = MARGIN;

    // Table headers
    doc.fontSize(9)
       .font('Helvetica-Bold');
    doc.text('Driver', tableX, y);
    doc.text('Skill & Competency', tableX + colWidths[0], y);
    doc.text('Average', tableX + colWidths[0] + colWidths[1], y, { width: colWidths[2], align: 'center' });

    y += 15;
    drawLine(doc, y);
    y += 5;

    // Table rows
    doc.font('Helvetica').fontSize(8);

    questions.forEach((q) => {
      // Check if we need a new page
      if (y > PAGE_HEIGHT - 100) {
        addNewPage(doc);
        y = MARGIN;
      }

      // Show driver name in every row
      const driverText = q.driver;

      // Truncate text if too long
      const competencyText = `${q.skill}: ${q.text}`;
      const truncated = competencyText.length > 75 ? competencyText.substring(0, 72) + '...' : competencyText;

      doc.text(driverText, tableX, y, { width: colWidths[0] });
      doc.text(truncated, tableX + colWidths[0], y, { width: colWidths[1] });
      doc.text(q.average.toFixed(2), tableX + colWidths[0] + colWidths[1], y, { width: colWidths[2], align: 'center' });

      y += 20;
    });
  }
}

/**
 * Generates Page 11: Discussion Questions
 */
function generateDiscussionQuestions(doc, aiQuestions) {
  addNewPage(doc);

  // Header
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#000000')
     .text('Group Discussion Questions', MARGIN, MARGIN);

  let y = MARGIN + 30;

  // Description
  doc.fontSize(10)
     .font('Helvetica')
     .text('Discuss these with your team to decide what to do next.', MARGIN, y, { width: USABLE_WIDTH });

  y += 40;

  // Fixed questions
  const fixedQuestions = [
    'Do these results accurately describe our current state?',
    'What is causing our key areas of difference?',
    'Which competencies, if focused on, would create the most value for our team/business?',
    'What can we do in the near term (weeks/months) to level up in those areas?'
  ];

  doc.fontSize(11).font('Helvetica');

  fixedQuestions.forEach((q, index) => {
    doc.text(`${index + 1}. ${q}`, MARGIN, y, { width: USABLE_WIDTH });
    y += doc.heightOfString(`${index + 1}. ${q}`, { width: USABLE_WIDTH }) + 15;
  });

  y += 10;

  // AI-generated questions
  aiQuestions.forEach((q, index) => {
    if (y > PAGE_HEIGHT - 100) {
      addNewPage(doc);
      y = MARGIN;
    }
    doc.text(`${index + 5}. ${q}`, MARGIN, y, { width: USABLE_WIDTH });
    y += doc.heightOfString(`${index + 5}. ${q}`, { width: USABLE_WIDTH }) + 15;
  });
}

/**
 * Generates Team Member Analysis pages
 */
function generateTeamMemberAnalysis(doc, teamMemberAnalysis) {
  addNewPage(doc);

  // Header
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#000000')
     .text('Team Member Analysis', MARGIN, MARGIN);

  let y = MARGIN + 40;

  teamMemberAnalysis.forEach((member) => {
    // Check if we need a new page
    if (y > PAGE_HEIGHT - 150) {
      addNewPage(doc);
      y = MARGIN;
    }

    // Member name
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(member.name, MARGIN, y);

    y += 25;

    // Insight
    doc.fontSize(11)
       .font('Helvetica')
       .text(member.insight, MARGIN, y, { width: USABLE_WIDTH });

    y += doc.heightOfString(member.insight, { width: USABLE_WIDTH }) + 15;

    // Follow-up question
    doc.fontSize(11)
       .font('Helvetica-Oblique')
       .fillColor('#0066cc')
       .text(`Follow-up question: ${member.followUpQuestion}`, MARGIN, y, { width: USABLE_WIDTH });

    doc.fillColor('#000000');

    y += doc.heightOfString(`Follow-up question: ${member.followUpQuestion}`, { width: USABLE_WIDTH }) + 30;
  });
}

/**
 * Generates final page for special analysis (if provided)
 */
function generateSpecialAnalysis(doc, specialAnalysis) {
  if (!specialAnalysis) return;

  addNewPage(doc);

  // Header
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#000000')
     .text('Additional Analysis', MARGIN, MARGIN);

  let y = MARGIN + 40;

  // Analysis content
  doc.fontSize(11)
     .font('Helvetica')
     .text(specialAnalysis, MARGIN, y, { width: USABLE_WIDTH });
}

/**
 * Main function to generate complete PDF report
 * @param {string} teamName - Team name
 * @param {Object} calculatedData - Pre-calculated statistics
 * @param {Object} claudeInsights - Claude-generated insights
 * @param {string} outputPath - Path to save PDF
 * @returns {Promise<void>}
 */
async function generatePDF(teamName, calculatedData, claudeInsights, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: MARGIN, size: 'LETTER' });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Page 1: Cover
      const logoPath = path.join(__dirname, '../assets/ramsey-logo.png');
      generateCoverPage(doc, teamName, logoPath);

      // Page 2: Team Summary
      generateTeamSummary(
        doc,
        teamName,
        claudeInsights.executiveSummary,
        calculatedData.driverScores,
        calculatedData.strongestDriver,
        calculatedData.weakestDriver
      );

      // Pages 3-4: Response Distribution (organized by Excel question order)
      generateQuestionTable(
        doc,
        'Response Distribution',
        'This chart shows the distribution of team responses for all skills and competencies, organized by driver in question order.',
        calculatedData.sortedByAlignment,
        'distribution'
      );

      // Pages 5-6: Team Alignment Analysis (organized by Excel question order)
      generateQuestionTable(
        doc,
        'Team Alignment Analysis',
        'This chart provides another view of response patterns across all competencies. Questions are grouped by strategic driver.',
        calculatedData.sortedByDifference,
        'distribution'
      );

      // Pages 7-8: Average Scores by Competency
      generateQuestionTable(
        doc,
        'Average Scores by Competency',
        'This chart shows average scores for all skills and competencies, organized by driver in question order.',
        calculatedData.sortedByHighestScore,
        'average'
      );

      // Pages 9-10: Detailed Score Summary
      generateQuestionTable(
        doc,
        'Detailed Score Summary',
        'A complete summary of average scores across all competencies, grouped by strategic driver.',
        calculatedData.sortedByLowestScore,
        'average'
      );

      // Page 11: Discussion Questions
      generateDiscussionQuestions(doc, claudeInsights.discussionQuestions);

      // Page 12+: Team Member Analysis
      generateTeamMemberAnalysis(doc, claudeInsights.teamMemberAnalysis);

      // Final page (if applicable): Special Analysis
      if (claudeInsights.specialAnalysis) {
        generateSpecialAnalysis(doc, claudeInsights.specialAnalysis);
      }

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        console.log('✅ PDF generated successfully');
        resolve();
      });

      stream.on('error', (error) => {
        console.error('PDF generation error:', error);
        reject(new Error('Failed to generate report. Please try again.'));
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      reject(new Error('Failed to generate report. Please try again.'));
    }
  });
}

module.exports = {
  generatePDF
};

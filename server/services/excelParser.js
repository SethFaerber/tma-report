/**
 * Excel Parser Service
 *
 * Parses Microsoft Forms Excel exports and extracts respondent data
 * and question responses, converting Likert scale text to numeric scores.
 */

const XLSX = require('xlsx');
const questionMapping = require('../config/questionMapping');

/**
 * Score mapping for Likert scale responses
 */
const SCORE_MAP = {
  'strongly agree': 5,
  'agree': 4,
  'neutral': 3,
  'disagree': 2,
  'strongly disagree': 1
};

/**
 * Normalizes response text for matching
 * @param {string} response - Raw response text
 * @returns {string} Normalized response
 */
function normalizeResponse(response) {
  if (!response) return '';
  return String(response).trim().toLowerCase();
}

/**
 * Converts Likert scale text to numeric score
 * @param {string} response - Likert scale response text
 * @returns {number|null} Score 1-5, or null if invalid
 */
function textToScore(response) {
  const normalized = normalizeResponse(response);
  return SCORE_MAP[normalized] ?? null;
}

/**
 * Parses Excel file and extracts structured assessment data
 *
 * Excel structure:
 * - Column 0 (A): ID
 * - Column 1 (B): Start time
 * - Column 2 (C): Completion time
 * - Column 3 (D): Email address (IGNORED - not read or stored for privacy)
 * - Column 4 (E): Respondent name (THIS IS WHAT WE USE)
 * - Column 5 (F): Last modified time
 * - Columns 6-8 (G-I): Open-ended questions (skipped)
 * - Columns 9-90 (J-CM): 82 scoreable Likert scale questions
 *
 * PRIVACY NOTE: Email addresses in column D are intentionally not read,
 * parsed, stored, or included in any output to protect PII.
 *
 * @param {string} filePath - Path to Excel file
 * @returns {Object} Structured data with respondents and questions
 */
function parseExcelFile(filePath) {
  try {
    // Read the workbook
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON (array of arrays for easier column access)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (data.length < 2) {
      throw new Error('Excel file must contain at least a header row and one respondent');
    }

    // Skip header row, process data rows
    const dataRows = data.slice(1);

    // Validate we have respondents
    if (dataRows.length === 0) {
      throw new Error('No respondent data found in Excel file');
    }

    // Parse respondents
    const respondents = [];
    const questionResponses = Array.from({ length: 82 }, () => []);

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];

      // IMPORTANT: Column D (index 3) contains email addresses - we explicitly DO NOT read or store them
      // Extract respondent name from column E (index 4) only
      const name = row[4] ? String(row[4]).trim() : `Respondent ${rowIndex + 1}`;

      // Extract scores from columns 9-90 (82 scoreable questions)
      const scores = [];
      let validScoreCount = 0;

      for (let colIndex = 9; colIndex <= 90; colIndex++) {
        const questionIndex = colIndex - 9; // Map to 0-81
        const response = row[colIndex];
        const score = textToScore(response);

        if (score !== null) {
          scores.push(score);
          questionResponses[questionIndex].push(score);
          validScoreCount++;
        } else {
          // If invalid response, use null but warn
          scores.push(null);
          console.warn(`Invalid response at row ${rowIndex + 2}, column ${colIndex + 1}: "${response}"`);
        }
      }

      // Only include respondent if they have at least some valid scores
      if (validScoreCount > 0) {
        respondents.push({
          name,
          scores
        });
      } else {
        console.warn(`Skipping respondent "${name}" - no valid scores found`);
      }
    }

    // Build questions array with metadata and all responses
    const questions = questionMapping.map((q, index) => ({
      index,
      driver: q.driver,
      skill: q.skill,
      text: q.text,
      responses: questionResponses[index]
    }));

    // Validate we have data
    if (respondents.length === 0) {
      throw new Error('No valid respondents found with scoreable responses');
    }

    return {
      respondents,
      questions
    };

  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Could not read the Excel file. Please ensure it\'s a valid .xlsx file.');
    }
    throw error;
  }
}

module.exports = {
  parseExcelFile,
  textToScore, // Export for testing
  normalizeResponse // Export for testing
};

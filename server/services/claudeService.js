/**
 * Claude AI Service
 *
 * Integrates with Anthropic Claude API to generate interpretive insights
 * for Strategic Maturity Assessment data.
 */

const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Formats date in spec format: "16-Jan-26"
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

/**
 * Builds the prompt for Claude with pre-calculated data
 * @param {string} teamName - Name of the team
 * @param {number} respondentCount - Number of respondents
 * @param {Object} calculatedData - Pre-calculated statistics from calculator service
 * @param {string} specialInstructions - Optional special analysis instructions
 * @returns {string} Complete prompt for Claude
 */
function buildPrompt(teamName, respondentCount, calculatedData, specialInstructions = '') {
  const date = formatDate();

  // Prepare respondent summaries for Claude
  const respondentSummaries = calculatedData.respondents.map(r => ({
    name: r.name,
    overallAverage: r.overallAverage,
    highestDriver: r.highestDriver,
    lowestDriver: r.lowestDriver,
    outlierCount: r.outlierQuestions.length,
    topOutliers: r.outlierQuestions.slice(0, 3).map(o => ({
      question: o.question,
      respondentScore: o.respondentScore,
      teamAverage: o.teamAverage,
      difference: o.difference
    }))
  }));

  return `You are analyzing a Strategic Maturity Assessment for a business team.
Your role is to provide interpretive insights only. All calculations have been done for you.

## Team Information
- Team Name: ${teamName}
- Number of Respondents: ${respondentCount}
- Assessment Date: ${date}

## Pre-Calculated Driver Scores
${JSON.stringify(calculatedData.driverScores, null, 2)}

## Key Patterns
- Strongest Driver: ${calculatedData.strongestDriver.name} (${calculatedData.strongestDriver.score})
- Weakest Driver: ${calculatedData.weakestDriver.name} (${calculatedData.weakestDriver.score})
- Highest Scoring Question: "${calculatedData.highestQuestion.text}" (${calculatedData.highestQuestion.average})
- Lowest Scoring Question: "${calculatedData.lowestQuestion.text}" (${calculatedData.lowestQuestion.average})
- Most Aligned Question: "${calculatedData.mostAligned.text}" (std dev: ${calculatedData.mostAligned.stdDev})
- Most Disagreed Question: "${calculatedData.mostDisagreed.text}" (std dev: ${calculatedData.mostDisagreed.stdDev})

## Your Tasks

### 1. Executive Summary
Write a 2-4 sentence summary of this team's overall strategic maturity.
Be specific to the data. Mention the strongest and weakest areas and one notable insight.

### 2. AI-Generated Discussion Questions
Based on the specific patterns in this data, suggest 3 discussion questions that would help this team dig deeper.
These should be specific to what you see, not generic questions.

### 3. Team Member Analysis
For each respondent, provide:
- A 2-3 sentence insight about their unique perspective based on how their scores compare to the team
- One specific follow-up question that could be asked of this person

Respondent Data:
${JSON.stringify(respondentSummaries, null, 2)}

${specialInstructions ? `
### 4. Special Analysis
The user has requested additional analysis with these instructions:
"${specialInstructions}"

Provide a thoughtful, specific response addressing this request based on the assessment data.
` : ''}

## Response Format
Respond with valid JSON only, no markdown code blocks:
{
  "executiveSummary": "...",
  "discussionQuestions": ["...", "...", "..."],
  "teamMemberAnalysis": [
    {
      "name": "...",
      "insight": "...",
      "followUpQuestion": "..."
    }
  ]${specialInstructions ? ',\n  "specialAnalysis": "..."' : ''}
}`;
}

/**
 * Calls Claude API to generate insights
 * @param {string} teamName - Name of the team
 * @param {Object} calculatedData - Pre-calculated statistics
 * @param {string} specialInstructions - Optional special instructions
 * @returns {Promise<Object>} Parsed Claude response
 */
async function generateInsights(teamName, calculatedData, specialInstructions = '') {
  try {
    const respondentCount = calculatedData.respondents.length;
    const prompt = buildPrompt(teamName, respondentCount, calculatedData, specialInstructions);

    console.log('Calling Claude API for insights...');

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the text content from Claude's response
    const responseText = message.content[0].text;

    // Parse JSON response
    let insights;
    try {
      insights = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', responseText);
      throw new Error('Failed to process analysis. Please try again.');
    }

    // Validate response structure
    if (!insights.executiveSummary || !insights.discussionQuestions || !insights.teamMemberAnalysis) {
      throw new Error('Invalid response structure from Claude API');
    }

    console.log('✅ Claude insights generated successfully');

    return insights;

  } catch (error) {
    console.error('Claude API error:', error);

    // Provide user-friendly error messages
    if (error.status === 401) {
      throw new Error('Invalid Anthropic API key. Please check your configuration.');
    } else if (error.status === 429) {
      throw new Error('API rate limit exceeded. Please try again in a few moments.');
    } else if (error.message.includes('Failed to process')) {
      throw error; // Pass through our own error messages
    } else {
      throw new Error('Analysis failed. Please try again.');
    }
  }
}

module.exports = {
  generateInsights,
  formatDate, // Export for testing and PDF generation
  buildPrompt  // Export for testing
};

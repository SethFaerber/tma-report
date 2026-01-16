# Strategic Maturity Assessment Analyzer - Implementation Spec

## Project Overview

Build a Node.js + React web application that allows users to upload an Excel file from Microsoft Forms, enter team details, and receive a professionally formatted PDF analysis report powered by Claude Opus.

**This is a scrappy v1 meant to be built in an afternoon.**

---

## User Flow

1. User visits the web app URL
2. User sees a simple form with:
   - Drag/drop or file picker for Excel upload (.xlsx)
   - Text input for "Team Name" (required)
   - Text area for "Special Analysis Instructions" (optional)
   - Submit button
3. User submits the form
4. Loading state displays while processing (30-90 seconds)
5. PDF downloads automatically when ready

---

## Technical Stack

- **Frontend:** React (simple, no routing needed)
- **Backend:** Express.js
- **Excel Parsing:** xlsx library
- **AI:** Anthropic Claude API (claude-opus-4-20250514)
- **PDF Generation:** PDFKit
- **File Upload:** Multer

---

## File Structure

```
strategic-maturity-analyzer/
├── client/                    # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── server/                    # Express backend
│   ├── index.js              # Entry point
│   ├── routes/
│   │   └── analyze.js        # POST /api/analyze
│   ├── services/
│   │   ├── excelParser.js    # Excel → structured data
│   │   ├── calculator.js     # Stats calculations
│   │   ├── claudeService.js  # Claude API integration
│   │   └── pdfGenerator.js   # PDF creation
│   ├── config/
│   │   └── questionMapping.js # Driver/skill mapping
│   ├── assets/
│   │   └── ramsey-logo.png   # Logo for PDF header
│   └── package.json
├── .env                       # ANTHROPIC_API_KEY
├── .gitignore
└── README.md
```

---

## Data Processing Pipeline

### Step 1: Excel Parsing (excelParser.js)

**Input:** Excel file from MS Forms

**Excel Structure:**
- Column A: ID
- Column B: Start time
- Column C: Completion time
- Column D: Name (respondent name - PRESERVE THIS)
- Column E: Last modified time
- Columns F onwards: Question responses (text like "Strongly Agree", "Agree", etc.)

**The Excel file will always have 90 columns but variable rows (one per respondent).**

**Score Mapping:**
- "Strongly Agree" → 5
- "Agree" → 4
- "Neutral" → 3
- "Disagree" → 2
- "Strongly Disagree" → 1

**Output:** Structured data object with:
```javascript
{
  respondents: [
    {
      name: "John Smith",
      scores: [4, 5, 3, ...] // 82 scores (questions 4-85)
    }
  ],
  questions: [
    {
      index: 0,
      driver: "Purpose",
      skill: "Mission",
      text: "Our team's mission (purpose) is clear and understood by our team.",
      responses: [4, 5, 4, 4, 5, ...] // all respondent scores for this question
    }
  ]
}
```

### Step 2: Statistical Calculations (calculator.js)

**For each question, calculate:**
- `average`: Mean of all responses (2 decimal places)
- `stdDev`: Standard deviation (for alignment/difference sorting)
- `distribution`: Array of counts [count1s, count2s, count3s, count4s, count5s]

**For each driver, calculate:**
- `driverAverage`: Mean of all question averages in that driver

**For each respondent, calculate:**
- `overallAverage`: Their mean score across all questions
- `highestDriver`: Which driver they scored highest
- `lowestDriver`: Which driver they scored lowest
- `outlierQuestions`: Questions where they deviated significantly from team average

### Step 3: Claude Analysis (claudeService.js)

**Claude handles interpretation only, not calculations.**

Send Claude the pre-calculated data and ask for:
1. Executive summary paragraph (2-4 sentences)
2. 3 AI-generated discussion questions specific to this data
3. Team member analysis (one insight + one follow-up question per respondent)
4. Response to special analysis instructions (if provided)

**Response format: JSON**

### Step 4: PDF Generation (pdfGenerator.js)

Assemble final PDF using PDFKit (see PDF structure below).

---

## Question-to-Driver Mapping

Create this mapping in `config/questionMapping.js`:

```javascript
const questionMapping = [
  // Purpose (Questions 4-12 in Excel, index 0-8 in our array)
  { driver: "Purpose", skill: "Mission", text: "Our team's mission (purpose) is clear and understood by our team." },
  { driver: "Purpose", skill: "Mission", text: "Our team's mission (purpose) is central to everything we do." },
  { driver: "Purpose", skill: "Mission", text: "Our team's mission (purpose) is attracting new team members." },
  { driver: "Purpose", skill: "Values", text: "Our teams know and understand our values." },
  { driver: "Purpose", skill: "Values", text: "Our teams demonstrate and live by our values." },
  { driver: "Purpose", skill: "Values", text: "Our values are creating a culture that attracts new team members." },
  { driver: "Purpose", skill: "Vision", text: "Our vision for the future is clear and documented." },
  { driver: "Purpose", skill: "Vision", text: "Our teams can clearly articulate our vision." },
  { driver: "Purpose", skill: "Vision", text: "We're using our vision as a filter for making strategic decisions." },
  
  // People (Questions 13-36, index 9-32)
  { driver: "People", skill: "Critical Thinking", text: "Our team members are able to quickly identify and evaluate problems in our business." },
  { driver: "People", skill: "Delegation", text: "Our leaders are skilled at delegating key responsibilities to trustworthy team members." },
  { driver: "People", skill: "Delegation", text: "Effective delegation is enabling our team to move faster." },
  { driver: "People", skill: "Role Clarity", text: "Our team members are clear about their role, responsibilities and accountabilities." },
  { driver: "People", skill: "Role Clarity", text: "Clear roles are enabling our team to collaborate effectively to produce business results." },
  { driver: "People", skill: "Leadership Development", text: "Our leaders are actively spending focused time developing new leaders." },
  { driver: "People", skill: "Leadership Development", text: "New leaders are being promoted to key roles in the organization." },
  { driver: "People", skill: "People Development", text: "Our leaders are actively coaching their team members on a weekly basis." },
  { driver: "People", skill: "People Development", text: "Our team members are growing in hard and soft skills." },
  { driver: "People", skill: "People Development", text: "Our team members are experiencing personal and professional transformation." },
  { driver: "People", skill: "Communication", text: "Communication in our organization is frequent and clear." },
  { driver: "People", skill: "Communication", text: "Healthy communication is resulting in unified collaboration across teams." },
  { driver: "People", skill: "Team Health", text: "Our team members have strong, trusting relationships with each other." },
  { driver: "People", skill: "Team Health", text: "Our team members regularly engage in healthy conflict." },
  { driver: "People", skill: "Team Health", text: "Our team members actively hold each other accountable to commitments." },
  { driver: "People", skill: "Team Health", text: "Our teams are achieving strong results." },
  { driver: "People", skill: "Culture", text: "We have intentionally created a culture we're proud of." },
  { driver: "People", skill: "Culture", text: "Our culture is strengthening our brand and creating a strong reputation." },
  { driver: "People", skill: "Culture", text: "Our culture and reputation are attracting new team members." },
  
  // Plan (Questions 37-56, index 33-52)
  { driver: "Plan", skill: "Time Management", text: "We manage our time intentionally to protect focus." },
  { driver: "Plan", skill: "Time Management", text: "We are leveraging time and margin to drive our business forward." },
  { driver: "Plan", skill: "Critical Thinking", text: "We are solving problems in a way that is creating opportunities in our business." },
  { driver: "Plan", skill: "Problem-Solving", text: "We are good at solving problems together as a team." },
  { driver: "Plan", skill: "Problem-Solving", text: "We're solving the right problems in the right ways, causing our business to improve." },
  { driver: "Plan", skill: "Decision Making", text: "The pace and quality of our decision making is causing us to build momentum." },
  { driver: "Plan", skill: "Strategy", text: "Our strategy is clear, documented and understood by our teams." },
  { driver: "Plan", skill: "Strategy", text: "Our teams are effectively using our strategy as a filter for decision making." },
  { driver: "Plan", skill: "Strategy", text: "Our strategy is allowing us to better serve our customer in a way that our competition can't." },
  { driver: "Plan", skill: "Strategy", text: "Our strategy has caused us to be the top performer in our market (we are in a winning position)." },
  { driver: "Plan", skill: "Goal Setting", text: "Our goals are clear, and our teams understand them." },
  { driver: "Plan", skill: "Goal Setting", text: "We are regularly reporting progress to our goals." },
  { driver: "Plan", skill: "Goal Setting", text: "Our team is challenging themselves to set stretch goals." },
  { driver: "Plan", skill: "Goal Setting", text: "We are regularly achieving challenging goals." },
  { driver: "Plan", skill: "Team Structure", text: "Our team structure is intentionally designed and understood by our whole team." },
  { driver: "Plan", skill: "Team Structure", text: "Our team structure enables our team to be highly collaborative and effective." },
  { driver: "Plan", skill: "Team Structure", text: "Our team structure is designed to support our long-term strategy." },
  { driver: "Plan", skill: "Process", text: "Our processes are well designed and clearly documented." },
  { driver: "Plan", skill: "Process", text: "Our processes work to improve efficiency and effectiveness." },
  { driver: "Plan", skill: "Process", text: "Our processes support and create a great customer experience." },
  
  // Product (Questions 57-79, index 53-75)
  { driver: "Product", skill: "Thought Leadership", text: "The audience/customer base we've built is creating new customers." },
  { driver: "Product", skill: "Thought Leadership", text: "We are thought leaders in our industry/market." },
  { driver: "Product", skill: "Product Strategy", text: "We have a clear, and documented product strategy(s) that our entire team understands." },
  { driver: "Product", skill: "Product Strategy", text: "Our team is effectively innovating and improving each of our products." },
  { driver: "Product", skill: "Product Strategy", text: "Our products are so good we're outpacing the competition." },
  { driver: "Product", skill: "Customer Insights", text: "We listen to our customers and we're documenting their feedback and insights." },
  { driver: "Product", skill: "Customer Insights", text: "We are using insights from our customers to improve their experience." },
  { driver: "Product", skill: "Marketing & Sales", text: "Our marketing and sales efforts are building awareness of our brand." },
  { driver: "Product", skill: "Marketing & Sales", text: "We're converting potential customers to paying customers at an increasing pace." },
  { driver: "Product", skill: "Market Analysis", text: "Our knowledge of the market is enabling us to find new opportunities." },
  { driver: "Product", skill: "Market Analysis", text: "We're using our understanding of the market to shape our business strategy." },
  { driver: "Product", skill: "Target Market", text: "We have clearly defined the market(s) we want to compete in." },
  { driver: "Product", skill: "Target Market", text: "We are actively pursuing new business opportunities within our target market(s)" },
  { driver: "Product", skill: "Target Customer", text: "We have clearly defined our ideal target customer(s)" },
  { driver: "Product", skill: "Target Customer", text: "We know where and how to reach our target customer(s)." },
  { driver: "Product", skill: "Target Customer", text: "We are effectively connecting with our target customer(s)." },
  { driver: "Product", skill: "Target Customer", text: "We are finding new ways to serve our target customer(s)." },
  { driver: "Product", skill: "Customer Service", text: "Our team is proactively creating a great customer experience." },
  { driver: "Product", skill: "Customer Service", text: "Our business has become known for our customer service." },
  { driver: "Product", skill: "Innovation", text: "Our teams regularly devote real resources to research, experimentation and innovation." },
  { driver: "Product", skill: "Innovation", text: "Our innovations are resulting in the creation of new products/services that our customers love." },
  { driver: "Product", skill: "Technology", text: "We're intelligently using technology in our business to solve problems." },
  { driver: "Product", skill: "Technology", text: "Technology is accelerating the execution of our strategy." },
  
  // Profit (Questions 80-90, index 76-86)
  { driver: "Profit", skill: "Business Development", text: "We are leveraging strong relationships to expand into new markets." },
  { driver: "Profit", skill: "Business Development", text: "We are successfully acquiring new customers in new markets." },
  { driver: "Profit", skill: "Performance Management", text: "We have built key reports and scorecards." },
  { driver: "Profit", skill: "Performance Management", text: "We have healthy accountability for performance." },
  { driver: "Profit", skill: "Performance Management", text: "Our teams are hitting goals more often than ever." },
  { driver: "Profit", skill: "Profit Margin", text: "Our profit margin is steadily growing over time." },
  { driver: "Profit", skill: "Profit Investment", text: "We're investing our profits wisely." },
  { driver: "Profit", skill: "Forecasting", text: "We're carefully forecasting our revenue into the future." },
  { driver: "Profit", skill: "Forecasting", text: "Our forecasts are enabling us to catch potential problems faster" },
  { driver: "Profit", skill: "Expense Management", text: "We carefully and proactively manage our expenses." },
  { driver: "Profit", skill: "Revenue Growth", text: "Our top-line revenue is steadily growing over time." }
];

module.exports = questionMapping;
```

**Note:** The Excel has 90 columns. Columns 1-5 are metadata (ID, Start time, Completion time, Name, Last modified). Columns 6-90 are the 85 questions. However, questions 1-3 are open-ended/metadata, so we only score questions 4-85 (82 scoreable questions starting at column index 8 / column I in Excel).

---

## PDF Document Structure

### Page 1: Cover Page
- "Strategic Maturity Assessment - Results" (large title, centered)
- Ramsey logo (centered, ~200px wide)
- Team name (centered)
- Date in format "21-Apr-25" (centered)

### Page 2: Team Summary
**Header:** "Your Team's Strategic Level"

**Content:**
- Team name (bold)
- AI-generated executive summary paragraph

**Driver Scores Table:**

| Competency | Score | Note |
|------------|-------|------|
| Purpose | 3.69 | Your strongest driver |
| People | 3.63 | |
| Plan | 3.23 | |
| Product | 3.09 | Your weakest driver |
| Profit | 3.36 | |

- Scores shown to 2 decimal places
- "Your strongest driver" annotation on highest
- "Your weakest driver" annotation on lowest

### Pages 3-4: Areas of Alignment
**Header:** "Areas of Alignment"

**Description:** "This chart shows where your team was the most aligned on your relative level of maturity."

**Table:** All 82 questions sorted by **lowest standard deviation first** (most agreement)

| Driver | Skill & Competency | 1 | 2 | 3 | 4 | 5 |
|--------|-------------------|---|---|---|---|---|
| Purpose | Mission: Our team's mission (purpose) is clear... | 0 | 0 | 0 | 11 | 2 |

- The 1-5 columns show COUNT of respondents who chose that score
- Group rows visually by driver (add driver name in first column, leave blank for subsequent rows in same driver)

### Pages 5-6: Areas of Key Difference
**Header:** "Areas of Key Difference"

**Description:** "This chart shows where your team was the least aligned on where your business currently stands."

**Table:** All 82 questions sorted by **highest standard deviation first** (most disagreement)

Same format as Alignment table.

### Pages 7-8: Highest Scores
**Header:** "Highest Scores"

**Description:** "This chart shows your team's biggest strengths."

**Table:** All 82 questions sorted by **highest average first**

| Driver | Skill & Competency | Average |
|--------|-------------------|---------|
| People | Critical Thinking: Our team regularly works to identify... | 4.46 |

### Pages 9-10: Lowest Scores
**Header:** "Lowest Scores"

**Description:** "This chart shows your team's biggest weaknesses."

**Table:** All 82 questions sorted by **lowest average first**

Same format as Highest Scores table.

### Page 11: Discussion Questions
**Header:** "Group Discussion Questions"

**Description:** "Discuss these with your team to decide what to do next."

**Fixed Questions:**
1. Do these results accurately describe our current state?
2. What is causing our key areas of difference?
3. Which competencies, if focused on, would create the most value for our team/business?
4. What can we do in the near term (weeks/months) to level up in those areas?

**AI-Generated Questions:**
5. [AI question 1]
6. [AI question 2]
7. [AI question 3]

### Page 12+: Team Member Analysis
**Header:** "Team Member Analysis"

For each respondent:
- **Name** (bold, larger font)
- Insight paragraph (2-3 sentences from Claude about their perspective)
- *Follow-up question:* [Suggested question for Mark to ask this person]

Add page breaks as needed to keep each person's section together.

### Final Page (if applicable): Special Analysis
**Only include if user provided special analysis instructions**

**Header:** "Additional Analysis"

**Content:** Claude's response to the custom instructions

---

## Claude Prompt Template

```javascript
const buildPrompt = (teamName, respondentCount, date, calculatedData, respondentSummaries, specialInstructions) => `
You are analyzing a Strategic Maturity Assessment for a business team.
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
}
`;
```

---

## API Endpoint

### POST /api/analyze

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `file`: Excel file (.xlsx) - required
  - `teamName`: string - required
  - `specialInstructions`: string - optional

**Response:**
- Success: Content-Type: application/pdf, PDF file stream
- Error: JSON with error message

**Timeout:** Set to 120 seconds (Claude + PDF generation can take time)

---

## Frontend Component

Simple single-page React app:

```jsx
// Pseudo-code structure
function App() {
  const [file, setFile] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Validate inputs
    // Create FormData
    // POST to /api/analyze
    // Handle blob response as PDF download
  };

  return (
    <div>
      <h1>Strategic Maturity Assessment Analyzer</h1>
      
      {/* File upload with drag/drop */}
      
      {/* Team name input */}
      
      {/* Special instructions textarea */}
      
      {/* Submit button */}
      
      {/* Loading spinner with message */}
      
      {/* Error display */}
    </div>
  );
}
```

**Loading state message:** "Analyzing your assessment... This typically takes 30-60 seconds."

---

## Dependencies

### server/package.json
```json
{
  "name": "strategic-maturity-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "xlsx": "^0.18.5",
    "@anthropic-ai/sdk": "^0.24.0",
    "pdfkit": "^0.14.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### client/package.json
```json
{
  "name": "strategic-maturity-client",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "proxy": "http://localhost:3001"
}
```

---

## Environment Variables (.env)

```
ANTHROPIC_API_KEY=your-api-key-here
PORT=3001
```

---

## Error Handling

| Scenario | HTTP Status | User Message |
|----------|-------------|--------------|
| No file uploaded | 400 | "Please upload an Excel file" |
| Invalid file type | 400 | "Please upload a valid .xlsx file" |
| Missing team name | 400 | "Please enter a team name" |
| Excel parsing error | 400 | "Could not read the Excel file. Please ensure it's a valid MS Forms export." |
| Claude API error | 500 | "Analysis failed. Please try again." |
| Claude response parse error | 500 | "Failed to process analysis. Please try again." |
| PDF generation error | 500 | "Failed to generate report. Please try again." |

---

## Implementation Order

1. Initialize project structure with both client and server folders
2. Set up Express server with CORS and multer for file uploads
3. Create questionMapping.js with all 82 questions mapped to drivers/skills
4. Build excelParser.js - parse xlsx, extract respondent names, map text responses to scores
5. Build calculator.js - compute averages, std devs, distributions, driver scores
6. Build claudeService.js - construct prompt, call API, parse JSON response
7. Build pdfGenerator.js - create all PDF pages with proper formatting
8. Wire up the /api/analyze route to orchestrate the pipeline
9. Build React frontend with file upload, form inputs, loading state
10. Test end-to-end with sample Excel file
11. Add error handling and polish

---

## Assets Required

Place these in server/assets/:
- `ramsey-logo.png` - Company logo for PDF cover page

---

## Notes for Claude Code

- Use async/await throughout
- The Excel file columns are 0-indexed, so column D (Name) is index 3, and questions start at index 5
- PDFKit requires manual page management - track Y position and add new pages when content would overflow
- For the distribution tables, use fixed column widths to keep alignment
- Claude API model: `claude-opus-4-20250514`
- Set a long timeout on the API route (120s) since Claude + PDF can take time
- The frontend should handle the response as a blob and trigger a download

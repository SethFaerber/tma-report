# Strategic Maturity Assessment Analyzer - Project Configuration

## Project Overview
This is a Node.js + React web application that processes Strategic Maturity Assessment data from Microsoft Forms Excel exports and generates professionally formatted PDF analysis reports using Claude Opus AI.

**Project Type**: Scrappy v1 - Built for speed, meant to be functional and maintainable but not over-engineered.

## Architecture

### Monorepo Structure
```
tma-report/
├── client/          # React frontend (Create React App)
├── server/          # Express backend
├── specs/           # Project specifications and documentation
├── .env             # Environment configuration (not committed)
└── .gitignore       # Git ignore rules
```

### Technology Stack
- **Frontend**: React 18 with Create React App (no routing needed - single page app)
- **Backend**: Express.js with Node 24
- **AI**: Anthropic Claude API (claude-opus-4-20250514)
- **Excel Processing**: xlsx library
- **PDF Generation**: PDFKit
- **File Uploads**: Multer

### Key Technical Decisions

1. **Monorepo Approach**: Client and server in same repo for simplicity. This is a single-purpose tool, not a complex multi-service platform.

2. **No Database**: All processing is stateless. Upload → Process → Download. No data persistence needed.

3. **Synchronous Processing**: User waits for the PDF (30-90 seconds). No job queue or background processing needed for v1.

4. **Direct File Upload**: Using Multer for direct file handling. No cloud storage needed.

5. **Client-Server Separation**: Clear boundary between React frontend and Express backend, communicating via REST API.

## Data Flow Pipeline

1. **Excel Upload** → Client sends multipart/form-data to `/api/analyze`
2. **Excel Parsing** → Extract respondent data and convert text responses to numeric scores
3. **Statistical Calculation** → Compute averages, standard deviations, distributions
4. **Claude Analysis** → Send pre-calculated data to Claude for interpretive insights
5. **PDF Generation** → Assemble comprehensive report with tables, charts, and AI insights
6. **Download** → Stream PDF back to client as blob download

## Development Guidelines

### Code Organization
- Keep business logic in `server/services/` - each service has a single, clear responsibility
- Routes in `server/routes/` should be thin - just validation and orchestration
- Client components should be simple - this is a single-page form, not a complex SPA
- Configuration data (like question mappings) goes in `server/config/`

### Error Handling
- Validate all user inputs at the API boundary
- Provide clear, user-friendly error messages
- Log detailed errors server-side for debugging
- Never expose internal errors or API keys to the client

### Testing Approach
- Focus on integration testing the full pipeline with real Excel files
- Unit test statistical calculations for accuracy
- Test error handling for malformed Excel files
- Verify PDF generation produces valid, readable documents

### Performance Considerations
- Claude API calls are the bottleneck (20-60 seconds)
- Keep the client informed with loading states
- Set appropriate timeouts (120s for API route)
- Stream PDF response to avoid memory issues with large files

## Environment Variables

Required in `.env`:
- `ANTHROPIC_API_KEY`: Your Anthropic API key for Claude access
- `PORT`: Server port (default: 3001)

## Common Development Tasks

### Running Locally
```bash
# Install dependencies
npm install
cd client && npm install
cd ../server && npm install

# Start development servers
npm run dev  # Runs both client and server concurrently
```

### Testing with Sample Data
Place test Excel files in `server/test-data/` (this folder is gitignored)

### Updating Question Mappings
Edit `server/config/questionMapping.js` - this maps Excel column questions to drivers and skills

### Modifying PDF Layout
Edit `server/services/pdfGenerator.js` - uses PDFKit for layout control

## Important Constraints

1. **Excel Format**: Must match Microsoft Forms export format (91 columns total, specific structure)
2. **Question Count**: Exactly 82 scoreable questions (columns 9-90 / J-CM in Excel)
3. **Score Mapping**: "Strongly Agree" → 5, "Agree" → 4, "Neutral" → 3, "Disagree" → 2, "Strongly Disagree" → 1 (case-insensitive, whitespace trimmed)
4. **Claude Model**: Must use claude-opus-4-20250514 for analysis
5. **PDF Structure**: Follow the detailed structure in the spec (cover page, driver scores, alignment tables, etc.)

## Implementation Details

### Phase 1: Backend Core (COMPLETED)

#### Excel Structure (Confirmed from Real Data)
The actual Microsoft Forms export has the following structure:
- **Column 0 (A)**: ID
- **Column 1 (B)**: Start time
- **Column 2 (C)**: Completion time
- **Column 3 (D)**: Email address
- **Column 4 (E)**: **Respondent name** ← Extract from here
- **Column 5 (F)**: Last modified time
- **Columns 6-8 (G-I)**: Three open-ended text questions (skip these)
- **Columns 9-90 (J-CM)**: 82 scoreable Likert scale questions ← Process these

**Key Discovery**: The original spec indicated column D (index 3) for name, but the actual export has email in column D and name in column E (index 4).

#### ExcelParser Service (`server/services/excelParser.js`)
- Uses `xlsx` library to read .xlsx files
- Extracts respondent names from column 4 (E)
- Processes columns 9-90 for the 82 scoreable questions
- Maps Likert scale text to numeric scores with lenient matching (case-insensitive, trimmed)
- Handles missing/invalid responses gracefully by using `null` and logging warnings
- Returns structured data: `{ respondents: [...], questions: [...] }`

**Testing Notes**:
- Tested with 13-respondent real data file
- All respondents had complete 82/82 valid responses
- Lenient text matching works well for variations in response formatting

#### Calculator Service (`server/services/calculator.js`)
- Calculates statistics for each question: `average`, `stdDev`, `distribution` (count of 1-5 responses)
- Computes driver averages by aggregating question averages within each driver
- Generates respondent summaries:
  - Overall average across all questions
  - Highest and lowest scoring drivers per respondent
  - Outlier questions (where respondent differs from team by ≥1.5 points)
- Provides sorted arrays for PDF sections:
  - `sortedByAlignment`: Questions sorted by std dev (low to high) - most agreement first
  - `sortedByDifference`: Questions sorted by std dev (high to low) - most disagreement first
  - `sortedByHighestScore`: Questions by average (high to low) - strengths
  - `sortedByLowestScore`: Questions by average (low to high) - weaknesses

**Mathematical Approach**:
- Standard deviation uses population formula (not sample)
- Averages rounded to 2 decimal places for display
- Null responses excluded from calculations but tracked

#### Question Mapping (`server/config/questionMapping.js`)
- Array of 82 question objects with driver, skill, and text
- Maps directly to Excel columns 9-90 (J-CM)
- Drivers: Purpose (9 questions), People (24 questions), Plan (20 questions), Product (23 questions), Profit (11 questions)
- **Note**: Profit has 11 questions (not 10 as initially assumed)
- Includes validation warning if question count ≠ 82

## Future Enhancements (Not for v1)
- Batch processing multiple files
- Saving/retrieving past reports
- Email delivery of PDFs
- Customizable PDF templates
- Team comparison reports
- Historical trend analysis

## Questions or Issues?
Refer to the detailed spec in `specs/strategic-maturity-analyzer-spec.md` for complete implementation details.

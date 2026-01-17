# Strategic Maturity Assessment Analyzer - Project Configuration

## Project Overview
This is a Node.js + React web application that processes Strategic Maturity Assessment data from Microsoft Forms Excel exports and generates professionally formatted PDF analysis reports using Claude Opus AI.

**Project Type**: Scrappy v1 - Built for speed, meant to be functional and maintainable but not over-engineered.

## Security & Privacy Guidelines

### CRITICAL: Environment Variables & Secrets
**NEVER read, inspect, or reference the contents of `.env` files or any files containing API keys, secrets, or credentials.**

This includes:
- `.env` (or any `.env.*` files)
- Any files containing API keys, tokens, or passwords
- Configuration files with sensitive credentials

**Rationale**:
- Protects API keys and secrets from accidental exposure
- Prevents credential leakage in logs, outputs, or conversation history
- Maintains security best practices

**If configuration assistance is needed**: Provide format examples or templates without actual values. Users will configure their own credentials independently.

**Example of acceptable guidance**:
```
# .env format (user fills in their own values)
ANTHROPIC_API_KEY=your_key_here
PORT=3001
```

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

### Phase 2: AI & PDF Generation (COMPLETED)

#### Claude AI Service (`server/services/claudeService.js`)
- Integrates with Anthropic Claude API (model: `claude-opus-4-20250514`)
- Generates interpretive insights based on pre-calculated statistics
- **Does NOT perform calculations** - only interprets data provided by calculator service
- Output format: JSON with structured insights

**Claude Analysis Includes**:
1. **Executive Summary**: 2-4 sentence overview of team's strategic maturity
2. **Discussion Questions**: 3 AI-generated questions specific to the data patterns
3. **Team Member Analysis**: Individual insights and follow-up questions for each respondent
4. **Special Analysis** (optional): Response to user-provided custom instructions

**Date Format**: Uses spec-compliant format "16-Jan-26" (day-month-year with 3-letter month)

**Error Handling**:
- 401: Invalid API key - user-friendly message
- 429: Rate limit - retry message
- JSON parsing errors: Graceful fallback with error message
- All errors logged server-side, user sees clean messages

**Testing Notes**:
- Successfully tested with 13-respondent dataset
- API response time: 20-40 seconds (typical for Claude Opus)
- JSON parsing reliable with proper prompt structure

#### PDF Generator Service (`server/services/pdfGenerator.js`)
- Uses PDFKit to create multi-page professionally formatted reports
- Page size: US Letter (612 x 792 points)
- Margins: 50 points on all sides
- Manual Y-position tracking with automatic page breaks

**PDF Structure** (12+ pages):
1. **Cover Page**: Title, logo, team name, date
2. **Team Summary**: Executive summary + driver scores table with annotations
3. **Areas of Alignment** (2 pages): Questions sorted by lowest std dev (most agreement) with distribution tables
4. **Areas of Key Difference** (2 pages): Questions sorted by highest std dev (most disagreement)
5. **Highest Scores** (2 pages): Team's biggest strengths
6. **Lowest Scores** (2 pages): Team's biggest weaknesses
7. **Discussion Questions**: 4 fixed + 3 AI-generated questions
8. **Team Member Analysis** (variable pages): Individual profiles with insights and follow-up questions
9. **Additional Analysis** (optional): Response to special instructions

**Layout Details**:
- Distribution tables: 7 columns (Driver, Skill & Competency, 1, 2, 3, 4, 5)
- Average tables: 3 columns (Driver, Skill & Competency, Average)
- Font: Helvetica (standard, bold, oblique variants)
- Colors: Black text, blue accents for annotations, gray lines
- Text truncation: Long questions abbreviated with "..." to fit columns
- Driver grouping: Driver name shown only for first question in each group

**Page Break Logic**:
- Tracks Y position throughout document
- Adds new page when Y > 692 (PAGE_HEIGHT - 100)
- Ensures team member sections stay together

**Testing Notes**:
- Successfully generated 17-page PDF for 13-respondent dataset
- All sections render correctly with proper formatting
- Logo displays correctly (200px width, centered)
- Page breaks prevent content overflow

#### Privacy & PII Protection
**CRITICAL**: Email addresses are intentionally **NOT** read, parsed, stored, or included in any output.

- Excel column D (index 3) contains email addresses - explicitly ignored
- Only respondent names (column E, index 4) are extracted
- `inspect-excel.js` utility redacts email addresses in output
- Test outputs contain names only, no email addresses
- All code includes explicit comments about email column being skipped

**Rationale**: Protect PII, minimize data exposure, comply with privacy best practices

### Phase 3: API Integration (IN PROGRESS)
**Goal**: Build Express API route to orchestrate the full pipeline

**Tasks**:
- Create `server/routes/analyze.js` with POST `/api/analyze` endpoint
- Integrate Multer for multipart/form-data file uploads
- Orchestrate pipeline: Excel → Parse → Calculate → Claude → PDF
- Implement comprehensive error handling middleware
- Mount route in `server/index.js`
- Set 120-second timeout for Claude API processing

**API Endpoint Specification**:
```
POST /api/analyze
Content-Type: multipart/form-data

Request Body:
- file: Excel file (.xlsx)
- teamName: string
- specialInstructions: string (optional)

Response:
- Success (200): PDF file stream (application/pdf)
- Error (400/500): JSON error message
```

### Phase 4: React Frontend (PENDING)
**Goal**: Build single-page React UI for file upload and PDF download

**Tasks**:
- Create file upload form component
- Add team name input field (required)
- Add special instructions textarea (optional)
- Implement loading states with progress indication (30-60s wait)
- Handle PDF blob download
- Display user-friendly error messages
- Add file type validation (.xlsx only)

**Key UX Considerations**:
- Clear loading indicator during Claude API processing
- Disable form during processing
- Provide estimated time remaining (30-60 seconds)
- Show success message with download link

### Phase 5: Deployment (PRIORITY)
**Goal**: Get working product deployed to production for Mark to use

**Priority Rationale**: Better to ship a functional product with imperfect PDF formatting than to delay deployment for aesthetic refinements. Mark needs this tool working end-to-end.

**Tasks**:
- Configure deployment environment (TBD: platform choice)
- Set environment variables securely
- Deploy backend and frontend
- Test end-to-end with real Excel files
- Document deployment URL and usage instructions

### Phase 6: PDF Refinement (POST-DEPLOYMENT)
**Goal**: Optimize PDF layout, spacing, and visual presentation

**Note**: This phase happens AFTER deployment. The current PDF is functional and readable, but can be improved aesthetically.

**Potential Refinements**:
- Fine-tune table column widths for better text display
- Optimize font sizes and line spacing
- Improve page break logic for cleaner section boundaries
- Enhance color scheme and visual hierarchy
- Add more sophisticated chart/graph elements
- Optimize text truncation strategies

**Testing Approach**: Work with Mark's feedback on real-world usage to identify specific areas needing improvement.

## Known Issues & Workarounds

### Excel Filename Handling
**Problem**: Microsoft Forms exports Excel files with complex filenames containing spaces, commas, parentheses, and dates (e.g., "Strategic Maturity Assessment - Trusted Exec Team, February 2025(1-13).xlsx"). These filenames cause issues in shell environments and some file path operations.

**Root Cause**: Shell parsing struggles with unescaped special characters in filenames, even when quoted.

**Solution for Production**:
1. **Multer handles this automatically**: When using Multer for file uploads in the API route, it receives the file as a buffer/stream and saves it with a sanitized temporary name. No shell operations involved.
2. **For testing scripts**: Use glob patterns or simple filenames without special characters
3. **Best practice**: When saving uploaded files, sanitize filenames to remove or replace special characters:
   ```javascript
   const sanitizedName = originalName
     .replace(/[()]/g, '')  // Remove parentheses
     .replace(/[,]/g, '-')  // Replace commas with dashes
     .replace(/\s+/g, '_'); // Replace spaces with underscores
   ```

**Testing Workaround**: Copy test files to simpler names:
```bash
cd server/test-data
cp *.xlsx ../sample-test.xlsx
cd ..
node test-full-pipeline.js sample-test.xlsx "Team Name"
```

**Important**: The production API using Multer will NOT have this issue, as it handles binary file uploads directly without shell operations. This only affects command-line testing scripts.

## Future Enhancements (Not for v1)
- Batch processing multiple files
- Saving/retrieving past reports
- Email delivery of PDFs
- Customizable PDF templates
- Team comparison reports
- Historical trend analysis

## Questions or Issues?
Refer to the detailed spec in `specs/strategic-maturity-analyzer-spec.md` for complete implementation details.

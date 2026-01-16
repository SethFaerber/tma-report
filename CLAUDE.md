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

1. **Excel Format**: Must match Microsoft Forms export format (90 columns, specific structure)
2. **Question Count**: Exactly 82 scoreable questions (questions 4-85 in Excel)
3. **Score Mapping**: "Strongly Agree" → 5, "Agree" → 4, "Neutral" → 3, "Disagree" → 2, "Strongly Disagree" → 1
4. **Claude Model**: Must use claude-opus-4-20250514 for analysis
5. **PDF Structure**: Follow the detailed structure in the spec (cover page, driver scores, alignment tables, etc.)

## Future Enhancements (Not for v1)
- Batch processing multiple files
- Saving/retrieving past reports
- Email delivery of PDFs
- Customizable PDF templates
- Team comparison reports
- Historical trend analysis

## Questions or Issues?
Refer to the detailed spec in `specs/strategic-maturity-analyzer-spec.md` for complete implementation details.

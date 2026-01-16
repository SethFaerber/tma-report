# Strategic Maturity Assessment Analyzer

A web application that analyzes Strategic Maturity Assessment data from Microsoft Forms and generates comprehensive PDF reports powered by Claude AI.

## Overview

This tool allows teams to upload Excel files exported from Microsoft Forms assessments, input team details, and receive professionally formatted PDF analysis reports. The application uses Claude Opus to provide interpretive insights on team strategic maturity across five key drivers: Purpose, People, Plan, Product, and Profit.

## Features

- Upload Excel files from Microsoft Forms Strategic Maturity Assessments
- Automated statistical analysis of 82 assessment questions
- AI-powered insights and discussion questions via Claude Opus
- Individual team member analysis with follow-up questions
- Professionally formatted PDF reports with comprehensive data visualizations
- Simple, single-page interface with drag-and-drop file upload

## Quick Start

### Prerequisites

- Node.js 24.x or higher
- npm (comes with Node.js)
- Anthropic API key for Claude access

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd tma-report
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
# Copy the .env template and add your API key
# Edit .env and replace 'your-api-key-here' with your actual Anthropic API key
```

4. Start the development servers
```bash
npm run dev
```

This will start:
- React frontend on `http://localhost:3000`
- Express backend on `http://localhost:3001`

## Architecture

### Project Structure

```
tma-report/
├── client/                    # React frontend
│   ├── public/               # Static assets
│   ├── src/                  # React components
│   └── package.json          # Client dependencies
├── server/                    # Express backend
│   ├── routes/               # API endpoints
│   ├── services/             # Business logic
│   │   ├── excelParser.js   # Excel processing
│   │   ├── calculator.js    # Statistical calculations
│   │   ├── claudeService.js # Claude AI integration
│   │   └── pdfGenerator.js  # PDF creation
│   ├── config/               # Configuration files
│   │   └── questionMapping.js # Assessment question definitions
│   ├── assets/               # Static assets (logos, etc.)
│   └── package.json          # Server dependencies
├── specs/                     # Project specifications
└── .env                       # Environment configuration
```

### Technology Stack

**Frontend:**
- React 18
- Create React App
- Axios for HTTP requests

**Backend:**
- Node.js 24
- Express.js
- Multer (file uploads)
- xlsx (Excel parsing)
- PDFKit (PDF generation)
- Anthropic Claude SDK

### Data Processing Pipeline

1. **Upload**: User uploads Excel file with team name and optional instructions
2. **Parse**: Extract respondent data and convert text responses to numeric scores (1-5)
3. **Calculate**: Compute averages, standard deviations, and distributions for all questions and drivers
4. **Analyze**: Send pre-calculated data to Claude Opus for interpretive insights
5. **Generate**: Create comprehensive PDF report with tables, charts, and AI analysis
6. **Download**: Return PDF to user (typically 30-90 seconds total)

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Required: Your Anthropic API key
ANTHROPIC_API_KEY=your-api-key-here

# Optional: Server port (defaults to 3001)
PORT=3001
```

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

## Usage

1. Visit `http://localhost:3000` in your browser
2. Upload an Excel file exported from Microsoft Forms (must match expected format)
3. Enter the team name (required)
4. Optionally add special analysis instructions
5. Click Submit and wait for processing (30-90 seconds)
6. PDF report will download automatically when ready

## Excel File Format

The application expects Excel files exported from Microsoft Forms with the following structure:
- Column A: ID
- Column B: Start time
- Column C: Completion time
- Column D: Respondent name
- Column E: Last modified time
- Columns F-BN (6-90): Assessment question responses

Responses should be in Likert scale format:
- "Strongly Agree" → 5
- "Agree" → 4
- "Neutral" → 3
- "Disagree" → 2
- "Strongly Disagree" → 1

## Development

### Available Scripts

```bash
npm run dev         # Run both client and server in development mode
npm run client      # Run only the React frontend
npm run server      # Run only the Express backend
npm run build       # Build the React app for production
```

### Testing

Place test Excel files in `server/test-data/` for development testing (this directory is gitignored).

## API Endpoints

### POST /api/analyze

Processes an uploaded Excel file and returns a PDF report.

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `file`: Excel file (.xlsx) - required
  - `teamName`: string - required
  - `specialInstructions`: string - optional

**Response:**
- Success: Content-Type: application/pdf
- Error: JSON with error message

**Timeout:** 120 seconds

## Error Handling

The application provides clear error messages for common issues:
- Missing or invalid file uploads
- Malformed Excel files
- Missing required fields
- API failures
- PDF generation errors

## Contributing

This is a v1 implementation focused on core functionality. See `specs/strategic-maturity-analyzer-spec.md` for detailed implementation specifications.

## License

Internal use only

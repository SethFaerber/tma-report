#!/bin/bash

# Test script for /api/analyze endpoint
# Usage: ./test-api.sh

API_URL="http://localhost:3001/api/analyze"
EXCEL_FILE="sample-test.xlsx"
TEAM_NAME="Test Team"
OUTPUT_FILE="test-api-output.pdf"

echo "🚀 Testing /api/analyze endpoint"
echo "================================"
echo ""
echo "API URL: $API_URL"
echo "Excel File: $EXCEL_FILE"
echo "Team Name: $TEAM_NAME"
echo ""

if [ ! -f "$EXCEL_FILE" ]; then
  echo "❌ Error: Excel file '$EXCEL_FILE' not found"
  echo "Please ensure the sample Excel file exists in the current directory"
  exit 1
fi

echo "📤 Sending request to API..."
echo "⏱️  This may take 30-60 seconds (waiting for Claude API)..."
echo ""

# Make the API request
curl -X POST "$API_URL" \
  -F "file=@$EXCEL_FILE" \
  -F "teamName=$TEAM_NAME" \
  -o "$OUTPUT_FILE" \
  -w "\nHTTP Status: %{http_code}\n" \
  --progress-bar

echo ""

# Check if the output file was created and is a valid PDF
if [ -f "$OUTPUT_FILE" ]; then
  FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)

  if [ "$FILE_SIZE" -gt 1000 ]; then
    echo "✅ Success! PDF generated successfully"
    echo "📁 Output file: $OUTPUT_FILE"
    echo "📏 File size: $FILE_SIZE bytes"
    echo ""
    echo "✨ Open the PDF to review the report!"
  else
    echo "⚠️  Warning: Output file is very small ($FILE_SIZE bytes)"
    echo "This might indicate an error response"
    echo "Contents:"
    cat "$OUTPUT_FILE"
  fi
else
  echo "❌ Error: Output file was not created"
  echo "The API request may have failed"
fi

echo ""

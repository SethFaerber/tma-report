/**
 * Full Pipeline Test
 *
 * Tests the complete pipeline: Excel → Parsing → Calculation → Claude → PDF
 *
 * Usage: node test-full-pipeline.js <excel-file> <team-name> [special-instructions]
 */

require('dotenv').config({ path: '../.env' });
const path = require('path');
const { parseExcelFile } = require('./services/excelParser');
const { calculateAll } = require('./services/calculator');
const { generateInsights } = require('./services/claudeService');
const { generatePDF } = require('./services/pdfGenerator');

// Get command line arguments
const excelFile = process.argv[2];
const teamName = process.argv[3];
const specialInstructions = process.argv[4] || '';

if (!excelFile || !teamName) {
  console.error('Usage: node test-full-pipeline.js <excel-file> <team-name> [special-instructions]');
  console.error('Example: node test-full-pipeline.js ./test-data/sample.xlsx "Executive Team"');
  process.exit(1);
}

// Check API key
if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-api-key-here') {
  console.error('❌ Error: ANTHROPIC_API_KEY not set in .env file');
  console.error('Please add your Anthropic API key to the .env file');
  process.exit(1);
}

console.log('🚀 Testing Full Pipeline: Excel → Parse → Calculate → Claude → PDF\n');
console.log('='.repeat(70));

async function runFullPipeline() {
  try {
    // Step 1: Parse Excel
    console.log('\n📊 Step 1: Parsing Excel file...');
    console.log(`File: ${excelFile}`);
    const parsedData = parseExcelFile(excelFile);
    console.log(`✅ Parsed ${parsedData.respondents.length} respondents, ${parsedData.questions.length} questions`);

    // Step 2: Calculate statistics
    console.log('\n📈 Step 2: Calculating statistics...');
    const calculatedData = calculateAll(parsedData);
    console.log(`✅ Calculated driver scores:`);
    Object.entries(calculatedData.driverScores).forEach(([driver, score]) => {
      console.log(`   ${driver}: ${score}`);
    });

    // Step 3: Generate Claude insights
    console.log('\n🤖 Step 3: Calling Claude API for insights...');
    console.log('   This may take 30-60 seconds...');
    const claudeInsights = await generateInsights(teamName, calculatedData, specialInstructions);

    console.log('✅ Claude insights received:');
    console.log(`   Executive Summary: "${claudeInsights.executiveSummary.substring(0, 100)}..."`);
    console.log(`   Discussion Questions: ${claudeInsights.discussionQuestions.length} generated`);
    console.log(`   Team Member Analysis: ${claudeInsights.teamMemberAnalysis.length} profiles`);
    if (claudeInsights.specialAnalysis) {
      console.log(`   Special Analysis: Included`);
    }

    // Step 4: Generate PDF
    console.log('\n📄 Step 4: Generating PDF report...');
    const outputPath = path.join(__dirname, 'test-output', 'test-report.pdf');
    await generatePDF(teamName, calculatedData, claudeInsights, outputPath);
    console.log(`✅ PDF saved to: ${outputPath}`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ Full pipeline test completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Respondents analyzed: ${parsedData.respondents.length}`);
    console.log(`   - Questions processed: ${parsedData.questions.length}`);
    console.log(`   - Strongest driver: ${calculatedData.strongestDriver.name} (${calculatedData.strongestDriver.score})`);
    console.log(`   - Weakest driver: ${calculatedData.weakestDriver.name} (${calculatedData.weakestDriver.score})`);
    console.log(`   - PDF pages: ~${12 + Math.ceil(parsedData.respondents.length / 3)}`);
    console.log(`\n✨ Open ${outputPath} to review the report!\n`);

  } catch (error) {
    console.error('\n❌ Pipeline test failed:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
runFullPipeline();

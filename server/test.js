/**
 * Test script for excelParser and calculator services
 *
 * Usage: node test.js <path-to-excel-file>
 */

const path = require('path');
const { parseExcelFile } = require('./services/excelParser');
const { calculateAll } = require('./services/calculator');

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node test.js <path-to-excel-file>');
  console.error('Example: node test.js ./test-data/sample.xlsx');
  process.exit(1);
}

console.log('🔍 Testing Excel Parser and Calculator Services\n');
console.log('='.repeat(60));

try {
  // Test 1: Parse Excel file
  console.log('\n📊 Step 1: Parsing Excel file...');
  console.log(`File: ${filePath}`);

  const parsedData = parseExcelFile(filePath);

  console.log(`✅ Successfully parsed Excel file`);
  console.log(`   - Respondents found: ${parsedData.respondents.length}`);
  console.log(`   - Questions mapped: ${parsedData.questions.length}`);

  // Show respondent names
  console.log('\n👥 Respondents:');
  parsedData.respondents.forEach((r, i) => {
    const validScores = r.scores.filter(s => s !== null).length;
    console.log(`   ${i + 1}. ${r.name} (${validScores}/82 valid responses)`);
  });

  // Test 2: Calculate statistics
  console.log('\n📈 Step 2: Calculating statistics...');
  const calculatedData = calculateAll(parsedData);

  console.log('✅ Successfully calculated statistics\n');

  // Show driver scores
  console.log('🎯 Driver Scores:');
  Object.entries(calculatedData.driverScores)
    .sort((a, b) => b[1] - a[1])
    .forEach(([driver, score]) => {
      const mark = driver === calculatedData.strongestDriver.name ? ' ⭐ (Strongest)' :
                   driver === calculatedData.weakestDriver.name ? ' ⚠️  (Weakest)' : '';
      console.log(`   ${driver}: ${score}${mark}`);
    });

  // Show key insights
  console.log('\n💡 Key Insights:');
  console.log(`   Highest Question: "${calculatedData.highestQuestion.text.substring(0, 60)}..."`);
  console.log(`   Average: ${calculatedData.highestQuestion.average}`);
  console.log(`   \n   Lowest Question: "${calculatedData.lowestQuestion.text.substring(0, 60)}..."`);
  console.log(`   Average: ${calculatedData.lowestQuestion.average}`);
  console.log(`   \n   Most Aligned: "${calculatedData.mostAligned.text.substring(0, 60)}..."`);
  console.log(`   Std Dev: ${calculatedData.mostAligned.stdDev}`);
  console.log(`   \n   Most Disagreed: "${calculatedData.mostDisagreed.text.substring(0, 60)}..."`);
  console.log(`   Std Dev: ${calculatedData.mostDisagreed.stdDev}`);

  // Show respondent summaries
  console.log('\n👤 Respondent Summaries:');
  calculatedData.respondents.forEach(r => {
    console.log(`   \n   ${r.name}:`);
    console.log(`   - Overall Average: ${r.overallAverage}`);
    console.log(`   - Highest Driver: ${r.highestDriver.name} (${r.highestDriver.score})`);
    console.log(`   - Lowest Driver: ${r.lowestDriver.name} (${r.lowestDriver.score})`);
    console.log(`   - Outlier Questions: ${r.outlierQuestions.length}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests passed successfully!\n');

  // Output JSON summary for inspection
  console.log('📝 Writing detailed output to test-output.json...');
  const fs = require('fs');
  fs.writeFileSync(
    path.join(__dirname, 'test-output.json'),
    JSON.stringify(calculatedData, null, 2)
  );
  console.log('✅ Done! Check test-output.json for full details.\n');

} catch (error) {
  console.error('\n❌ Error during testing:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}

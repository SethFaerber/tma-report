/**
 * Quick script to inspect Excel file structure
 */

const XLSX = require('xlsx');

const filePath = process.argv[2] || 'test-data/*.xlsx';

console.log('Inspecting Excel file structure...\n');

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log(`Total rows: ${data.length}`);
console.log(`Total columns in first row: ${data[0] ? data[0].length : 0}\n`);

// Show first 15 column headers
console.log('First 15 column headers:');
if (data[0]) {
  for (let i = 0; i < Math.min(15, data[0].length); i++) {
    const letter = String.fromCharCode(65 + i); // A, B, C, ...
    console.log(`  Col ${i} (${letter}): "${data[0][i]}"`);
  }
}

// Show first data row (columns 0-15)
console.log('\nFirst respondent (columns 0-15):');
if (data[1]) {
  for (let i = 0; i < Math.min(15, data[1].length); i++) {
    const letter = String.fromCharCode(65 + i);
    const value = String(data[1][i]).substring(0, 50);
    console.log(`  Col ${i} (${letter}): "${value}"`);
  }
}

const fs = require('fs');
const path = require('path');

const osmOutputDir = 'osmOutput';
const hmlrOutputDir = 'hmlrOutput';
const finalOutputDir = 'finalOutput';

// Helper function to read and parse JSON files
const readJsonFile = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
};

// Helper function to write JSON files
const writeJsonFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Create the final output directory if it doesn't exist
if (!fs.existsSync(finalOutputDir)) {
  fs.mkdirSync(finalOutputDir);
}

// Get the file lists from both directories
const osmFiles = fs.readdirSync(osmOutputDir);
const hmlrFiles = fs.readdirSync(hmlrOutputDir);

// Combine and deduplicate the file lists
const allFiles = new Set([...osmFiles, ...hmlrFiles]);

const totalFiles = allFiles.size;
let processedFiles = 0;

// Merge files with the same name
allFiles.forEach((fileName) => {
  const osmFilePath = path.join(osmOutputDir, fileName);
  const hmlrFilePath = path.join(hmlrOutputDir, fileName);
  const finalOutputFilePath = path.join(finalOutputDir, fileName);

  let mergedData = [];

  if (fs.existsSync(osmFilePath)) {
    mergedData = readJsonFile(osmFilePath);
  }

  if (fs.existsSync(hmlrFilePath)) {
    const hmlrData = readJsonFile(hmlrFilePath);
    mergedData = [...new Set([...mergedData, ...hmlrData])];
  }

  writeJsonFile(finalOutputFilePath, mergedData);

  processedFiles++;
  const progress = ((processedFiles / totalFiles) * 100).toFixed(2);
  process.stdout.write(`Progress: ${progress}%\r`);
});

console.log('\nProcessing completed.');

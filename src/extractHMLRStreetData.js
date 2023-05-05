const fs = require('fs');
const readline = require('readline');
const path = require('path');

//const inputFilePath = './hmlrData/pp-complete-top10.csv';
const inputFilePath = './hmlrData/pp-complete.csv';

const finalOutputDirectory = 'hmlrOutput';


const postCodeData = {};

const processCsvFile = async (filePath) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;
  let totalBytes = 0;
  const totalFileSize = fs.statSync(filePath).size;

  for await (const line of rl) {
    lineNumber++;
    const columns = line.replace(/","/g, '";"').replace(/"/g, '').split(';');

    const postCode = columns[3].toUpperCase().replace(/\s+/g, '').replace(/\/.+/g, '');
    let streetName = columns[9].toUpperCase();
    const isWierdAddress = columns[9].toUpperCase() === columns[8].toUpperCase();
    
    if(isWierdAddress) {
      streetName = columns[10].toUpperCase();
    }

    if(postCode && streetName) {
      if(!postCodeData[postCode]) {
        postCodeData[postCode] = new Set();
      }
      postCodeData[postCode].add(streetName);
    }
    

    totalBytes += Buffer.byteLength(line, 'utf8') + 1; // +1 for newline character
    const progress = ((totalBytes / totalFileSize) * 100).toFixed(2);
    process.stdout.write(`Progress: ${progress}%\r`);
  }
};

const updatePostcodeFiles = (postCodeData) => {
  if (!fs.existsSync(finalOutputDirectory)) {
    fs.mkdirSync(finalOutputDirectory);
  }

  const totalPostcodes = Object.keys(postCodeData).length;
  let processedPostcodes = 0;

  for (const [postcode, streetNamesSet] of Object.entries(postCodeData)) {
    
    const finalOutputPath = path.join(finalOutputDirectory, `${postcode}`);
    const updatedStreetNamesArray = Array.from(streetNamesSet);
    fs.writeFileSync(finalOutputPath, JSON.stringify(updatedStreetNamesArray, null, 2));

    processedPostcodes++;
    const progress = ((processedPostcodes / totalPostcodes) * 100).toFixed(2);
    process.stdout.write(`Progress: ${progress}%\r`);
  }
  console.log('\nProcessing completed.');
};



processCsvFile(inputFilePath).then(() => {
  updatePostcodeFiles(postCodeData);
  console.log('\nProcessing HMLR Data completed.');
});

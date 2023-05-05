const fs = require('fs');
const sax = require('sax');
const path = require('path');

//const inputFilePath = './osmData/decompressed/great-britain-latest-head100.osm';
const inputFilePath = './osmData/decompressed/great-britain-latest.osm';
const outputDirectory = 'osmOutput';

const parser = sax.createStream(true);
const postCodeData = {};

let currentNode = null;
let currentTags = [];

parser.on('opentag', (node) => {
  if (node.name === 'node' || node.name === 'way') {
    currentNode = {
      id: node.attributes.id,
      lat: parseFloat(node.attributes.lat),
      lon: parseFloat(node.attributes.lon),
    };
  } else if (node.name === 'tag' && currentNode) {
    currentTags.push({
      k: node.attributes.k,
      v: node.attributes.v,
    });
  }
});

parser.on('closetag', (nodeName) => {
  if ((nodeName === 'node' || nodeName === 'way') && currentNode) {
    const address = {};
    let postCode = null;
    let street = null;

    currentTags.forEach((tag) => {
      if (tag.k.startsWith('addr:')) {
        const addressKey = tag.k.replace('addr:', '');
        if(addressKey === "postcode") {
          postCode = tag.v.toUpperCase().replace(/\s+/g, '').replace(/\/.+/g, '');
        }
        if(addressKey === "street") {
          street = tag.v.toUpperCase();
        }

        address[addressKey] = tag.v;
      }
      if (tag.k.startsWith('postal_code')) {
        address[tag.k] = tag.v;
        postCode = tag.v.toUpperCase().replace(/\s+/g, '').replace(/\/.+/g, '');
      }
    });

    if(postCode && street) {
        if(!postCodeData[postCode]) {
            postCodeData[postCode] = new Set();
        }
        postCodeData[postCode].add(street);
    }

    currentNode = null;
    currentTags = [];
  }
});

parser.on('end', () => {
  //fs.writeFileSync(outputFilePath, JSON.stringify(addressData, null, 2));
  //console.log(`\nAddress data extracted to ${outputFilePath}`);
  saveGroupedData(postCodeData, outputDirectory);
});

parser.on('error', (error) => {
  console.error(`Error parsing OSM file: ${error.message}`);
  parser.error = null; // Clear the error
});

const totalBytes = fs.statSync(inputFilePath).size;
let processedBytes = 0;

const updateProgress = (chunkLength) => {
  processedBytes += chunkLength;
  const progress = ((processedBytes / totalBytes) * 100).toFixed(2);
  process.stdout.write(`Parsing progress: ${progress}%\r`);
};

const saveGroupedData = (groupedData, outputDir) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
  
    const totalPostcodes = Object.keys(groupedData).length;
    let processedPostcodes = 0;
  
    Object.entries(groupedData).forEach(([postcode, addresses]) => {
      const outputFile = path.join(outputDir, `${postcode}`);
      fs.writeFileSync(outputFile, JSON.stringify([...addresses], null, 2));
  
      processedPostcodes++;
      const progress = ((processedPostcodes / totalPostcodes) * 100).toFixed(2);
      process.stdout.write(`Saving progress: ${progress}%\r`);
    });
};

const inputStream = fs.createReadStream(inputFilePath);
inputStream.on('data', (chunk) => updateProgress(chunk.length));
inputStream.pipe(parser);

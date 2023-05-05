const https = require("https");
const fs = require("fs");
const { exec } = require("child_process");

const url = "http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-complete.csv";
const downloadFilePath = "hmlrData/pp-complete.csv";

const downloadFile = (url, outputPath) => {
  https.get(url, (response) => {
    const totalBytes = parseInt(response.headers["content-length"], 10);
    let downloadedBytes = 0;

    const file = fs.createWriteStream(outputPath);
    response.pipe(file);

    response.on("data", (chunk) => {
      downloadedBytes += chunk.length;
      const percentage = ((downloadedBytes / totalBytes) * 100).toFixed(2);
      process.stdout.write(`Download progress: ${percentage}%\r`);
    });

    file.on("finish", () => {
      file.close();
      console.log("\nHM Land Registry data download complete.");
    });
  });
};

downloadFile(url, downloadFilePath);

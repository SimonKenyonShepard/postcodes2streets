const https = require("https");
const fs = require("fs");
const { exec } = require("child_process");

const url = "https://download.geofabrik.de/europe/great-britain-latest.osm.bz2";
const compressedFilePath = "osmData/compressed/great-britain-latest.osm.bz2";
const outputFilePath = "osmData/decompressed/great-britain-latest.osm";

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
      console.log("\nOSM data download complete.");
      decompressFile(outputPath);
    });
  });
};

const decompressFile = (compressedFile) => {
  const decompressionCommand = process.platform === "win32" ?
    `7z e ${compressedFile} -o${outputFilePath}` :
    `bzip2 -dkc ${compressedFile} > ${outputFilePath}`;

  exec(decompressionCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error decompressing file: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
    console.log("OSM data decompression complete.");
  });
};

downloadFile(url, compressedFilePath);

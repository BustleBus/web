import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import iconv from 'iconv-lite'; // Import iconv-lite

const main = () => {
  try {
    // Assuming the CSV file is named 'data.csv' and placed in the 'dataFile' directory.
    const csvPath = path.resolve(process.cwd(), 'dataFile', 'data.csv');
    const jsonPath = path.resolve(process.cwd(), 'public', 'data.json');

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Error: CSV file not found at ${csvPath}`);
      console.error('Please make sure a CSV file named "data.csv" exists in the "dataFile" directory.');
      process.exit(1);
    }

    console.log(`Reading CSV file from: ${csvPath} with euc-kr encoding`);
    const fileStream = fs.createReadStream(csvPath); // Read as binary stream
    const decodedStream = fileStream.pipe(iconv.decodeStream('euc-kr')); // Decode to UTF-8

    const results: unknown[] = [];

    Papa.parse(decodedStream, { // Pass the decoded stream to Papa.parse
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      step: (result) => {
        results.push(result.data);
      },
      complete: () => {
        console.log(`Writing ${results.length} rows to JSON file: ${jsonPath}`);
        fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');
        console.log('✅ Conversion successful!');
      },
      error: (error: Error) => {
        console.error('❌ Error during CSV parsing:', error.message);
        process.exit(1);
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error during conversion:', error.message);
    } else {
      console.error('❌ An unknown error occurred during conversion.');
    }
    process.exit(1);
  }
};

main();

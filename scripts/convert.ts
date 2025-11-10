import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const main = () => {
  try {
    const xlsxPath = path.resolve(process.cwd(), 'dataFile', '2025년_버스노선별_정류장별_시간대별_승하차_인원_정보(09월).xlsx');
    const jsonPath = path.resolve(process.cwd(), 'public', 'data.json');

    console.log(`Reading Excel file from: ${xlsxPath}`);
    const workbook = XLSX.readFile(xlsxPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Writing ${jsonData.length} rows to JSON file: ${jsonPath}`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');

    console.log('✅ Conversion successful!');
  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  }
};

main();

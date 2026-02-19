const XLSX = require('xlsx');

try {
    const filename = 'Trajet DATA_  Lundi 16-02-2026.xlsx';
    console.log(`Reading ${filename}...`);
    const workbook = XLSX.readFile(filename);
    console.log('Sheet Names:', workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('Rows (First 10):');
        data.slice(0, 10).forEach((row, i) => {
            console.log(`Row ${i}:`, row);
        });
    });
} catch (e) {
    console.error(e);
}

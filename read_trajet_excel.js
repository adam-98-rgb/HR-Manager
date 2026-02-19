const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Trajet.xlsm');
    const sheetName = 'Planning'; 
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
        console.log(`Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
        process.exit(1);
    }

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Headers (First 5 rows):');
    data.slice(0, 5).forEach((row, i) => {
        console.log(`Row ${i}:`, row);
    });
} catch (e) {
    console.error(e);
}

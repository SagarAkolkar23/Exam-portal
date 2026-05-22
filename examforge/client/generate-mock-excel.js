import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const students = [
  { Name: 'Alice Smith', Email: 'alice.smith@student.edu', 'Roll No': 'CS23201', PRN: '20230230001' },
  { Name: 'Bob Jones', Email: 'bob.jones@student.edu', 'Roll No': 'CS23202', PRN: '20230230002' },
  { Name: 'Charlie Brown', Email: 'charlie.brown@student.edu', 'Roll No': 'CS23203', PRN: '20230230003' },
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(students);
XLSX.utils.book_append_sheet(wb, ws, 'Students');

const filePath = path.join(__dirname, 'mock_students.xlsx');
XLSX.writeFile(wb, filePath);
console.log('Mock Excel file created successfully at:', filePath);

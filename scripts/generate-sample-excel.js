#!/usr/bin/env node
/**
 * Generate SAMPLE_EXCEL_FORMAT.xlsx at the project root + a copy inside /public
 * (so it can be downloaded from the running app at /SAMPLE_EXCEL_FORMAT.xlsx).
 *
 * Run with: node scripts/generate-sample-excel.js
 */
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

const root = path.resolve(__dirname, "..");
const outRoot = path.join(root, "SAMPLE_EXCEL_FORMAT.xlsx");
const outPublic = path.join(root, "public", "SAMPLE_EXCEL_FORMAT.xlsx");

const rows = [
  {
    professor_name: "Jane Doe",
    university: "MIT",
    email: "jdoe@mit.edu",
    department: "EECS",
    lab_website: "https://janedoe.mit.edu",
    research_area: "Computer vision and self-supervised learning",
    notes: "Open to summer research interns",
  },
  {
    professor_name: "Rahul Sharma",
    university: "Stanford University",
    email: "rsharma@stanford.edu",
    department: "Computer Science",
    lab_website: "https://stanford.edu/~rsharma",
    research_area: "Robotics, imitation learning",
    notes: "",
  },
  {
    professor_name: "Maria Gomez",
    university: "ETH Zurich",
    email: "maria.gomez@ethz.ch",
    department: "Mechanical Engineering",
    lab_website: "",
    research_area: "Soft robotics, bio-inspired actuators",
    notes: "Has IROS/ICRA publications",
  },
];

const headers = [
  "professor_name",
  "university",
  "email",
  "department",
  "lab_website",
  "research_area",
  "notes",
];

const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
ws["!cols"] = [
  { wch: 22 },
  { wch: 22 },
  { wch: 28 },
  { wch: 18 },
  { wch: 32 },
  { wch: 38 },
  { wch: 32 },
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Professors");

XLSX.writeFile(wb, outRoot);
fs.mkdirSync(path.dirname(outPublic), { recursive: true });
fs.copyFileSync(outRoot, outPublic);

console.log(`Generated:\n  - ${outRoot}\n  - ${outPublic}`);

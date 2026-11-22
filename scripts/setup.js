#!/usr/bin/env node
/**
 * One-shot setup script:
 *   1. Ensures runtime folders exist (data/, uploads/, logs/, public/, etc.)
 *   2. Generates SAMPLE_EXCEL_FORMAT.xlsx
 *
 * Run with: node scripts/setup.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

const folders = [
  "data",
  "uploads",
  "uploads/resumes",
  "uploads/excel",
  "templates",
  "logs",
  "docs",
  "public",
];

for (const f of folders) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    console.log(`+ created ${f}/`);
  }
  const keep = path.join(p, ".gitkeep");
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, "");
}

try {
  execSync("node scripts/generate-sample-excel.js", {
    cwd: root,
    stdio: "inherit",
  });
} catch (e) {
  console.warn("! Could not generate sample Excel:", e.message);
}

console.log("\nSetup complete. Next steps:");
console.log("  1. npm run dev   →   open http://localhost:3000");
console.log("  2. /settings → paste Gemini key + Gmail App Password → Save");
console.log("  3. Click \"Test Configuration\" → all four checks should pass");
console.log("  4. /professors → Upload .xlsx → Personalize → Send");

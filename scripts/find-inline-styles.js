const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXT = ['.tsx', '.jsx', '.ts', '.js'];

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    const res = path.resolve(dir, ent.name);
    if (ent.isDirectory()) walk(res, fileList);
    else if (EXT.includes(path.extname(ent.name))) fileList.push(res);
  }
  return fileList;
}

function findInlineStyles(file) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\bstyle=\s*\{{2}/.test(line) || /\bstyle=\s*\{\s*\{/.test(line) || /\bstyle=\s*\{/ .test(line) && /\{/ .test(line)) {
      hits.push({ line: i + 1, text: line.trim() });
    }
  }
  return hits;
}

function main() {
  const files = walk(ROOT);
  const report = [];
  for (const f of files) {
    const hits = findInlineStyles(f);
    if (hits.length) report.push({ file: path.relative(ROOT, f), hits });
  }

  if (!report.length) {
    console.log('No inline `style` attributes found.');
    process.exit(0);
  }

  console.log('Found inline `style` usages:');
  for (const r of report) {
    console.log(`\n- ${r.file}`);
    for (const h of r.hits) console.log(`  L${h.line}: ${h.text}`);
  }
  process.exit(0);
}

main();

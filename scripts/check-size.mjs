import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import zipdir from 'zip-dir';

const rootDir = process.cwd();
const budgetsPath = path.join(rootDir, 'budgets.json');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(budgetsPath)) {
  console.error('budgets.json not found');
  process.exit(1);
}

const budgets = JSON.parse(fs.readFileSync(budgetsPath, 'utf8'));

const contentJsPath = path.join(distDir, 'content.js');
const popupJsPath = path.join(distDir, 'popup.js');

if (!fs.existsSync(contentJsPath) || !fs.existsSync(popupJsPath)) {
  console.error('Build artifacts not found in dist/. Run "npm run build" first.');
  process.exit(1);
}

const contentJsRaw = fs.readFileSync(contentJsPath);
const contentJsMinBytes = contentJsRaw.length;
const contentJsGzipBytes = zlib.gzipSync(contentJsRaw).length;

const popupJsRaw = fs.readFileSync(popupJsPath);
const popupJsMinBytes = popupJsRaw.length;

const zipBuffer = await zipdir(distDir, {
  filter: (filePath) => !filePath.includes('_locales'),
});
const zipBytes = zipBuffer.length;

let failed = false;

console.log('--- Size Budget Check ---');
console.log(`dist/content.js (minified): ${contentJsMinBytes} B / max ${budgets.contentJsMaxMinifiedBytes} B`);
if (contentJsMinBytes > budgets.contentJsMaxMinifiedBytes) {
  console.error(`FAIL: dist/content.js exceeds minified budget (${contentJsMinBytes} > ${budgets.contentJsMaxMinifiedBytes})`);
  failed = true;
}

console.log(`dist/content.js (gzipped):  ${contentJsGzipBytes} B / max ${budgets.contentJsMaxGzipBytes} B`);
if (contentJsGzipBytes > budgets.contentJsMaxGzipBytes) {
  console.error(`FAIL: dist/content.js exceeds gzipped budget (${contentJsGzipBytes} > ${budgets.contentJsMaxGzipBytes})`);
  failed = true;
}

console.log(`dist/popup.js (minified):   ${popupJsMinBytes} B / max ${budgets.popupJsMaxMinifiedBytes} B`);
if (popupJsMinBytes > budgets.popupJsMaxMinifiedBytes) {
  console.error(`FAIL: dist/popup.js exceeds minified budget (${popupJsMinBytes} > ${budgets.popupJsMaxMinifiedBytes})`);
  failed = true;
}

console.log(`Zipped (excl. _locales):    ${zipBytes} B / max ${budgets.packageExcludingLocalesMaxBytes} B`);
if (zipBytes > budgets.packageExcludingLocalesMaxBytes) {
  console.error(`FAIL: Zipped package exceeds budget (${zipBytes} > ${budgets.packageExcludingLocalesMaxBytes})`);
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('All size budgets passed.');

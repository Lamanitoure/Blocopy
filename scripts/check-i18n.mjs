import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const localesDir = path.join(rootDir, '_locales');
const enMessagesPath = path.join(localesDir, 'en', 'messages.json');
const manifestTemplatePath = path.join(rootDir, 'src', 'manifest.template.json');

if (!fs.existsSync(enMessagesPath)) {
  console.error('Fatal: _locales/en/messages.json does not exist');
  process.exit(1);
}

const enMessages = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
const enKeys = Object.keys(enMessages);

let failed = false;

// 1. Verify en messages themselves
for (const key of enKeys) {
  const item = enMessages[key];
  if (!item || typeof item.message !== 'string' || item.message.trim().length === 0) {
    console.error(`FAIL: en key "${key}" message is empty`);
    failed = true;
  }
}

// 2. Check all available locales against en
const localeDirs = fs.readdirSync(localesDir).filter((f) => {
  return fs.statSync(path.join(localesDir, f)).isDirectory();
});

for (const locale of localeDirs) {
  if (locale === 'en') continue;
  const locPath = path.join(localesDir, locale, 'messages.json');
  if (!fs.existsSync(locPath)) {
    console.error(`FAIL: Locale directory ${locale} has no messages.json`);
    failed = true;
    continue;
  }
  const locMessages = JSON.parse(fs.readFileSync(locPath, 'utf8'));
  const locKeys = Object.keys(locMessages);

  // Missing or extra keys
  for (const k of enKeys) {
    if (!(k in locMessages)) {
      console.error(`FAIL: Locale "${locale}" is missing key "${k}"`);
      failed = true;
    }
  }
  for (const k of locKeys) {
    if (!(k in enMessages)) {
      console.error(`FAIL: Locale "${locale}" has extra key "${k}"`);
      failed = true;
    }
  }

  // Check empty message and placeholders
  for (const k of locKeys) {
    if (!(k in enMessages)) continue;
    const msg = locMessages[k]?.message;
    if (typeof msg !== 'string' || msg.trim().length === 0) {
      console.error(`FAIL: Locale "${locale}" has empty message for key "${k}"`);
      failed = true;
    }

    // Check placeholder consistency
    const enPlaceholders = Object.keys(enMessages[k].placeholders || {}).sort();
    const locPlaceholders = Object.keys(locMessages[k].placeholders || {}).sort();
    if (JSON.stringify(enPlaceholders) !== JSON.stringify(locPlaceholders)) {
      console.error(`FAIL: Placeholder mismatch in locale "${locale}" for key "${k}"`);
      failed = true;
    }
  }
}

// 3. Check manifest template __MSG_x__ references
if (fs.existsSync(manifestTemplatePath)) {
  const manifestContent = fs.readFileSync(manifestTemplatePath, 'utf8');
  const msgMatches = manifestContent.matchAll(/__MSG_([a-zA-Z0-9_]+)__/g);
  for (const match of msgMatches) {
    const key = match[1];
    if (!enKeys.includes(key)) {
      console.error(`FAIL: manifest.template.json references unknown message key "${key}"`);
      failed = true;
    }
  }
}

// 4. Scan src/ for t('key') calls and raw string assignments to user-visible properties
function scanSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanSourceFiles(fullPath);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      const code = fs.readFileSync(fullPath, 'utf8');

      // Check t('key')
      const tCalls = code.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g);
      for (const m of tCalls) {
        const key = m[1];
        if (!enKeys.includes(key) && key !== '@@bidi_dir') {
          console.error(`FAIL: ${fullPath} calls t('${key}') which is not in en messages`);
          failed = true;
        }
      }

      // Check user-visible string literals (textContent, title, ariaLabel, placeholder)
      const rawStringAssigns = code.matchAll(/\.(textContent|title|ariaLabel|placeholder)\s*=\s*['"`]([^'"`]+)['"`]/g);
      for (const m of rawStringAssigns) {
        const prop = m[1];
        const val = m[2].trim();
        // Allow empty string clear
        if (val.length > 0) {
          console.error(`FAIL: User-visible string literal assigned to .${prop} in ${fullPath}: "${val}"`);
          failed = true;
        }
      }
    }
  }
}

scanSourceFiles(path.join(rootDir, 'src'));

if (failed) {
  process.exit(1);
}

console.log('check:i18n passed.');

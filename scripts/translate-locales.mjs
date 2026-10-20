import fs from 'node:fs';
import path from 'node:path';

export function splitPlaceholders(text) {
  // Regex to match $NAME$ tokens
  const parts = [];
  const regex = /(\$[A-Z0-9_]+\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'placeholder', value: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

export function mergeOverrides(generated, overrides) {
  return {
    ...generated,
    ...overrides,
  };
}

async function translateText(text, targetLang, endpoint, apiKey) {
  const parts = splitPlaceholders(text);
  const translatedParts = [];

  for (const part of parts) {
    if (part.type === 'placeholder') {
      translatedParts.push(part.value);
    } else {
      if (!part.value.trim()) {
        translatedParts.push(part.value);
        continue;
      }
      const body = {
        q: part.value,
        source: 'en',
        target: targetLang,
        format: 'text',
      };
      if (apiKey) {
        body.api_key = apiKey;
      }

      const res = await fetch(`${endpoint.replace(/\/+$/, '')}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`MT API error ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      if (!data.translatedText) {
        throw new Error(`Empty translation returned for "${part.value}"`);
      }
      translatedParts.push(data.translatedText);
    }
  }

  return translatedParts.join('');
}

async function run() {
  const rootDir = process.cwd();
  const endpoint = process.env.BLOCOPY_MT_URL;
  const apiKey = process.env.BLOCOPY_MT_API_KEY;

  if (!endpoint) {
    console.log('BLOCOPY_MT_URL not set. Skipping translation.');
    return;
  }

  const enRaw = fs.readFileSync(path.join(rootDir, '_locales', 'en', 'messages.json'), 'utf8');
  const enMessages = JSON.parse(enRaw);

  const configRaw = fs.readFileSync(path.join(rootDir, 'scripts', 'locales.config.json'), 'utf8');
  const config = JSON.parse(configRaw);

  const overridesDir = path.join(rootDir, 'scripts', 'translation-overrides');

  for (const loc of config.locales) {
    console.log(`Translating locale: ${loc.code} (MT: ${loc.mtCode})...`);
    const translatedMessages = {};

    for (const [key, val] of Object.entries(enMessages)) {
      if (config.doNotTranslate.includes(key)) {
        translatedMessages[key] = { ...val };
      } else {
        const translatedMessage = await translateText(val.message, loc.mtCode, endpoint, apiKey);
        translatedMessages[key] = {
          ...val,
          message: translatedMessage,
        };
      }
    }

    // Merge overrides if present
    const overrideFile = path.join(overridesDir, `${loc.code}.json`);
    let finalMessages = translatedMessages;
    if (fs.existsSync(overrideFile)) {
      const overrides = JSON.parse(fs.readFileSync(overrideFile, 'utf8'));
      finalMessages = mergeOverrides(translatedMessages, overrides);
    }

    const outDir = path.join(rootDir, '_locales', loc.code);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'messages.json'), JSON.stringify(finalMessages, null, 2) + '\n', 'utf8');
    console.log(`Wrote _locales/${loc.code}/messages.json`);
  }

  console.log('Translation complete.');
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  run().catch((err) => {
    console.error('Translation failed:', err);
    process.exit(1);
  });
}

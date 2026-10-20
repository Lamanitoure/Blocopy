import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const port = parseInt(process.env.PORT || '3000', 10);
const distDir = path.join(rootDir, 'dist');
const fixturesDir = path.join(rootDir, 'test', 'fixtures');

// Run initial build
async function build() {
  const { execSync } = await import('node:child_process');
  try {
    execSync('node scripts/build.mjs --dev', { stdio: 'inherit' });
  } catch (err) {
    console.error('Build error:', err);
  }
}

await build();

// Watch src/ and test/ directories for changes
fs.watch(path.join(rootDir, 'src'), { recursive: true }, async (_eventType, filename) => {
  if (filename) {
    console.log(`File change detected: ${filename}. Rebuilding...`);
    await build();
  }
});

// MIME types table
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain',
};

// Simple dev HTTP server on port 3000 for previewing fixtures and test harness
const server = http.createServer((req, res) => {
  const urlPath = req.url?.split('?')[0] || '/';
  let filePath = '';

  if (urlPath === '/' || urlPath === '/index.html') {
    // Generate dashboard index
    let fixtureLinks = '';
    if (fs.existsSync(fixturesDir)) {
      const fixtures = fs.readdirSync(fixturesDir).filter((f) => f.endsWith('.html'));
      fixtureLinks = fixtures
        .map((f) => `<li><a href="/fixtures/${f}">${f}</a></li>`)
        .join('');
    }

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Blocopy Development & Test Harness</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { color: #2563eb; }
    ul { list-style: disc; margin-left: 20px; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
  </style>
</head>
<body>
  <h1>Blocopy — Development & Fixtures Server</h1>
  <p>Double-click to select and copy a whole block of text. Click a paragraph to leave it out.</p>
  <div class="card">
    <h3>Test Fixture Pages (Section 15.2)</h3>
    <ul>
      ${fixtureLinks || '<li>No fixtures created yet</li>'}
    </ul>
  </div>
  <div class="card">
    <h3>Built Extension Files</h3>
    <ul>
      <li><a href="/dist/manifest.json">manifest.json</a></li>
      <li><a href="/dist/popup.html">popup.html</a></li>
      <li><a href="/dist/content.js">content.js</a></li>
      <li><a href="/dist/content.css">content.css</a></li>
    </ul>
  </div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (urlPath.startsWith('/fixtures/')) {
    filePath = path.join(fixturesDir, urlPath.replace('/fixtures/', ''));
  } else if (urlPath.startsWith('/dist/')) {
    filePath = path.join(distDir, urlPath.replace('/dist/', ''));
  } else {
    filePath = path.join(rootDir, urlPath);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Blocopy dev server running on http://0.0.0.0:${port}`);
});

// If web-ext is requested and Firefox exists, spawn web-ext run
if (process.argv.includes('--firefox')) {
  const child = spawn('npx', ['web-ext', 'run', '--source-dir', 'dist'], {
    stdio: 'inherit',
  });
  child.on('error', (err) => {
    console.warn('web-ext run notice:', err.message);
  });
}

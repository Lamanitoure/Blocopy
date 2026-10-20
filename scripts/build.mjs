import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

const isDev = process.argv.includes('--dev');
const isRelease = process.argv.includes('--release') || process.env.RELEASE === 'true';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

// Read package.json for version
const pkgRaw = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8');
const pkg = JSON.parse(pkgRaw);

// Read manifest template
const manifestTemplateRaw = fs.readFileSync(path.join(rootDir, 'src', 'manifest.template.json'), 'utf8');
const manifest = JSON.parse(manifestTemplateRaw);

// In release mode, gecko.id cannot be placeholder
if (isRelease && manifest.browser_specific_settings?.gecko?.id?.includes('OWNER_SUPPLIED')) {
  console.error('Error: gecko.id must be supplied before creating a release build.');
  process.exit(1);
}

// Inject version from package.json
manifest.version = pkg.version;

// Ensure dist directory exists and is clean
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

// Copy static assets
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy _locales
copyDirRecursive(path.join(rootDir, '_locales'), path.join(distDir, '_locales'));

// Copy icons
copyDirRecursive(path.join(rootDir, 'icons'), path.join(distDir, 'icons'));

// Copy popup.html, popup.css, content.css
fs.copyFileSync(path.join(rootDir, 'src', 'popup', 'popup.html'), path.join(distDir, 'popup.html'));
fs.copyFileSync(path.join(rootDir, 'src', 'popup', 'popup.css'), path.join(distDir, 'popup.css'));
fs.copyFileSync(path.join(rootDir, 'src', 'content', 'content.css'), path.join(distDir, 'content.css'));

// Write final manifest.json
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

// esbuild bundle for content script (iife, loader .css=text)
await esbuild.build({
  entryPoints: [path.join(rootDir, 'src', 'content', 'index.ts')],
  outfile: path.join(distDir, 'content.js'),
  bundle: true,
  format: 'iife',
  target: ['firefox140'],
  minify: !isDev,
  sourcemap: isDev ? 'inline' : false,
  loader: {
    '.css': 'text',
  },
});

// esbuild bundle for popup (iife)
await esbuild.build({
  entryPoints: [path.join(rootDir, 'src', 'popup', 'popup.ts')],
  outfile: path.join(distDir, 'popup.js'),
  bundle: true,
  format: 'iife',
  target: ['firefox140'],
  minify: !isDev,
  sourcemap: isDev ? 'inline' : false,
});

console.log('Build completed successfully.');

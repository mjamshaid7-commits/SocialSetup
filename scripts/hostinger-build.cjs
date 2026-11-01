const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const rootDir = process.cwd();
const distIndex = path.join(rootDir, 'dist', 'index.html');
const serverJs = path.join(rootDir, 'server.js');

// Ensure runtime storage directories exist
for (const dir of ['data', path.join('data', 'backups'), 'uploads']) {
  try {
    fs.mkdirSync(path.join(rootDir, dir), { recursive: true });
  } catch {}
}

const isAiStudioContainer = rootDir === '/app/applet' || process.env.FORCE_BUILD === 'true';
const hasPrebuiltArtifacts = fs.existsSync(distIndex) && fs.existsSync(serverJs);

if (!isAiStudioContainer && hasPrebuiltArtifacts) {
  console.log('[TopTech Hostinger Build] Pre-built dist/index.html and server.js verified. Skipping heavy compiler threads for CloudLinux LVE stability.');
  process.exit(0);
}

console.log('[TopTech Build] Building frontend (dist/) and Node.js 20 Express server (server.js)...');
execSync(
  'npx vite build && npx esbuild src/server-app.ts --bundle --platform=node --target=node20 --format=cjs --packages=external --outfile=server.js',
  { stdio: 'inherit', cwd: rootDir }
);
console.log('[TopTech Build] Build complete.');

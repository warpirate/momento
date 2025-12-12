const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function safeExec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function parseChangesFromBody(body) {
  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'));

  // Prefer bullet-like lines if available
  const bulletLines = lines.filter((line) => /^[-*]\s+/.test(line));
  const selected = (bulletLines.length > 0 ? bulletLines : lines).slice(0, 8);

  return selected
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

function sanitizeDescription(body) {
  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'));

  // If it's mostly a bullet list, prefer not showing the raw commit body.
  const hasManyBullets = lines.filter((line) => /^[-*]\s+/.test(line)).length >= 2;
  if (hasManyBullets) return '';

  // Keep a short, clean summary (first non-bullet line)
  const firstSummary = lines.find((line) => !/^[-*]\s+/.test(line)) || '';
  return firstSummary.slice(0, 160);
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const packageJsonPath = path.join(projectRoot, 'package.json');

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = String(pkg.version || '').trim();

  if (!version) {
    throw new Error('package.json is missing a valid version');
  }

  const subject = safeExec('git log -1 --pretty=%s');
  const body = safeExec('git log -1 --pretty=%b');

  const title = subject || `Momento ${version}`;
  const description = body ? sanitizeDescription(body) : '';
  const changes = parseChangesFromBody(body);

  const notes = {
    version,
    title,
    description,
    changes,
  };

  const outPath = path.join(projectRoot, 'src', 'content', 'releaseNotes.generated.json');
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};
  const merged = { ...existing, [version]: notes };

  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n');
}

main();

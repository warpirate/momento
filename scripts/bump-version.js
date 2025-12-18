const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
const settingsScreenPath = path.join(__dirname, '../src/screens/SettingsScreen.tsx');

// Read package.json
const packageJson = require(packageJsonPath);
const currentVersion = packageJson.version;
console.log(`Current version: ${currentVersion}`);

const [major, minor, patch] = currentVersion.split('.').map(Number);

// Increment patch version
// User requirement: 1.0.9 -> 1.0.10, not 1.1.0.
const newPatch = patch + 1;
const newVersion = `${major}.${minor}.${newPatch}`;

console.log(`New version: ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Update android/app/build.gradle
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

// Update versionName
buildGradle = buildGradle.replace(
  /versionName "[^"]+"/,
  `versionName "${newVersion}"`
);

// Update versionCode
// Requirement: versionCode should increase as 15,16,17... matching the patch number.
// This also prevents drifting versionCode if someone manually edits build.gradle.
const newVersionCode = Number.isFinite(newPatch) ? newPatch : undefined;
if (typeof newVersionCode === 'number') {
  buildGradle = buildGradle.replace(/versionCode \d+/, `versionCode ${newVersionCode}`);
  console.log(`New versionCode: ${newVersionCode}`);
}

fs.writeFileSync(buildGradlePath, buildGradle);

// Update src/screens/SettingsScreen.tsx
let settingsScreen = fs.readFileSync(settingsScreenPath, 'utf8');
settingsScreen = settingsScreen.replace(
  /const APP_VERSION = '[^']+';/,
  `const APP_VERSION = '${newVersion}';`
);
fs.writeFileSync(settingsScreenPath, settingsScreen);

console.log(`Updated version to ${newVersion} in package.json, build.gradle, and SettingsScreen.tsx`);
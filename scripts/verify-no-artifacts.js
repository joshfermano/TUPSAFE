const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Check if a directory exists
 * @param {string} dirPath - Path to check
 * @returns {boolean}
 */
function directoryExists(dirPath) {
  try {
    const stats = fs.statSync(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get subdirectories of a directory
 * @param {string} dirPath - Parent directory path
 * @returns {string[]} - Array of subdirectory names
 */
function getSubdirectories(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries
      .filter(function (entry) {
        return entry.isDirectory();
      })
      .map(function (entry) {
        return entry.name;
      });
  } catch {
    return [];
  }
}

/**
 * Main verification function
 */
function verifyNoArtifacts() {
  const foundArtifacts = [];

  // Check packages/*/dist directories
  const packagesDir = path.join(ROOT_DIR, 'packages');
  const packages = getSubdirectories(packagesDir);

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    const distPath = path.join(packagesDir, pkg, 'dist');
    if (directoryExists(distPath)) {
      foundArtifacts.push(path.relative(ROOT_DIR, distPath));
    }
  }

  // Check apps/*/.next directories
  const appsDir = path.join(ROOT_DIR, 'apps');
  const apps = getSubdirectories(appsDir);

  for (let j = 0; j < apps.length; j++) {
    const app = apps[j];
    const nextPath = path.join(appsDir, app, '.next');
    if (directoryExists(nextPath)) {
      foundArtifacts.push(path.relative(ROOT_DIR, nextPath));
    }
  }

  // Report results
  if (foundArtifacts.length > 0) {
    console.error('Build artifacts found:');
    for (let k = 0; k < foundArtifacts.length; k++) {
      console.error('  - ' + foundArtifacts[k]);
    }
    console.error('');
    console.error('Run "npm run clean:dist" to remove them.');
    process.exit(1);
  }

  console.log('No build artifacts found.');
  process.exit(0);
}

// Run the verification
verifyNoArtifacts();

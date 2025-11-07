#!/usr/bin/env node

/**
 * Release script for creating and pushing version tags
 * Usage: node scripts/release.js [major|minor|patch]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m'
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

function exec(command, silent = false) {
  try {
    return execSync(command, { 
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    }).trim();
  } catch (error) {
    if (!silent) {
      log(`Command failed: ${command}`, 'error');
    }
    throw error;
  }
}

function getCurrentVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
  );
  return packageJson.version;
}

function updateVersion(newVersion) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
}

function bumpVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2]++;
      break;
    default:
      throw new Error(`Unknown version type: ${type}`);
  }
  
  return parts.join('.');
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  log('\n🚀 Simple Backuper - Release Script\n', 'info');
  
  // Check if git is clean
  try {
    const status = exec('git status --porcelain', true);
    if (status) {
      log('⚠ Warning: You have uncommitted changes', 'warning');
      const answer = await prompt('Do you want to continue? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        log('Release cancelled', 'info');
        process.exit(0);
      }
    }
  } catch (error) {
    log('Could not check git status', 'warning');
  }
  
  const versionType = process.argv[2] || 'patch';
  if (!['major', 'minor', 'patch'].includes(versionType)) {
    log('Usage: node scripts/release.js [major|minor|patch]', 'error');
    process.exit(1);
  }
  
  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, versionType);
  
  log(`Current version: ${currentVersion}`, 'info');
  log(`New version: ${newVersion}`, 'info');
  
  const confirm = await prompt('\nContinue with release? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    log('Release cancelled', 'info');
    process.exit(0);
  }
  
  // Update package.json
  log('\nUpdating package.json...', 'info');
  updateVersion(newVersion);
  log('✓ Version updated', 'success');
  
  // Build binaries locally (optional)
  const buildLocal = await prompt('\nBuild binaries locally? (y/N): ');
  if (buildLocal.toLowerCase() === 'y') {
    log('\nBuilding binaries...', 'info');
    exec('node scripts/build.js all');
  }
  
  // Git operations
  log('\nCommitting changes...', 'info');
  exec(`git add package.json`);
  exec(`git commit -m "chore: bump version to ${newVersion}"`);
  log('✓ Changes committed', 'success');
  
  log('\nCreating tag...', 'info');
  exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
  log(`✓ Tag v${newVersion} created`, 'success');
  
  log('\nPushing changes...', 'info');
  exec('git push');
  exec('git push --tags');
  log('✓ Changes and tags pushed', 'success');
  
  log('\n✨ Release process completed!', 'success');
  log(`\nVersion ${newVersion} has been released.`, 'info');
  log('GitHub Actions will build and publish the binaries automatically.', 'info');
  log(`\nCheck the release at: https://github.com/NedcloarBR/simple-backuper/releases/tag/v${newVersion}\n`, 'info');
}

main().catch(error => {
  log(`\nRelease failed: ${error.message}`, 'error');
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Build script for creating platform-specific binaries
 * Usage: node scripts/build.js [platform]
 * Platforms: win, linux, macos, all (default)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const platforms = {
  win: {
    target: 'node18-win-x64',
    output: 'simple-backuper-win.exe'
  },
  linux: {
    target: 'node18-linux-x64',
    output: 'simple-backuper-linux'
  },
  macos: {
    target: 'node18-macos-x64',
    output: 'simple-backuper-macos'
  }
};

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

function exec(command, description) {
  log(`${description}...`, 'info');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} completed`, 'success');
  } catch (error) {
    log(`✗ ${description} failed`, 'error');
    process.exit(1);
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function build(platform) {
  const config = platforms[platform];
  if (!config) {
    log(`Unknown platform: ${platform}`, 'error');
    process.exit(1);
  }

  log(`\n📦 Building for ${platform}...`, 'info');
  
  ensureDir('build');
  
  const pkgCommand = `yarn pkg dist/index.js --target ${config.target} --output build/${config.output}`;
  exec(pkgCommand, `Building ${config.output}`);
  
  // Make executable on Unix systems
  if (platform !== 'win' && process.platform !== 'win32') {
    try {
      fs.chmodSync(path.join('build', config.output), 0o755);
      log(`✓ Made ${config.output} executable`, 'success');
    } catch (error) {
      log(`⚠ Could not make ${config.output} executable: ${error.message}`, 'warning');
    }
  }
}

function main() {
  const targetPlatform = process.argv[2] || 'all';
  
  log('\n🚀 Simple Backuper - Build Script\n', 'info');
  
  // Clean previous builds
  exec('yarn clean', 'Cleaning previous builds');
  
  // Build TypeScript
  exec('yarn build', 'Compiling TypeScript');
  
  // Build binaries
  if (targetPlatform === 'all') {
    Object.keys(platforms).forEach(platform => {
      build(platform);
    });
  } else {
    build(targetPlatform);
  }
  
  log('\n✨ Build completed successfully!\n', 'success');
  log('Binaries are available in the build/ directory', 'info');
}

main();

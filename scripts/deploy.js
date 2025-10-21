#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function checkGitStatus() {
  try {
    // Check for any changes including untracked and ignored files
    const status = execSync('git status --porcelain --ignored', { encoding: 'utf8' });
    return status.trim();
  } catch (error) {
    console.error('❌ Failed to check git status:', error.message);
    return '';
  }
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.log('⚠️  Could not determine current branch, assuming main');
    return 'main';
  }
}

function gitAddCommitPush() {
  const changes = checkGitStatus();
  if (!changes) {
    console.log('📋 No changes to commit - skipping deployment');
    return false;
  }

  console.log('🚀 Starting automatic git deployment...');
  console.log(`📝 Changes detected:\n${changes}`);

  try {
    // Add ALL changes (including ignored files)
    runCommand('git add -A', 'Adding ALL files to git (including ignored)');

    // Set Git user config for commits
    runCommand('git config user.name "github-actions[bot]"', 'Setting Git user name');
    runCommand('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', 'Setting Git user email');

    // Get current date/time and branch for commit message
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');
    const branch = getCurrentBranch();
    const commitMessage = `Auto-deploy [${branch}]: ${timestamp}`;

    // Commit changes
    runCommand(`git commit -m "${commitMessage}"`, 'Committing changes');

    // Push to remote
    runCommand(`git push origin ${branch}`, `Pushing to remote ${branch} branch`);

    console.log('🎉 Deployment completed successfully!');
    console.log('📦 Vercel auto-deployment should trigger now...');
    console.log(`🔗 Commit: ${commitMessage}`);

    return true;

  } catch (error) {
    console.error('❌ Git deployment failed:', error.message);
    process.exit(1);
  }
}

// Auto-deploy after build
function postBuildDeploy() {
  console.log('🏗️  Build completed, checking for deployment...');
  const deployed = gitAddCommitPush();
  if (deployed) {
    console.log('✅ Build and deploy cycle completed!');
  }
}

// Watch mode deployment (for development)
function watchAndDeploy() {
  console.log('👀 Starting watch mode with auto-deployment...');
  console.log('💡 Changes will be automatically committed and pushed');

  // Initial deploy check
  gitAddCommitPush();

  // Set up file watcher for continuous deployment
  const watchDir = path.join(__dirname, '..');
  console.log(`📁 Watching directory: ${watchDir}`);

  // Simple polling-based watcher (more reliable than fs.watch for large projects)
  let lastStatus = checkGitStatus();
  setInterval(() => {
    const currentStatus = checkGitStatus();
    if (currentStatus !== lastStatus && currentStatus.trim()) {
      console.log('🔄 Changes detected, deploying...');
      gitAddCommitPush();
      lastStatus = currentStatus;
    }
  }, 5000); // Check every 5 seconds

  console.log('⏰ Auto-deployment watcher active (checks every 5 seconds)');
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'watch':
    watchAndDeploy();
    break;
  case 'post-build':
    postBuildDeploy();
    break;
  default:
    gitAddCommitPush();
    break;
}
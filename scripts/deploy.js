#!/usr/bin/env node

const { execSync } = require('child_process');

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

function gitAddCommitPush() {
  try {
    // Check if there are any changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status.trim()) {
      console.log('📋 No changes to commit');
      return;
    }

    console.log('🚀 Starting automatic git deployment...');

    // Add all changes
    runCommand('git add .', 'Adding files to git');

    // Get current date/time for commit message
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');
    const commitMessage = `Auto-deploy: ${timestamp}`;

    // Commit changes
    runCommand(`git commit -m "${commitMessage}"`, 'Committing changes');

    // Push to remote
    runCommand('git push origin main', 'Pushing to remote repository');

    console.log('🎉 Deployment completed successfully!');
    console.log('📦 Vercel auto-deployment should trigger now...');

  } catch (error) {
    console.error('❌ Git deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment
gitAddCommitPush();
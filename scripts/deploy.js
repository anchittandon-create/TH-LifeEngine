const { execSync } = require('child_process');

const fs = require('fs');

const path = require('path');

function deploy() {

  console.log('Deploying to Vercel...');

  try {

    // Build the project

    execSync('npm run build', { stdio: 'inherit' });

    // Deploy to Vercel

    execSync('vercel --prod', { stdio: 'inherit' });

    console.log('Deployment successful!');

  } catch (error) {

    console.error('Deployment failed:', error.message);

    process.exit(1);

  }

}

if (require.main === module) {

  deploy();

}

module.exports = { deploy };
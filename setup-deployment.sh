#!/bin/bash

echo "🚀 Setting up TH+ LifeEngine Auto-Deployment"
echo "=========================================="

# Check if git is initialized
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Git repository not found. Please initialize git first."
    exit 1
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  No remote origin found. Please set up your GitHub repository:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo "   git push -u origin main"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Please create it with your GOOGLE_API_KEY"
    echo "   cp .env.example .env.local"
    echo "   # Edit .env.local with your actual API key"
fi

# Make deploy script executable
chmod +x scripts/deploy.js

echo "✅ Auto-deployment setup complete!"
echo ""
echo "📋 Available commands:"
echo "   npm run dev:auto     - Start dev server with auto-deployment"
echo "   npm run build:deploy - Build and deploy automatically"
echo "   npm run deploy       - Manual deployment"
echo ""
echo "🔄 Auto-deployment will trigger Vercel builds on every git push"
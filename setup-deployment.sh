#!/bin/bash

echo "🚀 TH+ LifeEngine - Vercel Deployment Setup"
echo "==========================================="

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - TH+ LifeEngine"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel@latest
    echo "✅ Vercel CLI installed"
else
    echo "✅ Vercel CLI already installed"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Run: vercel login"
echo "2. Run: vercel --prod"
echo "3. Follow the prompts to deploy"
echo ""
echo "📝 Alternative: Use GitHub + Vercel web interface"
echo "1. Push this repo to GitHub"
echo "2. Connect GitHub repo to Vercel at vercel.com"
echo "3. Auto-deploy from GitHub"
echo ""
echo "🌐 Your app will be accessible at:"
echo "   https://[project-name].vercel.app/application/TH_LifeEngine/"
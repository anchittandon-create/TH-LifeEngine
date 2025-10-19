#!/bin/bash

# Quick Vercel Deployment Script for TH+ LifeEngine

echo "🚀 Starting deployment to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "Your app will be available at: https://[your-project-name].vercel.app/application/TH_LifeEngine/"
echo ""
echo "To set up a custom domain:"
echo "1. Go to your Vercel dashboard"
echo "2. Navigate to your project settings"
echo "3. Go to Domains section"
echo "4. Add your custom domain"
echo "5. Update NEXT_PUBLIC_BASE_URL environment variable"
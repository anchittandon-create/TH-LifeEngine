#!/bin/bash

echo "Setting up Vercel GitHub Actions Integration"
echo "============================================"
echo ""

# Get Vercel token
echo "1. Get your Vercel Token:"
echo "   - Go to https://vercel.com/account/tokens"
echo "   - Create a new token"
echo "   - Copy the token"
echo ""

# Get Org ID
echo "2. Get your Vercel Org ID:"
echo "   - Run: vercel whoami"
echo "   - Copy the 'id' field from the output"
echo ""

# Get Project ID
echo "3. Get your Vercel Project ID:"
echo "   - Run: cat .vercel/project.json"
echo "   - Copy the 'projectId' field"
echo ""

echo "4. Add these secrets to GitHub:"
echo "   - Go to your GitHub repo: https://github.com/AT-2803/TH_LifeEngine/settings/secrets/actions"
echo "   - Add these secrets:"
echo "     * VERCEL_TOKEN: [your-vercel-token]"
echo "     * VERCEL_ORG_ID: [your-org-id]"
echo "     * VERCEL_PROJECT_ID: [your-project-id]"
echo ""

echo "Current Vercel Project Info:"
cat .vercel/project.json

echo ""
echo "Once secrets are added, every push to main branch will auto-deploy to Vercel!"
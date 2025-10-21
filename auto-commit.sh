#!/bin/bash

# Auto-commit and push script for LifeEngine
# Usage: ./auto-commit.sh "commit message"

if [ $# -eq 0 ]; then
    echo "Usage: $0 \"commit message\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo "🔄 Auto-committing changes..."

# Check if there are changes to commit
if git diff --quiet && git diff --staged --quiet; then
    echo "✅ No changes to commit"
    exit 0
fi

# Add all changes
git add -A

# Set Git user config for commits
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

# Commit with the provided message
git commit -m "$COMMIT_MESSAGE"

# Push to main branch
git push origin main

echo "✅ Changes committed and pushed successfully!"
echo "🚀 Vercel will auto-deploy the changes shortly."
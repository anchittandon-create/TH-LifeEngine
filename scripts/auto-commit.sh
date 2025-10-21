#!/bin/bash

# Auto-commit and push script for TH_LifeEngine
# This script commits and pushes all changes automatically

set -e

echo "🔄 Starting auto-commit process..."

# Check if there are changes
if [[ -z $(git status -s) ]]; then
  echo "✅ No changes to commit"
  exit 0
fi

# Add all changes
echo "📝 Adding all changes..."
git add -A

# Create commit message with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="Auto-commit: ${TIMESTAMP}"

# Commit changes
echo "💾 Committing changes..."
git commit -m "${COMMIT_MSG}" || {
  echo "⚠️  Commit failed or no changes to commit"
  exit 0
}

# Push to remote
echo "🚀 Pushing to remote..."
git push origin main || {
  echo "❌ Push failed"
  exit 1
}

echo "✅ Auto-commit completed successfully"

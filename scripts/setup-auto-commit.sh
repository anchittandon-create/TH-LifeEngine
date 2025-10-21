#!/bin/bash

# Setup auto-commit hooks for TH_LifeEngine

set -e

echo "🔧 Setting up auto-commit system..."

# Make scripts executable
chmod +x scripts/auto-commit.sh
chmod +x scripts/watch-and-commit.sh

# Setup git hooks
if [ ! -f .git/hooks/post-commit ]; then
  echo "📝 Creating post-commit hook..."
  cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
set -e
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🚀 Auto-pushing to $BRANCH..."
git push origin "$BRANCH" 2>/dev/null || echo "⚠️  Push will retry later"
EOF
  chmod +x .git/hooks/post-commit
fi

# Install fswatch if not present (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
  if ! command -v fswatch &> /dev/null; then
    echo "📦 Installing fswatch..."
    brew install fswatch || echo "⚠️  Please install fswatch manually: brew install fswatch"
  fi
fi

echo "✅ Auto-commit system setup complete!"
echo ""
echo "📖 Usage:"
echo "  npm run auto-commit      # Manual commit and push"
echo "  npm run watch:commit     # Auto-commit on file changes"
echo "  npm run dev:watch        # Dev server + auto-commit"
echo ""
echo "💡 The post-commit hook will auto-push all commits to git"

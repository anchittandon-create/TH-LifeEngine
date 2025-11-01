#!/bin/bash

# Watch for file changes and auto-commit
# Uses fswatch (install: brew install fswatch on macOS)

set -e

WATCH_DIR="/Users/Anchit.Tandon/Desktop/AI HUSTLE - APPS/TH-LifeEngine"
SCRIPT_DIR="$WATCH_DIR/scripts"

echo "👀 Watching for changes in: $WATCH_DIR"
echo "🔄 Will auto-commit on file changes..."

# Check if fswatch is installed
if ! command -v fswatch &> /dev/null; then
    echo "⚠️  fswatch not found. Installing..."
    brew install fswatch
fi

# Debounce timer (seconds)
DEBOUNCE=5
last_run=0

# Watch for changes and trigger auto-commit
fswatch -o "$WATCH_DIR" \
  --exclude=".git" \
  --exclude="node_modules" \
  --exclude=".next" \
  --exclude="*.log" | while read change; do
    current_time=$(date +%s)
    time_diff=$((current_time - last_run))
    
    if [ $time_diff -gt $DEBOUNCE ]; then
        echo "📝 Changes detected, running auto-commit..."
        bash "$SCRIPT_DIR/auto-commit.sh"
        last_run=$current_time
    fi
done

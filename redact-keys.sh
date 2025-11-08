#!/bin/bash

# Redact API Keys from Documentation Files
# This script removes all traces of exposed API keys from markdown files

echo "🔒 Starting API key redaction..."

# Find all markdown files (excluding git and node_modules)
FILES=$(find . -name "*.md" -type f -not -path "./.git/*" -not -path "./node_modules/*")

# Counter for modified files
MODIFIED=0

for file in $FILES; do
  # Check if file contains any key fragments
  if grep -q "sk-proj-UepP92Uw\|AIzaSyA3VncwHTUdilIbn" "$file"; then
    echo "📝 Redacting keys in: $file"
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Redact OpenAI keys (any variation)
    sed -i '' 's/sk-proj-UepP92Uw[A-Za-z0-9_-]*/sk-proj-***[REDACTED]***/g' "$file"
    
    # Redact Google API keys (any variation)
    sed -i '' 's/AIzaSyA3VncwHTUdilIbn[A-Za-z0-9_-]*/AIzaSy***[REDACTED]***/g' "$file"
    
    # Remove backup if successful
    rm "$file.backup"
    
    MODIFIED=$((MODIFIED + 1))
  fi
done

echo ""
echo "✅ Redaction complete!"
echo "📊 Modified $MODIFIED files"
echo ""
echo "🔍 Verifying redaction..."

# Verify no keys remain
if grep -r "sk-proj-UepP92Uw\|AIzaSyA3VncwHTUdilIbn" --include="*.md" . 2>/dev/null | grep -v ".git"; then
  echo "⚠️  WARNING: Some key fragments still found!"
  exit 1
else
  echo "✅ No exposed keys found - all clear!"
fi

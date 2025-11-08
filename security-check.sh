#!/bin/bash

# Security Check Script for TH-LifeEngine
# Scans for exposed API keys before committing

echo "🔍 Scanning for exposed API keys..."
echo ""

# Check for OpenAI keys
echo "Checking for OpenAI keys (sk-proj-, sk-)..."
OPENAI_KEYS=$(git diff --cached | grep -iE "sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}" | grep -v "sk-proj-YOUR\|sk-proj-xxx\|sk-YOUR")
if [ -n "$OPENAI_KEYS" ]; then
    echo "🚨 ERROR: OpenAI API key detected in staged files!"
    echo "$OPENAI_KEYS"
    exit 1
fi
echo "✅ No OpenAI keys found"

# Check for Google API keys
echo "Checking for Google API keys (AIzaSy)..."
GOOGLE_KEYS=$(git diff --cached | grep -iE "AIzaSy[A-Za-z0-9_-]{33}" | grep -v "AIzaSy\*\*\*\|AIzaSy-YOUR")
if [ -n "$GOOGLE_KEYS" ]; then
    echo "🚨 ERROR: Google API key detected in staged files!"
    echo "$GOOGLE_KEYS"
    exit 1
fi
echo "✅ No Google keys found"

# Check for Vercel tokens
echo "Checking for Vercel tokens (vck_)..."
VERCEL_KEYS=$(git diff --cached | grep -iE "vck_[A-Za-z0-9]{24,}")
if [ -n "$VERCEL_KEYS" ]; then
    echo "🚨 ERROR: Vercel token detected in staged files!"
    echo "$VERCEL_KEYS"
    exit 1
fi
echo "✅ No Vercel tokens found"

# Check for generic secrets
echo "Checking for generic secret patterns..."
GENERIC_SECRETS=$(git diff --cached | grep -iE "password\s*=\s*['\"][^'\"]{8,}|secret\s*=\s*['\"][^'\"]{8,}|token\s*=\s*['\"][^'\"]{20,}" | grep -v "YOUR\|xxx\|PLACEHOLDER")
if [ -n "$GENERIC_SECRETS" ]; then
    echo "⚠️  WARNING: Potential secret detected in staged files!"
    echo "$GENERIC_SECRETS"
    echo "Please review carefully before committing."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo "✅ No generic secrets found"

echo ""
echo "✅ All security checks passed!"
echo "Safe to commit."
exit 0

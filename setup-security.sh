#!/bin/bash

echo "🔒 Setting up TH-LifeEngine Security Configuration"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Google Gemini AI API Key
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE

# Vercel Blob Storage (for file uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_YOUR_TOKEN_HERE

# Vercel API Key (for deployments)
VERCEL_API_KEY=vck_YOUR_VERCEL_API_KEY_HERE

# Optional: Next.js telemetry
NEXT_TELEMETRY_DISABLED=1
EOL
    echo "✅ .env file created"
else
    echo "⚠️  .env file already exists"
fi

# Set proper permissions
echo "🔐 Setting secure file permissions..."
chmod 600 .env
echo "✅ .env permissions set to 600 (read/write for owner only)"

# Check if .env is properly ignored
if grep -q "^\.env$" .gitignore; then
    echo "✅ .env is properly ignored in .gitignore"
else
    echo "⚠️  Adding .env to .gitignore"
    echo ".env" >> .gitignore
fi

echo ""
echo "🚨 SECURITY REMINDERS:"
echo "1. NEVER commit .env file to git"
echo "2. Replace YOUR_GOOGLE_API_KEY_HERE with your actual API key"
echo "3. Keep your API keys secure and rotate them regularly"
echo "4. Use environment variables in production (Vercel, Netlify, etc.)"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file: nano .env"
echo "2. Add your Google API key"
echo "3. Test the application: npm run dev"
echo ""
echo "🔒 Security setup complete!"
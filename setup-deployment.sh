#!/bin/bash

echo "Setting up deployment..."

# Install Vercel CLI if not installed

if ! command -v vercel &> /dev/null; then

  npm install -g vercel

fi

# Login to Vercel

vercel login

# Link project

vercel link

echo "Deployment setup complete!"
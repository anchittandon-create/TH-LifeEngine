#!/bin/bash

echo "Setting up Vercel and GitHub integration..."

# Create GitHub Actions workflow

mkdir -p .github/workflows

cat > .github/workflows/deploy.yml << EOF

name: Deploy to Vercel

on:

  push:

    branches:

      - main

jobs:

  deploy:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v2

      - uses: amondnet/vercel-action@v20

        with:

          vercel-token: \${{ secrets.VERCEL_TOKEN }}

          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}

          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}

          working-directory: ./

EOF

echo "GitHub Actions workflow created!"
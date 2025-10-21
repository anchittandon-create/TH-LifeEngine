#!/bin/bash

echo "Auto-committing changes..."

git add .

git commit -m "Auto-commit"

git push

echo "Changes committed and pushed!"
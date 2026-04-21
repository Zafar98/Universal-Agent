#!/bin/bash
# Efficient deploy script for Universal-Agent
set -e

echo "--- Pulling latest code from GitHub ---"
git pull

echo "--- Installing/updating dependencies ---"
npm install

echo "--- Building project ---"
npm run build

echo "--- Restarting server (pm2) ---"
pm2 restart all || true

echo "--- Deploy complete! ---"

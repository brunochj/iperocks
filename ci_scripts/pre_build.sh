#!/bin/sh
set -e

echo "Building web assets..."
npm run build

echo "Syncing Capacitor..."
npx cap sync ios

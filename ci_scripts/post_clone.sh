#!/bin/sh
set -e

echo "Installing npm dependencies..."
npm ci

echo "Syncing Capacitor plugins to iOS..."
npx cap sync ios

#!/bin/bash
# One-time setup on your Mac: adds the standard Expo files and installs the right package versions.
set -e
cd "$(dirname "$0")"
if [ ! -f package.json ]; then
  TMP=$(mktemp -d)
  echo "Creating a fresh Expo template to copy the base files from..."
  npx --yes create-expo-app@latest "$TMP/app" --template blank-typescript --no-install
  for f in package.json tsconfig.json index.ts .gitignore; do
    [ -e "$f" ] || cp "$TMP/app/$f" .
  done
  rm -rf "$TMP"
fi
npm pkg set name=bubble-bases
npm pkg set scripts.build:game="node scripts/build-game.js"
npm install
npx expo install react-native-webview @react-native-async-storage/async-storage expo-status-bar
node scripts/build-game.js
echo ""
echo "Done. Try it:   npx expo start      (scan the QR code with the Expo Go app on your iPhone)"
echo "Then build:     eas build --platform ios --profile production"
echo "And upload:     eas submit --platform ios --latest"

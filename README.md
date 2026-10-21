# Bubble Bases: iPhone app

The game lives in `game/game.html` (the same file as the web prototype).
`npm run build:game` turns it into `game/gameHtml.ts`, which the app shows full-screen and offline.
Settings and scores are saved on the phone through the app (AsyncStorage).

Version 1.0 shows free content only (Gummy Bears, 3 levels, blue/green/purple, scoreboard).
That is controlled by `RELEASE = 'app-1.0'` in `App.tsx`.

## First time on your Mac (about 15 minutes)

1. Unzip this folder somewhere, open Terminal in it.
2. Run `./setup.sh` (adds the standard Expo files and installs matching versions).
3. Try it on your iPhone: `npx expo start`, scan the QR code with the **Expo Go** app.
4. Check the bundle ID in `app.json` (`com.churilov.bubblebases`). Change it now if you want something else. It can't change after the first upload.

## Build and upload

5. `npm install -g eas-cli` (skip if you have it from the VVe app), then `eas login`.
6. `eas init` (links the project to your Expo account; say yes to creating it).
7. `eas build --platform ios --profile production`
   EAS asks to log in to your Apple Developer account and creates the certificates for you. Accept the defaults.
8. In App Store Connect → Apps → **+ New App**: platform iOS, name "Bubble Bases", language English, bundle ID from step 4, SKU `bubblebases`.
9. `eas submit --platform ios --latest` uploads the build. It shows up in TestFlight after ~10–30 minutes of processing.
10. Test it through TestFlight on your phone (and your son's).
11. Fill in the App Store page with `store-assets/app-store-text.md` and the 4 screenshots, pick the build, then **Add for Review**.

## Changing the game later

Edit `game/game.html` → `npm run build:game` → `npx expo start` to test → bump `"version"` in `app.json` (e.g. 1.1.0) → build and submit again.

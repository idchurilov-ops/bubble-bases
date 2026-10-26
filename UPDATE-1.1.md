# Bubble Bases 1.1: sound, new worlds, Full Pack subscription

## What changed
- **Sound:** tap clicks, sounds for send/capture/lose, win and lose jingles, and an original galloping battle theme. All made by the app itself. On/off switches are on the start screen, and there's a ♪ button in the top bar.
- **New worlds:** Lev's Set (9 drawings), Puppies (6), Unicorns (6). Pick one character per game, each with its own background.
- **9 languages:** English, German, Spanish, French, Italian, Portuguese, Russian, Turkish and Chinese. The game follows the iPhone's language, and there's a language picker on the start screen.
- **Full Pack:** a yearly auto-renewing subscription that unlocks all 8 extra worlds and all colours. It includes Subscribe, Restore purchases, and the terms and links Apple requires.
- Changed files: `App.tsx`, `game/game.html`, `game/gameHtml.ts`, `store-assets/*`

## 1. Put the files into your project
Unzip this package and copy its contents into `~/Desktop/bubble-bases-app`, replacing the old files. Then, in Terminal:
```bash
cd ~/Desktop/bubble-bases-app
npx expo install react-native-purchases
node -e 'const f="app.json",fs=require("fs"),j=JSON.parse(fs.readFileSync(f));j.expo.version="1.1.0";j.expo.ios=j.expo.ios||{};j.expo.ios.infoPlist=Object.assign(j.expo.ios.infoPlist||{},{CFBundleLocalizations:["en","de","es","fr","it","pt","ru","tr","zh-Hans"],CFBundleAllowMixedLocalizations:true});fs.writeFileSync(f,JSON.stringify(j,null,2)+"\n")'
```
(Don't replace your own app.json. The second command only sets the version to 1.1.0 and lists the 9 languages, so the iPhone and the App Store know the game speaks them.)

## 2. App Store Connect: get paid
1. **Business** (or Agreements, Tax, and Banking) → **Paid Apps**: accept the agreement, add your bank account, and fill in the tax forms. Wait until it shows **Active**.
2. **Your app → Monetization → Subscriptions**: create the group and the yearly subscription using the details in `store-assets/app-store-text.md`.
3. **Users and Access → Integrations → In-App Purchase**: generate a key. Download the `.p8` file and note the **Key ID** and **Issuer ID**.

## 3. RevenueCat: checks the subscription (free while small)
1. Sign up at revenuecat.com and create the project **Bubble Bases**.
2. Add an **App Store** app with bundle ID `com.churilov.bubblebases`, and upload the In-App Purchase key (.p8, Key ID, Issuer ID).
3. **Products**: add `bubblebases.fullpack.yearly`.
4. **Entitlements**: use `bubble_bases_pro` (made by the RevenueCat setup wizard) and attach the product.
5. **Offerings**: the default offering gets one package of type **Annual** with the product.
6. **API keys**: copy the App Store key (starts with `appl_`) and paste it into `App.tsx` in place of `appl_REPLACE_WITH_YOUR_KEY`.

## 4. Build and test
```bash
git add -A
git commit -m "Bubble Bases 1.1"
git push
```
Then go to expo.dev → bubble-bases → Builds → **Build from GitHub** (iOS, production, main), and after it finishes:
```bash
npx eas-cli@latest submit --platform ios --latest
```
Test in **TestFlight**. Expo Go can't make purchases. TestFlight purchases are free test purchases, and a yearly subscription renews every hour there so you can see renewals. Check that:
- music and sounds play, and the switches work
- Lev's Set, Puppies and Unicorns are locked, then unlock after Subscribe
- Restore purchases works after deleting and reinstalling the app

## 5. Send to the App Store
1. If 1.0 was never released, rename the version in App Store Connect to **1.1**. Otherwise create a new version, **1.1**.
2. Select the new build, and paste the What's New text and the updated description. Add the 3 new screenshots.
3. In the **In-App Purchases and Subscriptions** section of the version, add the Full Pack subscription. A first subscription must be reviewed together with an app version.
4. Update **App Privacy** as described in app-store-text.md.
5. Click **Add for Review** → **Submit**.

Apple only approves subscriptions that keep giving value, so keep adding new sets during the year (Lev's next drawings!) and mention that in your review notes.

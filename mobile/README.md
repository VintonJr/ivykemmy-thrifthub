# IvyKemmy ThriftHub phone app

The Android and iOS app is a native shell ([Capacitor](https://capacitorjs.com)) around the live shop at
https://ivykemmy-thrifthub.vercel.app. It opens the shop full screen with the IvyKemmy icon and splash screen,
so every change to the website (new listings, prices, checkout, admin) shows up in the app straight away
with no app update.

What the app adds over the website:

- An icon on the home screen and a branded splash screen (lilac background, IvyKemmy logo).
- Paystack checkout (M-Pesa and card) stays inside the app, then returns to the order page.
- Call and WhatsApp links open the phone's dialer and WhatsApp.
- The Android back button goes back a page, and exits from the first page.
- A branded "can't reach the shop" page with a Try again button when there is no data.
- The shop can tell it is running in the app: the browser user agent ends in `IvyKemmyApp`.

## Getting the Android app

Every change to `mobile/` on GitHub builds a test APK automatically:

1. Open the repository's **Actions** tab, then the latest **Android app** run.
2. Download **IvyKemmy-ThriftHub-test-apk** at the bottom of the page and unzip it.
3. Copy `app-debug.apk` to an Android phone and open it. Android asks to allow installs from that app once.

To build again without a code change, open **Actions**, pick **Android app**, and press **Run workflow**.

## Publishing on Google Play

1. Create a Google Play developer account (one-off USD 25) at https://play.google.com/console.
2. Make an upload key once, on any computer with Java:
   `keytool -genkeypair -v -keystore upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
   Keep `upload.jks` and its passwords safe; Play needs the same key for every update.
3. In GitHub, Settings, Secrets and variables, Actions, add:
   - `ANDROID_KEYSTORE_BASE64`: the file encoded with `base64 -w0 upload.jks`
   - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`upload`), `ANDROID_KEY_PASSWORD`
4. Run the **Android app** workflow on `main`. It then also produces **IvyKemmy-ThriftHub-play-store-bundle** (`app-release.aab`),
   which you upload in Play Console.

## iOS

The Xcode project is in `ios/`. Building it needs a Mac with Xcode and an Apple developer account (USD 99 a year):
run `npm install && npx cap sync ios && npx cap open ios` in this folder, then archive and upload from Xcode.
Apple reviews apps that mostly show a website more strictly than Google, so plan Android first.

## Working on the app

```bash
cd mobile
npm install
npx cap sync          # after changing capacitor.config.json or plugins
npx cap open android  # opens Android Studio
```

- `capacitor.config.json`: app id (`com.ivykemmy.thrifthub`), name, the shop address, and which sites may open inside the app.
- `www/offline.html`: the page shown when the shop can't be reached.
- New logo: replace `../public/icon-512.png`, then run `node make-assets.mjs && npm run icons` to rebuild the icons and splash screens.

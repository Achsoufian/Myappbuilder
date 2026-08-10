# Stockify Soufian — Android build

This is a Capacitor project. The native app loads your **live site**
(`https://stockifysoufian.netlify.app`) inside a real Android WebView shell —
same origin, so your login, session cookie, and password-reset function work
with zero backend changes.

You'll need on your own machine: **Node.js 18+** and **Android Studio**
(with its Android SDK) — every native-build route needs these two, there's
no way around installing them locally.

## 1. Install and add the Android platform

```bash
npm install
npx cap add android
npx cap sync android
```

`cap add android` generates the actual `android/` Gradle project — it
downloads the Capacitor Android runtime, so run this with internet on.

## 2. Grant camera permission (needed for barcode scanning)

Open `android/app/src/main/AndroidManifest.xml` and add, just above
`<application>`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

Capacitor's WebView automatically forwards the browser's camera permission
prompt to Android's runtime permission dialog — no extra plugin needed for
your existing `getUserMedia`-based scanner in `script.js`.

## 3. App icon (optional but recommended)

Replace the default Capacitor icon with yours:

```bash
npx @capacitor/assets generate --android --iconBackgroundColor '#4361ee' --iconBackgroundColorDark '#1a1a2e'
```

Point it at `www/icon-512.png` (already copied into this project) when it
asks for a source icon, or drop your own into `resources/icon.png` first.

## 4. Build and run

```bash
npx cap open android
```

This opens Android Studio. From there:
- **Run ▶** on an emulator/device to test
- **Build → Generate Signed Bundle / APK** to produce a real signed APK
  (Android Studio walks you through creating a keystore the first time —
  keep that `.jks` file safe, you need the same one for every future update)

## Notes

- `capacitor.config.json` → `server.url` is what makes this different from
  a generic WebView wrapper: it's real native chrome (splash screen, status
  bar color, back-button handling, no browser address bar) around your
  actual live app, not a bundled snapshot that could drift out of date.
- If you ever want a fully offline-first build instead (bundling
  `index.html`/`script.js`/etc. straight into the APK), that's possible too,
  but it requires adding CORS headers + `SameSite=None; Secure` to the
  cookie in `netlify/functions/auth.mjs`, since the app would then run from
  a different origin than your API. Say the word and I'll make those
  changes.
- `webContentsDebuggingEnabled` is off for the release build; flip it to
  `true` temporarily if you need to inspect the WebView via
  `chrome://inspect`.

## Building via GitHub Actions (no local Android Studio needed)

This project includes `.github/workflows/build-apk.yml`, which builds the
APK in the cloud on every push and hands you back a downloadable file.
Nothing on your Netlify site needs to change for this — the app just
loads your live URL same-origin, same as opening it in a browser.

1. Create a new **empty** GitHub repo (don't initialize it with a README)
2. Push this folder to it:
   ```bash
   cd stockify-android
   git init
   git add .
   git commit -m "Initial Android build"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
3. Go to the **Actions** tab on your repo — a "Build Android APK" run
   starts automatically (takes 3-5 minutes)
4. When it finishes, open the run → scroll to **Artifacts** →
   download `stockify-soufian-debug-apk` — that's a zip containing
   `app-debug.apk`
5. Transfer the APK to your phone and install it (Android will ask you to
   allow installs from that source the first time)

This produces a **debug-signed APK** — installable and fully testable,
but not suitable for the Play Store (which requires a release build
signed with your own permanent keystore). Say the word if you want that
too and I'll add a signing step using GitHub Secrets for the keystore.


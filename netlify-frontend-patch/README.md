# Fixing Excel export — safe, frontend-only change

This does **not** touch `auth.mjs`, login, sessions, or anything backend —
it only adds one new JS file and one `<script>` tag to your site's HTML.
Nothing about your website changes for regular browser visitors; the file
only activates when it detects it's running inside the native Android app.

## Steps

1. Upload `capacitor-xlsx-shim.js` (in this folder) to your Netlify site,
   in the same folder as your existing `script.js` / `auth-bridge.js`.

2. Open your site's `index.html` and find this line:
   ```html
   <script src="script.js"></script>
   ```
   Add the new file **right before** it:
   ```html
   <script src="capacitor-xlsx-shim.js"></script>
   <script src="script.js"></script>
   ```

3. Redeploy your Netlify site (however you normally do — push to your
   repo, or drag-and-drop redeploy).

4. Push this whole `stockify-android` project folder to your
   `Myappbuilder` GitHub repo again (this adds the icon + status bar
   fixes) and let the Actions build run.

That's it — next APK build will have your real icon, the fixed status
bar, and working Excel export/share.

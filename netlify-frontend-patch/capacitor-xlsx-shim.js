/*
 * Fixes Excel export inside the Android app.
 *
 * In a real browser, XLSX.writeFile() triggers a normal file download.
 * Inside an embedded WebView (the Android app) there's no download
 * manager to catch that, so it silently does nothing even though the
 * app's own success message still shows.
 *
 * This patches XLSX.writeFile to, ONLY when running inside the native
 * app, save the file via Capacitor's Filesystem plugin and then open
 * Android's native "Save/Share" sheet so the user can save it wherever
 * they want. On the regular website this file does nothing at all —
 * it only activates inside the native app, so it's safe to load
 * everywhere.
 */
(function () {
  function isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  if (!isNativeApp()) return;

  function patch() {
    if (typeof XLSX === 'undefined' || !XLSX.writeFile || XLSX.writeFile.__stockifyPatched) return;

    const originalWriteFile = XLSX.writeFile.bind(XLSX);

    const patched = function (workbook, filename, opts) {
      try {
        const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        const plugins = window.Capacitor && window.Capacitor.Plugins;
        const Filesystem = plugins && plugins.Filesystem;
        const Share = plugins && plugins.Share;

        if (!Filesystem) {
          console.warn('Filesystem plugin unavailable, falling back to browser download.');
          return originalWriteFile(workbook, filename, opts);
        }

        Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: 'DOCUMENTS',
          recursive: true,
        }).then((result) => {
          if (Share && result && result.uri) {
            Share.share({
              title: filename,
              url: result.uri,
              dialogTitle: 'Save or share ' + filename,
            }).catch(() => {
              // Share sheet dismissed or unavailable — file is still saved.
            });
          }
        }).catch((err) => {
          console.error('Native Excel save failed, falling back to browser download:', err);
          originalWriteFile(workbook, filename, opts);
        });
      } catch (err) {
        console.error('Excel export shim error, falling back to browser download:', err);
        originalWriteFile(workbook, filename, opts);
      }
    };

    patched.__stockifyPatched = true;
    XLSX.writeFile = patched;
  }

  // XLSX loads from a CDN script tag; poll briefly until it's ready
  // rather than assuming load order.
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (typeof XLSX !== 'undefined') {
      patch();
      clearInterval(timer);
    } else if (attempts > 50) {
      clearInterval(timer);
    }
  }, 100);
})();

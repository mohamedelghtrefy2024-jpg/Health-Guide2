// app.js — Application Bootstrap / Wiring only (Phase 1 hardening).
// All logic previously here now lives under js/core, js/graph, js/ui, js/data, js/qa —
// each file below is an *exact* line-range extraction from the original monolithic app.js
// (verified byte-identical on reconstruction). This loader preserves the EXACT original
// top-to-bottom execution order using the documented `script.async = false` technique:
// browsers may download these files in parallel, but will execute them strictly in the
// order they were appended -- identical behavior to one big file, just split on disk.
(function () {
  var modules = [
    'js/data/data-normalizer.js',
    'js/ui/ui-components.js',
    'js/ui/ui-header-controls.js',
    'js/ui/ui-node-detail.js',
    'js/data/data-storage.js',
    'js/graph/graph-render.js',
    'js/graph/graph-analysis.js',
    'js/ui/ui-stats-panel.js',
    'js/ui/ui-edit-mode.js',
    'js/ui/ui-markdown-and-toggles.js',
    'js/ui/ui-reading-and-tabs.js',
    'js/ui/ui-compare-and-tools.js',
    'js/ui/ui-bookmarks.js',
    'js/core/core-deep-linking.js',
    'js/ui/ui-investigation.js',
    'js/ui/ui-command-palette.js',
    'js/ui/ui-mobile-swipe.js',
    'js/core/core-boot-init.js',
    'js/qa/qa-runner.js'
  ];
  modules.forEach(function (src) {
    var s = document.createElement('script');
    s.src = src;
    s.async = false; // keeps execution order == array order, regardless of download order
    s.onerror = function () { window.__moduleLoadErrors = window.__moduleLoadErrors || []; window.__moduleLoadErrors.push(src); console.error('فشل تحميل الوحدة:', src); };
    document.body.appendChild(s);
  });
})();

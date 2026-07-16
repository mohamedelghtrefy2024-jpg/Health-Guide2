// js/ui/ui-components.js — Real Component Library (Phase 2).
// Loaded LAST among UI files so it is available to any module needing it,
// but it defines NO auto-running logic and touches NO existing DOM at load
// time -- it only exposes `window.UI` helpers. Nothing in the app currently
// calls into this file yet: this is the shared contract other extraction
// groups will migrate to incrementally, one duplicated pattern at a time,
// per the Migration Rule (no Big-Bang rewrite of existing call sites).
//
// ---- Component: Button ----
// Purpose: consistent button markup for dynamically-generated (innerHTML) UI.
// Variants: "primary" | "default" (mirrors existing .analysis-primary-btn /
//   .analysis-tools-btn classes already in index.html -- no new classes invented).
// Sizes: n/a (single size in the current design system).
// States: default, disabled.
// Markup Contract: returns an HTML string: <button class="..." ...>label</button>
// CSS Contract: reuses existing classes only (.analysis-primary-btn / .analysis-tools-btn);
//   does not introduce new CSS.
// Accessibility Contract: forwards `title`/`ariaLabel` to title/aria-label attributes.
// Usage Rules: for NEW dynamically-generated buttons only. Existing single-purpose
//   inline buttons (e.g. hub-expand-btn, source-remove-btn) are intentionally left
//   as-is -- they are not duplicates of each other and unifying them would add an
//   API layer without removing any real duplication (see hardening prompt's
//   "no theoretical components" rule).
window.UI = window.UI || {};

window.UI.Button = function (opts) {
  opts = opts || {};
  var variant = opts.variant === 'primary' ? 'analysis-primary-btn' : 'analysis-tools-btn';
  var cls = opts.extraClass ? (variant + ' ' + opts.extraClass) : variant;
  var idAttr = opts.id ? ' id="' + opts.id + '"' : '';
  var titleAttr = opts.title ? ' title="' + opts.title + '"' : '';
  var ariaAttr = opts.ariaLabel ? ' aria-label="' + opts.ariaLabel + '"' : '';
  var disabledAttr = opts.disabled ? ' disabled' : '';
  var label = opts.label != null ? opts.label : '';
  return '<button class="' + cls + '"' + idAttr + titleAttr + ariaAttr + disabledAttr + '>' + label + '</button>';
};

// ---- Component: Modal Overlay (backdrop + panel wiring helpers) ----
// Purpose: open/close a modal that already exists in the DOM (index.html),
// unifying the two toggle mechanisms currently in use:
//   (a) classList.add/remove('show')  -- analysisOverlay / investigationOverlay / researchOverlay
//   (b) style.display = 'flex'/'none' -- newNodeOverlay
// Markup Contract: expects an element with id `overlayId` already in the DOM
//   (see the shared ".modal-overlay backdrop" CSS rule added in index.html).
// CSS Contract: relies on the existing shared backdrop rule; adds no CSS.
// Usage Rules: purely additive helper -- existing open/close code paths for the
//   4 current modals are NOT modified in this checkpoint (that would touch
//   ui-edit-mode.js / ui-compare-and-tools.js / ui-investigation.js call sites
//   and needs its own dependency/caller review first, per the Migration Rule).
//   New modals, or a future incremental migration of the existing 4, can call this.
window.UI.Modal = {
  open: function (overlayId) {
    var el = document.getElementById(overlayId);
    if (!el) return;
    if (el.classList.contains('modal-overlay') || el.className.indexOf('Overlay') === -1) {
      el.classList.add('show');
    }
    el.style.display = 'flex';
  },
  close: function (overlayId) {
    var el = document.getElementById(overlayId);
    if (!el) return;
    el.classList.remove('show');
    el.style.display = 'none';
  }
};

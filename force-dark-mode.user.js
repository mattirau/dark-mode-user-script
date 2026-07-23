// ==UserScript==
// @name         Force Dark Mode
// @namespace    matti.force-dark-mode
// @version      1.1.0
// @description  Force any website into dark mode by inverting its colors. Per-site toggle via the Tampermonkey menu or Alt+Shift+D; leaves already-dark sites alone.
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener
// ==/UserScript==

(function () {
  'use strict';

  const INVERT = 'invert(1) hue-rotate(180deg)';

  // When true, pages that already have a dark background are left alone.
  // An explicit per-site toggle (menu or Alt+Shift+D) always wins over this.
  const SKIP_ALREADY_DARK_PAGES = true;
  const DARK_LUMINANCE_THRESHOLD = 0.4; // 0 = black, 1 = white

  const HOST = location.hostname;
  const STORE_KEY = 'sites'; // { [hostname]: 'on' | 'off' }
  const AUTO_KEY = 'autoDark'; // cached detection results: { [hostname]: boolean }

  const style = document.createElement('style');
  style.textContent = `
    html {
      background-color: #fff !important;
      filter: ${INVERT} !important;
      /* Firefox: keep the window scrollbar dark to match */
      scrollbar-color: #6b6b6b #2b2b2b;
    }
    /* Flip photos, videos and canvases back so they keep their real colors */
    img, video, canvas, svg image,
    [style*="background-image"] {
      filter: ${INVERT} !important;
    }
    /* Frames run their own copy of this script, so cancel the outer invert */
    iframe {
      filter: ${INVERT} !important;
    }
  `;
  document.documentElement.appendChild(style);

  // Start from the cached result of the last visit, so already-dark sites
  // are skipped from the very first paint instead of flashing bright.
  let pageLooksDark = GM_getValue(AUTO_KEY, {})[HOST] === true;

  function siteSetting() {
    return GM_getValue(STORE_KEY, {})[HOST];
  }

  function applyState() {
    const setting = siteSetting();
    const on =
      setting === 'on' ||
      (setting === undefined && !(SKIP_ALREADY_DARK_PAGES && pageLooksDark));
    style.disabled = !on;
  }

  function setSiteSetting(value) {
    const sites = GM_getValue(STORE_KEY, {});
    if (value === undefined) delete sites[HOST];
    else sites[HOST] = value;
    GM_setValue(STORE_KEY, sites);
    applyState();
  }

  function toggle() {
    setSiteSetting(style.disabled ? 'on' : 'off');
  }

  // If the page already has a dark background, don't invert it into light mode.
  function luminanceOf(el) {
    if (!el) return null;
    const parts = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (!parts) return null;
    const [r, g, b, a = 1] = parts.map(Number);
    if (a === 0) return null; // transparent — check the next element instead
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  function checkNativeDark() {
    if (!SKIP_ALREADY_DARK_PAGES || siteSetting() !== undefined) return;
    // Measure with our own style switched off, otherwise we would read the
    // white background this script forces onto <html>. This is synchronous,
    // so the browser never paints the intermediate state.
    const wasDisabled = style.disabled;
    style.disabled = true;
    const lum = luminanceOf(document.body) ?? luminanceOf(document.documentElement);
    style.disabled = wasDisabled;
    pageLooksDark = lum !== null && lum < DARK_LUMINANCE_THRESHOLD;
    const cache = GM_getValue(AUTO_KEY, {});
    if (cache[HOST] !== pageLooksDark) {
      cache[HOST] = pageLooksDark;
      GM_setValue(AUTO_KEY, cache);
    }
    applyState();
  }

  document.addEventListener('DOMContentLoaded', checkNativeDark);
  window.addEventListener('load', checkNativeDark);

  // Live-sync toggles across tabs and frames of the same site
  GM_addValueChangeListener(STORE_KEY, () => applyState());

  if (window === window.top) {
    GM_registerMenuCommand('Toggle dark mode on this site (Alt+Shift+D)', toggle);
    GM_registerMenuCommand('Reset this site to automatic', () => setSiteSetting(undefined));
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyD') {
        toggle();
      }
    });
  }

  applyState();
})();

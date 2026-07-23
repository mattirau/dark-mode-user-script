# Force Dark Mode

A [Tampermonkey](https://www.tampermonkey.net/) userscript that forces any website into dark mode by inverting its colors, while keeping images and videos looking normal.

## Features

- **Works everywhere** — runs on every site by default, applied at `document-start` so there is no white flash while pages load.
- **Colors stay recognizable** — uses `invert(1) hue-rotate(180deg)`, so blues stay blue instead of flipping to orange.
- **Media keeps its real colors** — images, videos, canvases, and inline background images are re-inverted back to normal.
- **Skips already-dark sites** — measures the page's background luminance and leaves natively dark pages alone.
- **Per-site toggle** — press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> or use the Tampermonkey toolbar menu to force dark mode on or off for the current site. The choice is remembered per hostname and syncs live across open tabs.
- **Iframes handled** — embedded frames (e.g. YouTube embeds) run their own copy of the script, so their content is darkened correctly too.

## Installation

1. Install the [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/) extension (Firefox; also works in Chrome and other browsers with Tampermonkey).
2. Open the Tampermonkey dashboard → **Utilities** tab → **Import from file**, and select [`force-dark-mode.user.js`](force-dark-mode.user.js).
   - Alternatively: create a new empty script in the dashboard and paste in the file contents.

## Usage

| Action | How |
|---|---|
| Toggle dark mode for the current site | <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd>, or Tampermonkey menu → *Toggle dark mode on this site* |
| Forget the per-site choice (back to automatic) | Tampermonkey menu → *Reset this site to automatic* |

## Configuration

Edit the constants at the top of the script:

- `SKIP_ALREADY_DARK_PAGES` — set to `false` to invert every page regardless of its own background color.
- `DARK_LUMINANCE_THRESHOLD` — how dark a page background must be (0 = black, 1 = white) to count as "already dark".

To limit the script to a single site, change the match line in the header, e.g.:

```
// @match        *://example.com/*
```

## Troubleshooting

**White flash when a page loads.** The style is injected at `document-start`, but by default Tampermonkey may inject scripts slightly after the first paint. To fix this, open the Tampermonkey dashboard → **Settings** tab → set *Config mode* to **Advanced** → scroll to **Experimental** → set *Inject Mode* to **Instant**.

On the *first* visit to a site that is already natively dark, the page may briefly appear bright before the auto-skip detection kicks in. The result is cached per site, so subsequent visits load correctly from the first paint.

## Known limitations

The invert technique can't reach everything:

- Images inside shadow DOM, and CSS background images set from stylesheets (rather than inline `style=""` attributes), can appear color-inverted on some sites.
- Frames that Tampermonkey cannot inject into (e.g. sandboxed or `about:blank` frames) may stay light.

If a particular site looks wrong, <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> turns the script off there permanently.

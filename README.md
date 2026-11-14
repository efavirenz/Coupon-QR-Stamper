# Coupon QR Stamper

A Progressive Web App (PWA) for GitHub Pages. It turns a list of entries (up to 20) into QR codes, places each one in the white box of a template image, optionally prints the entry under the QR code, and exports one JPEG per entry (`01.jpg`, `02.jpg`, ...). Everything runs in the browser; nothing is uploaded.

## Use

1. The template defaults to `default-template.png` on every launch. Choose another image to replace it for the session.
2. Check the white box position (X, Y, Width, Height). It is detected automatically and can be edited.
3. Enter one entry per line (up to 20 entries, max 100 characters each in UTF-16 code units). Use **Show text under QR code** to include or omit the entry below each QR code (checked by default). Tick **Numbers only** to require digits only (disables Generate if non-digits are detected).
4. Tap **Generate images**, then **Save to Photos** or **Download .zip**.

> **Note on Pinch-to-Zoom**: Pinch-to-zoom is intentionally disabled on iOS Safari to ensure stable stamping and avoid layout shifting during batch operations (intentional design exception to WCAG 2.1 SC 1.4.4).

## Deploy to GitHub Pages

1. Upload every file in this folder except private/local files (`AGENTS.md`, `_NoGit/`, `reports/`, `.serena/`; these are listed in `.gitignore`).
2. Settings > Pages > Deploy from a branch > `main` / `(root)`.
3. Open the site URL in Safari on iPhone and use Share > Add to Home Screen.

## Updating the app

Tap the version badge (top right) to check for a newer version. The app compares itself with `version.json` on the server and reloads with the new files if one exists.

## Update history

### Version 1.3, Date: 2026-11-14

Changes: Scoped Cache Storage deletion to `qr-stamper-*` to eliminate cross-app cache wiping on shared GitHub Pages origins. Hardened update flow to verify assets prior to reload and prevent offline stranding. Added generation state locking and automatic stale result invalidation on input or template edits. Added box coordinate boundary enforcement and caption overflow protection with a minimum font floor. Explicitly painted solid white under QR box for reliable contrast. Hardened template image decoding error handling and enabled same-file reselection. Synchronized precache and manifest metadata (`apple-touch-icon.png`, `theme_color`). Updated "Numbers only" to disable the Generate button immediately when non-digits are present. Added keyboard navigation to the theme menu (Arrow keys, Escape focus restoration) and ARIA live feedback for issues.

### Version 1.2, Date: 2026-11-14

Changes: Prevented page pinch-zoom on mobile, added the **Show text under QR code** option (enabled by default) for preview and generated images, and made the theme menu close after selecting a theme.

### Version 1.1, Date: 2026-11-13

Changes: "Remove duplicates" and "Generate images" share one row. Added red **Clear Entries** and **Clear All** buttons with confirmation. Added version badge with update check and toast. Template always starts as `default-template.png`. Added hamburger menu with 5 bright and 5 dark themes (default: Blue Ocean). Fixed the "Entry is too long" message staying after the Width value became valid. Added README.md and AGENTS.md.

### Version 1, Date: 2026-11-13

First release: QR stamping, automatic white-box detection, manual X/Y/Width/Height, duplicate and numbers-only checks, JPEG export, .zip download, offline PWA.

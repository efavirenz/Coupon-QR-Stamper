# Coupon QR Stamper

A Progressive Web App (PWA) for GitHub Pages. It turns a list of entries (up to 20) into QR codes, places each one in the white box of a template image, prints the entry under the QR code, and exports one JPEG per entry (`01.jpg`, `02.jpg`, ...). Everything runs in the browser; nothing is uploaded.

## Use

1. The template defaults to `default-template.png` on every launch. Choose another image to replace it for the session.
2. Check the white box position (X, Y, Width, Height). It is detected automatically and can be edited.
3. Enter one entry per line. Tick **Numbers only** to require digits only.
4. Tap **Generate images**, then **Save to Photos** or **Download .zip**.

## Deploy to GitHub Pages

1. Upload every file in this folder except `AGENTS.md` (it is listed in `.gitignore`).
2. Settings > Pages > Deploy from a branch > `main` / `(root)`.
3. Open the site URL in Safari on iPhone and use Share > Add to Home Screen.

## Updating the app

Tap the version badge (top right) to check for a newer version. The app compares itself with `version.json` on the server and reloads with the new files if one exists.

## Update history

### Version 1.1, Date: 2026-11-13

Changes: "Remove duplicates" and "Generate images" share one row. Added red **Clear Entries** and **Clear All** buttons with confirmation. Added version badge with update check and toast. Template always starts as `default-template.png`. Added hamburger menu with 5 bright and 5 dark themes (default: Blue Ocean). Fixed the "Entry is too long" message staying after the Width value became valid. Added README.md and AGENTS.md.

### Version 1, Date: 2026-11-13

First release: QR stamping, automatic white-box detection, manual X/Y/Width/Height, duplicate and numbers-only checks, JPEG export, .zip download, offline PWA.

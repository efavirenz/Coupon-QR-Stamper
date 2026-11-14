# AGENTS.md (project guidance; versioned with the application)

## Project
Coupon QR Stamper: vanilla JS PWA on GitHub Pages. Current app release: **v1.2** (2026-11-14). Input: up to 20 entries plus a template image. Output: one JPEG per entry with a QR code (plain-text content) and optional entry text beneath the QR code. Owner: Tony (iPhone is the main device; communicates in Thai and English). UI language: English only. Reply to the owner in Thai unless asked otherwise.

## Decisions already made by the owner
- Entries: one per line, max 20, no fixed length (app cap 100 characters). "Numbers only" ticked: non-digit lines trigger an alert and stop generation. Unticked: any text.
- Duplicates and over-limit entries are listed with line numbers and Generate is disabled; "Remove duplicates" keeps the first occurrence.
- White box: auto-detected, editable X/Y/Width/Height. Defaults come from Blank.png / Example.png (1029x1491): box 279,963,473x495; QR 378 px, 33 px below the box top; text about 45.6 px, baseline 31 px above the box bottom.
- QR text: **Show text under QR code** is checked by default. It controls both the live preview and generated JPEG/ZIP images; unchecked means QR code only. The checkbox sits below Template image and above White box position.
- Output: JPEG quality 0.95, original template size, names 01.jpg, 02.jpg, ...
- Template is `default-template.png` on every app open. Theme menu (hamburger, top-left) closes on outside tap and immediately after selecting a theme. It has 5 bright + 5 dark themes, default Blue Ocean. Version badge (top-right) checks `version.json`. Pinch-to-zoom is disabled using viewport restrictions, CSS touch-action, and iOS Safari gesture handling.
- Clear Entries: confirm, clears textbox and status text only. Clear All: also clears result images. Neither touches template or box.

## Current release
- **v1.2** — 2026-11-14. Added mobile zoom prevention, the default-on QR text visibility checkbox for preview and generated images, and automatic theme-menu dismissal after theme selection.

## Architecture
No build step. Files: `index.html`, `style.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `version.json`, `lib/qrcode.js` (qrcode-generator 2.0.4 + UTF-8 support), `lib/jszip.min.js` (3.10.2), `icons/`, `default-template.png`. All paths relative (Project Pages live under `/repo-name/`). Libraries are self-hosted for offline use.
- QR: Numeric mode for digit-only text (21 modules, matches the example), Byte mode otherwise; error correction `EC='M'`.
- Detection: largest near-pure-white (min channel >= 254) connected region, fill ratio > 0.85, narrower than 90% of the image.
- `sw.js`: cache-first, except `version.json` which always goes to the network.

## Release checklist (every version)
1. Bump `VERSION` in `app.js`, `version` and `date` in `version.json`, cache name `C` in `sw.js`, and the badge text in `index.html`.
2. Update `files` in `version.json` and the list `A` in `sw.js` if files were added or removed.
3. Update the current version and release notes in both `AGENTS.md` and `README.md`. Add a row to the README update history.
4. Test (below), then package and deploy.

## Testing
Serve the folder (`python3 -m http.server`) and drive it with Playwright (Chromium): check detection values, duplicate list, numbers-only alert, generated JPEG against Example.png, QR decode with OpenCV `QRCodeDetector`, and no console errors. Avoid `pkill -f http.server` in a shell that contains that text.

## Known limits
- "Save to Photos" (Web Share API with files) is unverified on a real iPhone; .zip is the fallback.
- Box detection was verified on Blank.png only.
- An installed v1.0 keeps serving cached files until the new `sw.js` is fetched; open the app twice after deploying.

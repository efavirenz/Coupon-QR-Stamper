# AGENTS.md (for AI assistants; not committed to GitHub)

## Project
Coupon QR Stamper: vanilla JS PWA on GitHub Pages. Input: up to 20 entries plus a template image. Output: one JPEG per entry with a QR code (plain-text content) and the entry text placed in the template's white box. Owner: Tony (iPhone is the main device; communicates in Thai and English). UI language: English only. Reply to the owner in Thai unless asked otherwise.

## Decisions already made by the owner
- Entries: one per line, max 20, no fixed length (app cap 100 characters). "Numbers only" ticked: non-digit lines trigger an alert and stop generation. Unticked: any text.
- Duplicates and over-limit entries are listed with line numbers and Generate is disabled; "Remove duplicates" keeps the first occurrence.
- White box: auto-detected, editable X/Y/Width/Height. Defaults come from Blank.png / Example.png (1029x1491): box 279,963,473x495; QR 378 px, 33 px below the box top; text about 45.6 px, baseline 31 px above the box bottom.
- Output: JPEG quality 0.95, original template size, names 01.jpg, 02.jpg, ...
- Template is `default-template.png` on every app open. Theme menu (hamburger, top-left, closes on outside tap): 5 bright + 5 dark, default Blue Ocean. Version badge (top-right) checks `version.json`.
- Clear Entries: confirm, clears textbox and status text only. Clear All: also clears result images. Neither touches template or box.

## Architecture
No build step. Files: `index.html`, `style.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `version.json`, `lib/qrcode.js` (qrcode-generator 2.0.4 + UTF-8 support), `lib/jszip.min.js` (3.10.2), `icons/`, `default-template.png`. All paths relative (Project Pages live under `/repo-name/`). Libraries are self-hosted for offline use.
- QR: Numeric mode for digit-only text (21 modules, matches the example), Byte mode otherwise; error correction `EC='M'`.
- Detection: largest near-pure-white (min channel >= 254) connected region, fill ratio > 0.85, narrower than 90% of the image.
- `sw.js`: cache-first, except `version.json` which always goes to the network.

## Release checklist (every version)
1. Bump `VERSION` in `app.js`, `version` and `date` in `version.json`, cache name `C` in `sw.js`, and the badge text in `index.html`.
2. Update `files` in `version.json` and the list `A` in `sw.js` if files were added or removed.
3. Add a row to the update history in `README.md`.
4. Test (below), then package and deploy.

## Testing
Serve the folder (`python3 -m http.server`) and drive it with Playwright (Chromium): check detection values, duplicate list, numbers-only alert, generated JPEG against Example.png, QR decode with OpenCV `QRCodeDetector`, and no console errors. Avoid `pkill -f http.server` in a shell that contains that text.

## Known limits
- "Save to Photos" (Web Share API with files) is unverified on a real iPhone; .zip is the fallback.
- Box detection was verified on Blank.png only.
- An installed v1.0 keeps serving cached files until the new `sw.js` is fetched; open the app twice after deploying.

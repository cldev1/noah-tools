# Noah Tools

A kid-friendly multi-tool web app for toddler Noah.

Soft, playful, phone-first. Pure client-side SPA (no accounts, no backend).

**Germ Scanner** is the first live tool. More tools are on the hub as Coming soon.

## What is inside

### Tools hub
- **Germ Scanner** - Live
- **Hand Wash Coach** - Coming soon
- **Bath Bubbles Check** - Coming soon
- **Potty Sticker Chart** - Coming soon

### Germ Scanner flow
1. Pick a body part: **Tummy** or **Teeth**
2. Pick a mode (tummy before/after potty; teeth before/after brushing)
3. Take one photo (camera / capture / gallery) or skip and use the illustration
4. Watch a scanning bar move up and down over the photo (or art) for a few seconds
5. See a pretend result with cute germs on the tummy/teeth (or a clean celebration)
6. Scan again, Retake photo, or return to tools

Photos stay on the device. Camera needs HTTPS and permission; if denied, use gallery or illustration.

Live: https://cldev1.github.io/noah-tools/

Just for fun - not medical advice and not medically accurate.
## Run locally

Install dependencies, then start the Vite dev server.
Use the project scripts: install, then run the development and build scripts.

## GitHub Pages

Vite base is set to /noah-tools/ for project Pages.
Site is published from the gh-pages branch. Sample Actions file: docs/github-pages-workflow.yml.

## Stack

- Vite + React + TypeScript
- Plain CSS (soft mint / peach / sky palette, large tap targets)

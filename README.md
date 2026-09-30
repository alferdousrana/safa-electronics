# SAFA Quotation

SAFA Electronics Ltd. er lift offer quotation (A4 PDF, letterhead soho) banano'r mobile app. Pure HTML/CSS/JS — kono server lage na, GitHub Pages e cholbe, install kore offline o use kora jay.

## GitHub Pages e deploy
1. GitHub e notun repository kholo (jemon `safa-quotation`), Public.
2. Ei folder er **sob file** (index.html, app.js, template.js, style.css, sw.js, manifest.webmanifest, .nojekyll, `assets/`, `fonts/`, `icons/`, `lib/`) repo'r root e upload koro.
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `(root)` → Save.
4. 1-2 minute por link pabe: `https://<username>.github.io/safa-quotation/`

## Phone e install
- Android (Chrome): link open → menu ⋮ → **Install app / Add to Home screen**
- iPhone (Safari): Share → **Add to Home Screen**

## File gulo
| File | Kaj |
|---|---|
| `template.js` | PDF er 5 ta page er text/format (letter, offer sheet, terms, technical data, optional function) |
| `app.js` | Form, preview, PDF banano, saved list, settings |
| `style.css` | App design + A4 page layout |
| `assets/letterhead.jpg` | Original letterhead background |
| `sw.js` | Offline cache. **Kono file change korle `VERSION` er number barao** (v1 → v2), na hole phone e purono version theke jabe |

Data (brand, person, saved quotation) phone er browser e save thake. Onno phone e nite Settings → Export backup / Import backup.

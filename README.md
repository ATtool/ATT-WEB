# Adventist Tamil Tool — Web (Songs · Home · Books)

A free, offline-first Tamil Adventist web app published as a GitHub Pages PWA.
Built with Vite + React and prerendered to **1,400+ static pages** so every song,
devotion, lesson and book has its own indexable URL.

Live sections: **Songs**, **Home** (Today's Manna, Sabbath School, Magazines,
Updates, Settings, About) and **Books** (30 Ellen G. White titles).

---

## What is inside

| Area | Content |
| --- | --- |
| Songs | Zion (600) + Thirumarai (421: Hope 255 / Old 421) + Other songs + My Songs |
| Home | Today's Manna (197 devotions), Sabbath School (13 lessons × 8 days), Magazines, Updates |
| Books | 30 Tamil Ellen G. White books (PDF / online links open in a new tab) |
| Offline | Full app shell + all data cached by the service worker; installable on iPhone/Android |

Everything is client-side. No account, no backend, no ads, no Firebase.
Favourites, custom songs and reading settings live in `localStorage` on the device.

---

## Local development

```bash
npm install
npm run dev        # http://localhost:5180/ATT-WEB/
```

`npm run dev` serves the SPA without prerendering (client-side routing only).

## Production build (what GitHub Pages serves)

```bash
npm run build
npm run serve      # http://localhost:4173/ATT-WEB/
```

`npm run build` runs, in order:

1. `scripts/fetch-gists.mjs` — refreshes the public Gist snapshots (falls back to the committed copies if offline).
2. `scripts/prepare-data.mjs` — normalises Zion / Thirumarai / Manna / Sabbath into `public/data`.
3. `vite build` — client bundle into `dist/`.
4. `vite build --ssr` — server bundle into `dist-ssr/`.
5. `scripts/prerender.mjs` — writes one HTML file per route, `sitemap.xml`, `robots.txt`, `404.html`.
6. `scripts/build-sw.mjs` — writes `dist/sw.js` with the precache and library lists.

Optional environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_BASE` | `/ATT-WEB/` | Base path. Change if the repo is not named `ATT-WEB`. |
| `SITE_URL` | `https://example.github.io/ATT-WEB` | Absolute origin used for canonical URLs, Open Graph and the sitemap. |
| `SITE_ORIGIN` | `https://example.github.io` | Used when `SITE_URL` is not set. |

> The deploy workflow sets `VITE_BASE` and `SITE_URL` automatically from the
> repository owner and name, so canonical links are always correct in production.

---

## Publish on GitHub Pages

### 1. Create the repository

1. Go to <https://github.com/new>.
2. Name it **ATT-WEB** (use another name only if you also change `VITE_BASE`).
3. Choose **Public** (GitHub Pages on a free account requires a public repo).
4. Do **not** add a README, `.gitignore` or licence — this folder already has them.

### 2. Push this folder

Open PowerShell in `D:\ATT-GITHUB-WEB\ATT-WEB` and run:

```powershell
git init
git add .
git commit -m "Adventist Tamil Tool web app"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/ATT-WEB.git
git push -u origin main
```

### 3. Turn on Pages

1. In the repository: **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open the **Actions** tab and wait for *Deploy to GitHub Pages* to finish (about 2–4 minutes).
4. The site is live at `https://<YOUR-USERNAME>.github.io/ATT-WEB/`.

### 4. Publish updates later

```powershell
git add .
git commit -m "Update content"
git push
```

Every push to `main` rebuilds and redeploys automatically. Gist content is
re-fetched during the build, so new devotions, magazines and lessons appear
without touching the code.

---

## Offline behaviour

* First visit installs the service worker and precaches the shell, fonts, icons
  and core data. It then downloads the full song / Manna / Sabbath library in the
  background (about 8 MB).
* Any page that was opened stays available offline. Pages never opened still work
  because the app falls back to the cached shell and renders from cached data.
* **Settings → Save all songs offline** forces a full download;
  **Clear offline cache** removes it.
* PDFs and online-reading links always need internet and open in a new tab.

### Install on iPhone

1. Open the site in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Open the app once while online so it can finish saving content.

---

## SEO

* One static HTML file per route (`/songs/zion/1-thuuya-thuuya-thuuya/`, etc.).
* Per-page `<title>`, meta description, canonical, Open Graph and Twitter tags.
* JSON-LD: `WebApplication`, `CollectionPage`, `MusicComposition`, `Book`, `Article`.
* `sitemap.xml` and `robots.txt` are generated on every build.
* `404.html` boots the SPA so unknown deep links still resolve to the right screen.

---

## Project layout

```
ATT-WEB/
├─ index.html                 # HTML shell with SEO placeholders
├─ vite.config.js             # base path, build options
├─ public/
│  ├─ icons/                  # PWA + social icons (generated)
│  ├─ manifest.webmanifest
│  └─ data/                   # generated JSON (songs, manna, sabbath, gists)
├─ scripts/
│  ├─ fetch-gists.mjs         # refresh public Gist snapshots
│  ├─ prepare-data.mjs        # normalise app data into public/data
│  ├─ icons.mjs               # generate PWA icons from assets/icon.png
│  ├─ prerender.mjs           # static HTML + sitemap + robots + 404
│  ├─ build-sw.mjs            # generate dist/sw.js
│  └─ serve.mjs               # local static server
├─ shared/                    # helpers shared by scripts and app
├─ src/                       # React app (router, screens, components, styles)
└─ .github/workflows/deploy.yml
```

## Notes

* Tamil text uses the original mobile-app fonts (`Tamil003`, `Tamil008`) and the
  same mixed Tamil/English typography rules.
* This project intentionally omits Bible, Study, Concordance, Dictionary,
  Fellowship Services and the Sabbath verse popup.
* Content belongs to its respective Tamil Adventist ministries. This is a free
  reading tool and claims no ownership of the texts.

/**
 * Static prerender: renders every route to its own HTML file with SEO metadata,
 * embeds the exact data the screen needs, and writes sitemap.xml + robots.txt.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const BASE = (process.env.VITE_BASE || '/ATT-WEB/').replace(/\/*$/, '/');
const ORIGIN = (process.env.SITE_ORIGIN || 'https://example.github.io').replace(/\/*$/, '');
const SITE = (process.env.SITE_URL || `${ORIGIN}${BASE.replace(/\/$/, '')}`).replace(/\/*$/, '');

const readJSON = async (rel) => JSON.parse(await fs.readFile(path.join(DATA_DIR, rel), 'utf8'));
const exists = async (file) => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const clip = (value, max = 158) => {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
};

const jsonForScript = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const canonicalFor = (routePath) => `${SITE}${routePath}`;

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------
const zionMeta = await readJSON('meta/zion.json');
const thirMeta = await readJSON('meta/thirumarai.json');
const stats = await readJSON('stats.json');
const home = await readJSON('home.json');
const mannaIndex = await readJSON('manna-index.json');
const sabbathIndex = await readJSON('sabbath-index.json');
const magazines = await readJSON('gist/magazines.json');

const books = (await import(pathToFileURL(path.join(ROOT, 'src', 'data', 'books.js')).href)).EGW_BOOKS_DATA;
const { formatDate } = await import(pathToFileURL(path.join(ROOT, 'src', 'lib', 'dates.js')).href);

// ---------------------------------------------------------------------------
// Route collection
// ---------------------------------------------------------------------------
const routes = [];

const add = (route) => {
  routes.push({
    robots: 'index,follow',
    ogType: 'website',
    ...route,
    path: route.path,
  });
};

add({
  path: '/',
  title: 'Adventist Tamil Tool — Tamil Songs, Sabbath School & EGW Books',
  desc:
    'Tamil Christian songs, Today’s Manna, Sabbath School lessons, magazines and Ellen G. White books. Works offline on iPhone and Android.',
  data: { home },
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Adventist Tamil Tool',
    url: `${SITE}/`,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    inLanguage: 'ta',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    description:
      'Free offline Tamil Adventist app with songs, daily devotions, Sabbath School lessons and Ellen G. White books.',
  },
});

add({
  path: '/songs/',
  title: 'Tamil Christian Songs — Zion, Thirumarai & More | Adventist Tamil Tool',
  desc:
    'Search 1,000+ Tamil Christian songs: Zion songs and Thirumarai Hope and Old songs. Works offline.',
  data: { stats, zionMeta, thirumaraiMeta: thirMeta },
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Tamil Christian Songs',
    url: `${SITE}/songs/`,
    inLanguage: 'ta',
    isPartOf: { '@type': 'WebSite', name: 'Adventist Tamil Tool', url: `${SITE}/` },
    about: ['Zion songs', 'Thirumarai songs', 'Tamil Christian hymns'],
  },
});

add({
  path: '/songs/zion/',
  title: 'Zion Tamil Christian Songs — 600 Songs | Adventist Tamil Tool',
  desc:
    'Browse all 600 Zion Tamil Christian songs with Tamil lyrics, Tanglish transliteration, categories, search and favourites.',
  data: { zionMeta },
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Zion Tamil Christian Songs',
    url: `${SITE}/songs/zion/`,
    inLanguage: 'ta',
    numberOfItems: zionMeta.count,
  },
});

for (const category of zionMeta.categories) {
  const songs = zionMeta.songs.filter((song) => song.categorySlug === category.slug);
  add({
    path: `/songs/zion/category/${category.slug}/`,
    title: `${category.name} — Zion Tamil Christian Songs | Adventist Tamil Tool`,
    desc: clip(
      `Zion songs in the ${category.name}${category.nameEn ? ` (${category.nameEn})` : ''} category with Tamil lyrics and Tanglish transliteration. ${songs.length} songs.`
    ),
    data: { zionMeta: { ...zionMeta, songs, categories: zionMeta.categories } },
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      url: `${SITE}/songs/zion/category/${category.slug}/`,
      inLanguage: 'ta',
      numberOfItems: songs.length,
    },
  });
}

add({
  path: '/songs/thirumarai/',
  title: 'Thirumarai Tamil Songs — Hope & Old Collections | Adventist Tamil Tool',
  desc:
    'Browse 421 Thirumarai Tamil Christian songs in the Nambikaiyin Geethangal (Hope) and Old collections, with Tamil lyrics and transliteration.',
  data: { thirumaraiMeta: thirMeta },
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Thirumarai Tamil Songs',
    url: `${SITE}/songs/thirumarai/`,
    inLanguage: 'ta',
    numberOfItems: thirMeta.count,
  },
});

const hopeSongs = thirMeta.songs.filter((song) => song.hopeNumber);

add({
  path: '/songs/thirumarai/hope/',
  title: 'Thirumarai Hope Songs — Nambikaiyin Geethangal | Adventist Tamil Tool',
  desc: 'All 255 Nambikaiyin Geethangal (Hope) songs with Tamil lyrics, transliteration, search and favourites.',
  data: { thirumaraiMeta: thirMeta },
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Nambikaiyin Geethangal',
    url: `${SITE}/songs/thirumarai/hope/`,
    inLanguage: 'ta',
    numberOfItems: hopeSongs.length,
  },
});

add({
  path: '/songs/thirumarai/old/',
  title: 'Thirumarai Old Songs — Tamil Lyrics | Adventist Tamil Tool',
  desc: 'All 421 Thirumarai Tamil Christian songs with Tamil lyrics, Tanglish transliteration, search and favourites.',
  data: { thirumaraiMeta: thirMeta },
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Thirumarai Old Songs',
    url: `${SITE}/songs/thirumarai/old/`,
    inLanguage: 'ta',
    numberOfItems: thirMeta.count,
  },
});

add({
  path: '/books/',
  title: 'Tamil EGW Books — Ellen G. White Library | Adventist Tamil Tool',
  desc:
    'Read or download 30 Ellen G. White books in Tamil, including Steps to Christ, The Desire of Ages and The Great Controversy.',
  data: {},
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Ellen G. White Library (Tamil)',
    url: `${SITE}/books/`,
    inLanguage: 'ta',
    numberOfItems: books.length,
  },
});

for (const book of books) {
  add({
    path: `/books/${book.id}/`,
    title: `${book.title_english} — Tamil (${book.title_tamil}) | Adventist Tamil Tool`,
    desc: clip(
      `Read or download ${book.title_english} in Tamil${book.title_tamil ? ` (${book.title_tamil})` : ''} by Ellen G. White.`
    ),
    ogType: 'article',
    data: {},
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: book.title_tamil || book.title_english,
      alternateName: book.title_english,
      inLanguage: 'ta',
      author: { '@type': 'Person', name: 'Ellen G. White' },
      url: `${SITE}/books/${book.id}/`,
    },
  });
}

add({
  path: '/home/manna/',
  title: 'Today’s Manna — Tamil Daily Devotions | Adventist Tamil Tool',
  desc: 'Read Tamil daily devotions from Today’s Manna. Every devotion is saved for offline reading.',
  data: { mannaIndex },
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Today’s Manna — Tamil Daily Devotions',
    url: `${SITE}/home/manna/`,
    inLanguage: 'ta',
    numberOfItems: mannaIndex.dates.length,
  },
});

for (const entry of mannaIndex.dates) {
  add({
    path: `/home/manna/${entry.date}/`,
    title: `${entry.title} — Today’s Manna ${formatDate(entry.date)} | Adventist Tamil Tool`,
    desc: clip(`${entry.title}. ${entry.verse || entry.excerpt}`),
    ogType: 'article',
    data: {},
    mannaDate: entry.date,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entry.title,
      inLanguage: 'ta',
      datePublished: entry.date,
      url: `${SITE}/home/manna/${entry.date}/`,
      publisher: { '@type': 'Organization', name: 'Adventist Tamil Tool' },
    },
  });
}

add({
  path: '/home/sabbath-school/',
  title: 'Sabbath School Lessons — Tamil | Adventist Tamil Tool',
  desc:
    'Read the current Sabbath School quarter in Tamil, with every lesson and daily section saved for offline use.',
  data: { sabbathIndex },
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: sabbathIndex.quarter.title || 'Sabbath School',
    url: `${SITE}/home/sabbath-school/`,
    inLanguage: 'ta',
    numberOfItems: sabbathIndex.lessons.length,
  },
});

for (const lesson of sabbathIndex.lessons) {
  add({
    path: `/home/sabbath-school/${lesson.key}/`,
    title: `Lesson ${lesson.key}: ${lesson.title} — Sabbath School | Adventist Tamil Tool`,
    desc: clip(`${lesson.title}. ${lesson.start} – ${lesson.end}. Read all daily sections in Tamil.`),
    data: { sabbathIndex },
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Lesson ${lesson.key}: ${lesson.title}`,
      inLanguage: 'ta',
      url: `${SITE}/home/sabbath-school/${lesson.key}/`,
    },
  });
  for (const day of lesson.days) {
    add({
      path: `/home/sabbath-school/${lesson.key}/${day.key}/`,
      title: `${day.title} — Lesson ${lesson.key} | Sabbath School | Adventist Tamil Tool`,
      desc: clip(`${day.title}. ${lesson.title}. Tamil Sabbath School lesson.`),
      ogType: 'article',
      data: {},
      sabbathDay: { lesson: lesson.key, day: day.key },
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: day.title,
        inLanguage: 'ta',
        isPartOf: { '@type': 'Article', name: lesson.title },
        url: `${SITE}/home/sabbath-school/${lesson.key}/${day.key}/`,
      },
    });
  }
}

add({
  path: '/home/magazines/',
  title: 'Tamil Adventist Magazines — Monthly Issues | Adventist Tamil Tool',
  desc: 'Browse monthly Tamil Adventist magazines and open each issue as a PDF.',
  data: { magazines },
});

add({
  path: '/home/settings/',
  title: 'Settings | Adventist Tamil Tool',
  desc: 'Theme, text size, offline storage and app settings.',
  robots: 'noindex,follow',
  data: {},
});

add({
  path: '/home/about/',
  title: 'About Adventist Tamil Tool | Tamil Songs, Sabbath School & Books',
  desc:
    'Adventist Tamil Tool is a free, offline-friendly Tamil Adventist app with songs, daily devotions, Sabbath School lessons and Ellen G. White books.',
  data: {},
});

// ---------------------------------------------------------------------------
// Song pages (need per-song data)
// ---------------------------------------------------------------------------
const songRoutes = [];
for (const song of zionMeta.songs) {
  songRoutes.push({ collection: 'zion', song });
}
for (const song of thirMeta.songs) {
  songRoutes.push({ collection: 'thirumarai', song });
}

for (const { collection, song } of songRoutes) {
  const titleEn = song.title_en ? ` (${song.title_en})` : '';
  add({
    path: `/songs/${collection}/${song.id}-${song.slug}/`,
    title: `${song.number}. ${song.title_ta}${titleEn} — Tamil Lyrics | Adventist Tamil Tool`,
    desc: clip(
      `Tamil lyrics and Tanglish transliteration for ${song.title_ta}${titleEn}. ${song.firstLine || ''}`
    ),
    ogType: 'article',
    data: {},
    songRef: { collection, id: song.id },
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'MusicComposition',
      name: song.title_ta,
      alternateName: song.title_en || undefined,
      inLanguage: 'ta',
      lyrics: { '@type': 'CreativeWork', inLanguage: 'ta', text: song.firstLine || undefined },
      url: `${SITE}/songs/${collection}/${song.id}-${song.slug}/`,
    },
  });
}


// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
const { render } = await import(pathToFileURL(path.join(ROOT, 'dist-ssr', 'entry-server.js')).href);

const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
const OG_IMAGE = `${SITE}/icons/og-image.png`;

const buildHead = (route) => {
  const parts = [];
  if (route.jsonld) {
    parts.push(`<script type="application/ld+json">${jsonForScript(route.jsonld)}</script>`);
  }
  parts.push(`<meta name="geo.region" content="IN" />`);
  return parts.join('\n    ');
};

// Plain split/join replacement so `$&`, `$1` inside content are never interpreted.
const swap = (source, needle, value) => source.split(needle).join(value);

const renderPage = (route, html, data, extras = {}) => {
  const canonical = canonicalFor(route.path);
  const body = html || '';
  let page = swap(template, '__TITLE__', esc(route.title));
  page = swap(page, '__DESC__', esc(route.desc));
  page = swap(page, '__CANONICAL__', esc(canonical));
  page = swap(page, '__ROBOTS__', esc(route.robots));
  page = swap(page, '__OGTYPE__', esc(route.ogType));
  page = swap(page, '__OG_IMAGE__', esc(OG_IMAGE));
  page = swap(page, '<!--SSR_HEAD-->', buildHead(route));
  page = swap(page, '<div id="root"><!--SSR_BODY--></div>', `<div id="root">${body}</div>`);
  page = swap(
    page,
    '<script id="ssr-state">window.__PATH__=null;window.__DATA__={};</script>',
    `<script id="ssr-state">window.__PATH__=${jsonForScript(extras.routePath || route.path)};window.__DATA__=${jsonForScript(
      data
    )};</script>`
  );
  return page;
};

const writePage = async (route, page) => {
  const target =
    route.path === '/' ? path.join(DIST, 'index.html') : path.join(DIST, ...route.path.split('/').filter(Boolean), 'index.html');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, page, 'utf8');
};

const loadSong = (collection, id) => readJSON(`songs/${collection}/${id}.json`);
const loadManna = (date) => readJSON(`manna/${date}.json`);
const loadSabbathDay = (lesson, day) => readJSON(`sabbath/${lesson}/${day}.json`);

let done = 0;
let failed = 0;
const started = Date.now();

for (const route of routes) {
  try {
    const data = { ...(route.data || {}) };
    let extraData = null;

    if (route.songRef) {
      const song = await loadSong(route.songRef.collection, route.songRef.id);
      data[`song:${route.songRef.collection}:${route.songRef.id}`] = song;
    }
    if (route.mannaDate) {
      const entry = await loadManna(route.mannaDate);
      data[`manna:${route.mannaDate}`] = entry;
    }
    if (route.sabbathDay) {
      data.sabbathIndex = sabbathIndex;
      const entry = await loadSabbathDay(route.sabbathDay.lesson, route.sabbathDay.day);
      data[`sabbath:${route.sabbathDay.lesson}:${route.sabbathDay.day}`] = entry;
    }

    const html = render(route.path, data);
    const page = renderPage(route, html, data, { routePath: route.path });
    await writePage(route, page);
    done += 1;
    if (done % 200 === 0) console.log(`[prerender] ${done}/${routes.length}`);
  } catch (error) {
    failed += 1;
    console.warn(`[prerender] FAILED ${route.path}: ${error.message}`);
    try {
      const page = renderPage(route, '', route.data || {}, { routePath: route.path });
      await writePage(route, page);
    } catch {
      /* give up on this page */
    }
  }
}

// ---------------------------------------------------------------------------
// 404 shell (client-rendered by the router)
// ---------------------------------------------------------------------------
const notFoundData = {};
const notFoundRoute = {
  path: '/404.html',
  title: 'Page not found | Adventist Tamil Tool',
  desc: 'The page you are looking for may have moved, or it is not saved offline yet.',
  robots: 'noindex,follow',
  ogType: 'website',
};
const notFoundPage = renderPage(notFoundRoute, '', notFoundData).replace(
  `<script id="ssr-state">window.__PATH__=${jsonForScript('/404.html')};window.__DATA__=${jsonForScript({})};</script>`,
  '<script id="ssr-state">window.__PATH__=null;window.__DATA__={};</script>'
);
await fs.writeFile(path.join(DIST, '404.html'), notFoundPage, 'utf8');

// ---------------------------------------------------------------------------
// sitemap.xml + robots.txt + .nojekyll
// ---------------------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const sitemapEntries = routes
  .filter((route) => route.robots.startsWith('index'))
  .map(
    (route) =>
      `  <url>\n    <loc>${esc(canonicalFor(route.path))}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${
        route.path === '/' ? 'daily' : 'weekly'
      }</changefreq>\n  </url>`
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;
await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`;
await fs.writeFile(path.join(DIST, 'robots.txt'), robots, 'utf8');
await fs.writeFile(path.join(DIST, '.nojekyll'), '', 'utf8');

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const htmlCount = routes.length + 1;
console.log(
  `[prerender] wrote ${htmlCount} pages (${failed} failed) in ${((Date.now() - started) / 1000).toFixed(
    1
  )}s → ${SITE}`
);

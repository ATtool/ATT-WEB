import fs from 'node:fs/promises';
import path from 'node:path';
import { slugify } from '../shared/slug.js';
import { EGW_BOOKS_DATA } from '../src/data/books.js';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'assets', 'data');
const GIST = path.join(ROOT, 'public', 'data', 'gist');
const OUT = path.join(ROOT, 'public', 'data');

const readJSON = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const writeJSON = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value), 'utf8');
};
const clean = (value) => String(value ?? '').replace(/\r\n/g, '\n').trim();

const firstLine = (lyrics) => {
  const lines = clean(lyrics).split('\n');
  for (const line of lines) {
    const value = line
      .replace(/^\s*\[(verse|chorus)[^\]]*\]\s*/i, '')
      .replace(/^\s*\d{1,3}[.)]\s*/, '')
      .trim();
    if (value) return value.slice(0, 140);
  }
  return '';
};

const zionRaw = (await readJSON(path.join(SRC, 'zion.json'))).songs;
const thirRaw = (await readJSON(path.join(SRC, 'Thirumarai.json'))).songs;

const usedZionIds = new Set();
const zion = zionRaw.map((song, index) => {
  let id = String(song.id ?? song.song_number ?? index + 1);
  while (usedZionIds.has(id)) id = `${id}-${index + 1}`;
  usedZionIds.add(id);
  const number = String(song.song_number ?? song.id ?? index + 1);
  const titleEn = clean(song.title_english);
  return {
    id,
    collection: 'zion',
    number,
    hopeNumber: null,
    title_ta: clean(song.title_tamil),
    title_en: titleEn,
    category: clean(song.category),
    category_en: clean(song['category-en']),
    categorySlug: '',
    lyrics: clean(song.lyrics),
    translit: clean(song.lyrics_transliteration),
    combined: clean(song.lyrics_combined),
    firstLine: firstLine(song.lyrics),
    slug: slugify(titleEn, `song-${number}`),
  };
});

const categoryMap = new Map();
for (const song of zion) {
  const label = song.category || song.category_en || 'Other';
  if (!categoryMap.has(label)) {
    categoryMap.set(label, {
      name: label,
      nameEn: song.category_en,
      slug: slugify(song.category_en || song.category, `category-${categoryMap.size + 1}`),
      count: 0,
    });
  }
  const entry = categoryMap.get(label);
  entry.count += 1;
  song.categorySlug = entry.slug;
}
const zionCategories = [...categoryMap.values()];
const seenCategorySlugs = new Set();
for (const category of zionCategories) {
  let slug = category.slug;
  let n = 2;
  while (seenCategorySlugs.has(slug)) slug = `${category.slug}-${n++}`;
  seenCategorySlugs.add(slug);
  category.slug = slug;
}
for (const song of zion) {
  const match = zionCategories.find((c) => c.name === (song.category || song.category_en || 'Other'));
  if (match) song.categorySlug = match.slug;
}

const usedThirIds = new Set();
const thirumarai = thirRaw.map((song, index) => {
  let id = String(song.id ?? index + 1);
  while (usedThirIds.has(id)) id = `${id}-${index + 1}`;
  usedThirIds.add(id);
  const number = String(song.song_number ?? song.id ?? index + 1);
  const hopeNumber =
    song.Song_number_by_Nambikaiyen_Geethagal != null && String(song.Song_number_by_Nambikaiyen_Geethagal).trim() !== ''
      ? String(song.Song_number_by_Nambikaiyen_Geethagal)
      : null;
  const titleEn = clean(song.song_title_english);
  return {
    id,
    collection: 'thirumarai',
    number,
    hopeNumber,
    title_ta: clean(song.song_title_tamil),
    title_en: titleEn,
    category: '',
    category_en: '',
    categorySlug: '',
    lyrics: clean(song.lyrics),
    translit: clean(song.lyrics_transliteration),
    combined: clean(song.lyrics_combined),
    firstLine: firstLine(song.lyrics),
    slug: slugify(titleEn, `song-${number}`),
  };
});

const meta = (song) => ({
  id: song.id,
  number: song.number,
  hopeNumber: song.hopeNumber,
  title_ta: song.title_ta,
  title_en: song.title_en,
  category: song.category,
  category_en: song.category_en,
  categorySlug: song.categorySlug,
  firstLine: song.firstLine,
  slug: song.slug,
});

const zionMeta = {
  collection: 'zion',
  count: zion.length,
  categories: zionCategories,
  songs: zion.map(meta),
};
const thirMeta = {
  collection: 'thirumarai',
  count: thirumarai.length,
  categories: [],
  songs: thirumarai.map(meta),
};

await writeJSON(path.join(OUT, 'meta', 'zion.json'), zionMeta);
await writeJSON(path.join(OUT, 'meta', 'thirumarai.json'), thirMeta);

const writeSongs = async (collection, songs) => {
  await fs.rm(path.join(OUT, 'songs', collection), { recursive: true, force: true });
  await fs.mkdir(path.join(OUT, 'songs', collection), { recursive: true });
  for (let i = 0; i < songs.length; i += 1) {
    const song = songs[i];
    const prev = songs[i - 1];
    const next = songs[i + 1];
    const brief = (s) =>
      s
        ? {
            id: s.id,
            slug: s.slug,
            number: s.number,
            hopeNumber: s.hopeNumber,
            title_ta: s.title_ta,
            title_en: s.title_en,
          }
        : null;
    await writeJSON(path.join(OUT, 'songs', collection, `${song.id}.json`), {
      ...song,
      prev: brief(prev),
      next: brief(next),
    });
  }
};
await writeSongs('zion', zion);
await writeSongs('thirumarai', thirumarai);

// ---------------------------------------------------------------------------
// Gist-derived data
// ---------------------------------------------------------------------------
const manna = await readJSON(path.join(GIST, 'manna.json'));
const updates = await readJSON(path.join(GIST, 'updates.json'));
const magazines = await readJSON(path.join(GIST, 'magazines.json'));
const sabbath = await readJSON(path.join(GIST, 'sabbath.json'));
const otherSongs = await readJSON(path.join(GIST, 'other-songs.json'));

const devotions = manna.devotions || {};
const mannaDates = Object.keys(devotions).sort().reverse();
const mannaIndex = {
  dates: mannaDates.map((date) => {
    const entry = devotions[date] || {};
    return {
      date,
      title: clean(entry.title),
      verse: clean(entry.verse),
      excerpt: clean(entry.content).slice(0, 180),
    };
  }),
};
await writeJSON(path.join(OUT, 'manna-index.json'), mannaIndex);

const mannaAscending = [...mannaDates].sort();
for (let i = 0; i < mannaAscending.length; i += 1) {
  const date = mannaAscending[i];
  const entry = devotions[date] || {};
  await writeJSON(path.join(OUT, 'manna', `${date}.json`), {
    date,
    title: clean(entry.title),
    verse: clean(entry.verse),
    content: clean(entry.content),
    prevDate: mannaAscending[i - 1] || null,
    nextDate: mannaAscending[i + 1] || null,
  });
}

const parseFrontmatter = (text) => {
  const raw = String(text || '');
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const fields = {};
  if (match) {
    for (const line of match[1].split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)\s*$/);
      if (m) fields[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  return { fields, body: match ? raw.slice(match[0].length) : raw };
};

const quarterInfo = sabbath.quarter_info?.info || {};
const lessonKeys = Object.keys(sabbath.lessons || {}).sort();
const lessons = lessonKeys.map((key) => {
  const lesson = sabbath.lessons[key] || {};
  const info = lesson.info || {};
  const dayKeys = Object.keys(lesson).filter((k) => k !== 'info');
  return {
    key,
    title: clean(info.title),
    start: clean(info.start_date),
    end: clean(info.end_date),
    days: dayKeys.map((dayKey) => {
      const { fields } = parseFrontmatter(lesson[dayKey]);
      return {
        key: dayKey,
        title: clean(fields.title) || (dayKey === 'inside-story' ? 'Inside Story' : `Day ${dayKey}`),
        date: clean(fields.date),
      };
    }),
  };
});
const sabbathIndex = {
  quarter: {
    title: clean(quarterInfo.title),
    description: clean(quarterInfo.description),
    start: clean(quarterInfo.start_date),
    end: clean(quarterInfo.end_date),
    humanDate: clean(quarterInfo.human_date),
    colorPrimary: clean(quarterInfo.color_primary),
    splash: clean(quarterInfo.splash),
  },
  lessons,
};
await writeJSON(path.join(OUT, 'sabbath-index.json'), sabbathIndex);

// Per-day Sabbath lesson files (also used for client-side navigation / offline).
const flatSabbath = [];
for (const lesson of lessons) {
  for (const day of lesson.days) flatSabbath.push({ lesson, day });
}
for (let i = 0; i < flatSabbath.length; i += 1) {
  const { lesson, day } = flatSabbath[i];
  const raw = sabbath.lessons?.[lesson.key]?.[day.key] || '';
  const { body } = parseFrontmatter(raw);
  const brief = (item) =>
    item
      ? {
          lesson: item.lesson.key,
          day: item.day.key,
          title: item.day.title,
          lessonTitle: item.lesson.title,
        }
      : null;
  await writeJSON(path.join(OUT, 'sabbath', lesson.key, `${day.key}.json`), {
    lessonKey: lesson.key,
    dayKey: day.key,
    lessonTitle: lesson.title,
    dayTitle: day.title,
    date: day.date,
    quarterTitle: sabbathIndex.quarter.title,
    content: clean(body),
    prev: brief(flatSabbath[i - 1]),
    next: brief(flatSabbath[i + 1]),
  });
}

const today = new Date();
const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
  today.getDate()
).padStart(2, '0')}`;

const pickMannaDate = () => {
  if (devotions[todayISO]) return todayISO;
  const past = mannaDates.filter((d) => d <= todayISO);
  return past[0] || mannaDates[0] || null;
};

const parseDMY = (value) => {
  const m = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};
const currentLesson =
  lessons.find((lesson) => {
    const start = parseDMY(lesson.start);
    const end = parseDMY(lesson.end);
    return start && end && todayISO >= start && todayISO <= end;
  }) || lessons[lessons.length - 1] || null;

const latestMagazine =
  [...(magazines.magazines || [])].sort((a, b) => String(b.date_val).localeCompare(String(a.date_val)))[0] ||
  null;

const home = {
  builtAt: new Date().toISOString(),
  manna: pickMannaDate()
    ? {
        date: pickMannaDate(),
        title: clean(devotions[pickMannaDate()].title),
        verse: clean(devotions[pickMannaDate()].verse),
        excerpt: clean(devotions[pickMannaDate()].content).slice(0, 240),
      }
    : null,
  sabbath: currentLesson
    ? {
        quarterTitle: sabbathIndex.quarter.title,
        lessonKey: currentLesson.key,
        lessonTitle: currentLesson.title,
        start: currentLesson.start,
        end: currentLesson.end,
      }
    : null,
  magazine: latestMagazine,
  updates: (Array.isArray(updates) ? updates : []).slice(0, 3),
  counts: {
    zion: zion.length,
    thirumarai: thirumarai.length,
    other: Array.isArray(otherSongs.songs) ? otherSongs.songs.length : 0,
    books: EGW_BOOKS_DATA.length,
  },
};
await writeJSON(path.join(OUT, 'home.json'), home);

const stats = {
  zion: zion.length,
  thirumarai: thirumarai.length,
  thirumaraiHope: thirumarai.filter((s) => s.hopeNumber).length,
  thirumaraiOld: thirumarai.length,
  other: Array.isArray(otherSongs.songs) ? otherSongs.songs.length : 0,
  categories: zionCategories.length,
  books: EGW_BOOKS_DATA.length,
  manna: mannaDates.length,
  magazines: (magazines.magazines || []).length,
  sabbathLessons: lessons.length,
};
await writeJSON(path.join(OUT, 'stats.json'), stats);

console.log(
  `[data] zion=${stats.zion} thirumarai=${stats.thirumarai} (hope ${stats.thirumaraiHope}) ` +
    `other=${stats.other} books=${stats.books} manna=${stats.manna} sabbath=${stats.sabbathLessons}`
);

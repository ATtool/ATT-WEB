import { slugify } from '../../shared/slug.js';

const firstLine = (lyrics) => {
  for (const line of String(lyrics || '').split('\n')) {
    const value = line
      .replace(/^\s*\[(verse|chorus)[^\]]*\]\s*/i, '')
      .replace(/^\s*\d{1,3}[.)]\s*/, '')
      .trim();
    if (value) return value.slice(0, 140);
  }
  return '';
};

export function normalizeOtherSongs(payload) {
  const raw = Array.isArray(payload?.songs) ? payload.songs : [];
  const songs = raw.map((song, index) => {
    const number = String(song.song_number ?? song.id ?? index + 1);
    const titleEn = String(song.title_thanglish || '').trim();
    return {
      id: String(song.id ?? index + 1),
      collection: 'other',
      number,
      hopeNumber: null,
      title_ta: String(song.title_tamil || '').trim(),
      title_en: titleEn,
      category: String(song.category || '').trim(),
      category_en: '',
      categorySlug: '',
      lyrics: String(song.lyrics || '').replace(/\r\n/g, '\n').trim(),
      translit: '',
      combined: '',
      firstLine: firstLine(song.lyrics),
      slug: slugify(titleEn, `song-${number}`),
    };
  });
  return songs.map((song, index) => ({
    ...song,
    prev: songs[index - 1]
      ? {
          id: songs[index - 1].id,
          slug: songs[index - 1].slug,
          number: songs[index - 1].number,
          title_ta: songs[index - 1].title_ta,
        }
      : null,
    next: songs[index + 1]
      ? {
          id: songs[index + 1].id,
          slug: songs[index + 1].slug,
          number: songs[index + 1].number,
          title_ta: songs[index + 1].title_ta,
        }
      : null,
  }));
}

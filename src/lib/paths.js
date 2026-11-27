import { slugify } from '../../shared/slug.js';

export const BASE = import.meta.env.BASE_URL || '/';

export const withBase = (path = '/') => {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE}${clean}`;
};

export const stripBase = (pathname = '/') => {
  let value = pathname;
  if (BASE !== '/' && value.startsWith(BASE)) value = value.slice(BASE.length);
  if (!value.startsWith('/')) value = `/${value}`;
  return value;
};

export const normalizePath = (path = '/') => {
  let value = String(path || '/').split('?')[0].split('#')[0];
  if (!value.startsWith('/')) value = `/${value}`;
  value = value.replace(/\/{2,}/g, '/');
  if (!value.endsWith('/')) value = `${value}/`;
  return value;
};

export const currentPath = () => {
  if (typeof window === 'undefined') return '/';
  return normalizePath(decodeURI(stripBase(window.location.pathname)));
};

export const songPath = (collection, song) =>
  `/songs/${collection}/${song.id}-${song.slug || slugify(song.title_en, `song-${song.number}`)}/`;

export const songIdFromSegment = (segment) => {
  const match = String(segment || '').match(/^(\d+)/);
  return match ? match[1] : null;
};

export const bookPath = (id) => `/books/${id}/`;
export const mannaPath = (date) => `/home/manna/${date}/`;
export const sabbathPath = (lesson, day) =>
  day ? `/home/sabbath-school/${lesson}/${day}/` : `/home/sabbath-school/${lesson}/`;
export const categoryPath = (slug) => `/songs/zion/category/${slug}/`;

export function parseRoute(pathname) {
  const path = normalizePath(pathname);
  const segments = path.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
  const [a, b, c, d] = segments;

  if (!a) return { name: 'home' };
  if (a === 'songs' && !b) return { name: 'songs' };
  if (a === 'songs' && b === 'zion' && !c) return { name: 'zion' };
  if (a === 'songs' && b === 'zion' && c === 'category' && d) return { name: 'zionCategory', slug: d };
  if (a === 'songs' && b === 'zion' && c) return { name: 'song', collection: 'zion', id: songIdFromSegment(c) };
  if (a === 'songs' && b === 'thirumarai' && !c) return { name: 'thirumarai' };
  if (a === 'songs' && b === 'thirumarai' && (c === 'hope' || c === 'old')) return { name: 'thirumaraiList', variant: c };
  if (a === 'songs' && b === 'thirumarai' && c) return { name: 'song', collection: 'thirumarai', id: songIdFromSegment(c) };
  if (a === 'books' && !b) return { name: 'books' };
  if (a === 'books' && b) return { name: 'book', id: b };
  if (a === 'home' && b === 'manna' && !c) return { name: 'mannaList' };
  if (a === 'home' && b === 'manna' && c) return { name: 'manna', date: c };
  if (a === 'home' && b === 'sabbath-school' && !c) return { name: 'sabbathList' };
  if (a === 'home' && b === 'sabbath-school' && c && !d) return { name: 'sabbathLesson', lesson: c };
  if (a === 'home' && b === 'sabbath-school' && c && d) return { name: 'sabbathDay', lesson: c, day: d };
  if (a === 'home' && b === 'magazines') return { name: 'magazines' };
  if (a === 'home' && b === 'settings') return { name: 'settings' };
  if (a === 'home' && b === 'about') return { name: 'about' };
  return { name: 'notfound' };
}

export const routeTitle = (route) => {
  switch (route.name) {
    case 'home':
      return 'Home';
    case 'songs':
      return 'Songs';
    case 'zion':
      return 'Zion Songs';
    case 'thirumarai':
      return 'Thirumarai';
    case 'thirumaraiList':
      return route.variant === 'hope' ? 'Nambikaiyin Geethangal' : 'Thirumarai Songs';
    case 'song':
      return 'Song';
    case 'books':
      return 'Books';
    case 'book':
      return 'Book';
    case 'mannaList':
      return "Today's Manna";
    case 'manna':
      return 'Manna';
    case 'sabbathList':
      return 'Sabbath School';
    case 'sabbathLesson':
      return 'Sabbath School';
    case 'sabbathDay':
      return 'Sabbath School';
    case 'magazines':
      return 'Magazines';
    case 'settings':
      return 'Settings';
    case 'about':
      return 'About';
    default:
      return 'Not Found';
  }
};

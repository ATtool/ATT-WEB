import { withBase } from '../lib/paths.js';

export const LIVE_GISTS = {
  manna: 'https://gist.githubusercontent.com/ATtool/e3a8241e07503969cb06448a32eb4382/raw/manna.json',
  updates: 'https://gist.githubusercontent.com/ATtool/d2282fc4e40cab92304a6a3615561a34/raw/updates.json',
  magazines: 'https://gist.githubusercontent.com/ATtool/9148fb9b8a3238acc50c2c5fb80d80bc/raw/magazines.json',
  sabbath: 'https://gist.githubusercontent.com/ATtool/515dee23d057c967636146fded6645f4/raw/SSl-Ta',
  otherSongs: 'https://gist.githubusercontent.com/ATtool/cf27796976a73404f254b4bc81240f5f/raw/other_songs.json',
};

const fetchJSON = async (path, options = {}) => {
  const url = /^https?:\/\//i.test(path) ? path : withBase(path);
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${path}`);
  return response.json();
};

export const loadHome = () => fetchJSON('data/home.json');
export const loadStats = () => fetchJSON('data/stats.json');
export const loadMeta = (collection) => fetchJSON(`data/meta/${collection}.json`);
export const loadSong = (collection, id) => fetchJSON(`data/songs/${collection}/${id}.json`);
export const loadMannaIndex = () => fetchJSON('data/manna-index.json');
export const loadManna = (date) => fetchJSON(`data/manna/${date}.json`);
export const loadSabbathIndex = () => fetchJSON('data/sabbath-index.json');
export const loadSabbathDay = (lesson, day) => fetchJSON(`data/sabbath/${lesson}/${day}.json`);
export const loadOtherSongs = () => fetchJSON('data/gist/other-songs.json');
export const loadMagazines = () => fetchJSON('data/gist/magazines.json');
export const loadUpdates = () => fetchJSON('data/gist/updates.json');

export const fetchLive = async (key) => {
  const url = LIVE_GISTS[key];
  if (!url) throw new Error(`Unknown gist: ${key}`);
  return fetchJSON(url, { cache: 'no-store' });
};

export const gistKeyFor = {
  manna: 'manna',
  updates: 'updates',
  magazines: 'magazines',
  sabbath: 'sabbath',
  otherSongs: 'otherSongs',
};

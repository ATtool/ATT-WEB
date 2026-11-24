import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import MixedText from '../components/MixedText.jsx';
import Page from '../components/Page.jsx';
import { Link } from '../router.jsx';
import { songPath } from '../lib/paths.js';
import { useData } from '../context/DataContext.jsx';
import { loadStats, loadMeta, loadOtherSongs } from '../data/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useMeta } from '../lib/useMeta.js';
import { useChrome } from '../context/ChromeContext.jsx';

export default function SongsHub() {
  const { data: stats } = useData('stats', loadStats);
  const { data: zionMeta } = useData('zionMeta', () => loadMeta('zion'));
  const { data: thirMeta } = useData('thirumaraiMeta', () => loadMeta('thirumarai'));
  const { data: other } = useData('otherSongs', loadOtherSongs);
  const { typography } = useSettings();
  const { showToast } = useChrome();
  const [query, setQuery] = useState('');
  const [customCount, setCustomCount] = useState(0);

  useMeta(
    'Tamil Christian Songs — Zion, Thirumarai & More | Adventist Tamil Tool',
    'Search 1,000+ Tamil Christian songs: Zion songs, Thirumarai Hope and Old songs, other songs and your own custom songs. Works offline.'
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('@custom_songs');
      const parsed = raw ? JSON.parse(raw) : [];
      setCustomCount(Array.isArray(parsed) ? parsed.length : 0);
    } catch {
      setCustomCount(0);
    }
  }, []);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (value.length < 2) return [];
    const list = [];
    for (const song of zionMeta?.songs || []) {
      const haystack = `${song.number} ${song.title_ta} ${song.title_en} ${song.firstLine || ''}`.toLowerCase();
      if (haystack.includes(value)) list.push({ ...song, collection: 'zion' });
    }
    for (const song of thirMeta?.songs || []) {
      const haystack = `${song.number} ${song.hopeNumber || ''} ${song.title_ta} ${song.title_en} ${
        song.firstLine || ''
      }`.toLowerCase();
      if (haystack.includes(value)) list.push({ ...song, collection: 'thirumarai' });
    }
    for (const song of other?.songs || []) {
      const haystack = `${song.song_number} ${song.title_tamil} ${song.title_thanglish} ${song.lyrics || ''}`.toLowerCase();
      if (haystack.includes(value)) {
        list.push({
          id: String(song.id),
          number: String(song.song_number || song.id),
          title_ta: song.title_tamil,
          title_en: song.title_thanglish,
          slug: String(song.title_thanglish || song.id)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
          collection: 'other',
        });
      }
    }
    return list.slice(0, 40);
  }, [query, zionMeta, thirMeta, other]);

  const cards = [
    {
      to: '/songs/zion/',
      title: 'Zion Songs',
      tamil: 'சீயோன் பாடல்கள்',
      desc: '600 songs in 38 categories',
      icon: 'music',
      count: stats?.zion || 600,
    },
    {
      to: '/songs/thirumarai/',
      title: 'Thirumarai',
      tamil: 'திருமறைப் பாடல்கள்',
      desc: 'Hope and Old collection',
      icon: 'book-open',
      count: stats?.thirumarai || 421,
    },
    {
      to: '/songs/other/',
      title: 'Other Songs',
      tamil: 'மற்ற பாடல்கள்',
      desc: 'Updated from the online library',
      icon: 'sparkles',
      count: other?.songs?.length ?? stats?.other ?? 0,
    },
    {
      to: '/songs/custom/',
      title: 'My Songs',
      tamil: 'என் பாடல்கள்',
      desc: 'Add and keep your own songs',
      icon: 'edit',
      count: customCount,
    },
  ];

  return (
    <Page title="Songs" eyebrow="பாடல்கள்" back={false}>
      <div className="songs-intro">
        <MixedText as="h2" size={typography.h2.fontSize} className="songs-intro-title">
          Find a song
        </MixedText>
        <p>Search by Tamil title, English title or song number.</p>
        <div className="search-field search-large">
          <Icon name="search" size={20} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search 1,000+ songs…"
            aria-label="Search all songs"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setQuery('')}>
              <Icon name="close" size={17} />
            </button>
          )}
        </div>
      </div>

      {query.trim().length >= 2 ? (
        <div className="search-results">
          <div className="list-count">
            {results.length === 0 ? 'No matches' : `${results.length}${results.length === 40 ? '+' : ''} results`}
          </div>
          {results.map((song) => (
            <Link
              key={`${song.collection}-${song.id}`}
              to={songPath(song.collection, song)}
              className="song-row search-result"
            >
              <span className="song-number"><MixedText size={15}>{song.number}</MixedText></span>
              <span className="song-main">
                <MixedText as="span" size={16} className="song-title">{song.title_ta}</MixedText>
                {song.title_en && <span className="song-sub">{song.title_en}</span>}
              </span>
              <span className="result-source">
                {song.collection === 'zion' ? 'Zion' : song.collection === 'thirumarai' ? 'Thirumarai' : 'Other'}
              </span>
            </Link>
          ))}
          {results.length === 0 && (
            <div className="search-empty">
              <Icon name="search" size={26} />
              <p>Try fewer letters, or browse a collection below.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="collection-grid">
          {cards.map((card) => (
            <Link key={card.to} to={card.to} className="collection-card">
              <span className="collection-icon"><Icon name={card.icon} size={24} /></span>
              <span className="collection-count">{card.count}</span>
              <MixedText as="h3" size={typography.title.fontSize}>{card.title}</MixedText>
              <span className="collection-tamil">{card.tamil}</span>
              <span className="collection-desc">{card.desc}</span>
              <span className="collection-go">Open <Icon name="chevron-right" size={15} /></span>
            </Link>
          ))}
        </div>
      )}

      <button
        type="button"
        className="offline-note"
        onClick={() => showToast('Songs are saved automatically after the first visit. Settings → Offline library can save everything now.')}
      >
        <Icon name="check" size={15} /> All songs available offline
      </button>
    </Page>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import MixedText from '../components/MixedText.jsx';
import Page from '../components/Page.jsx';
import { Link } from '../router.jsx';
import { songPath } from '../lib/paths.js';
import { useData } from '../context/DataContext.jsx';
import { loadStats, loadMeta } from '../data/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useMeta } from '../lib/useMeta.js';
import { useChrome } from '../context/ChromeContext.jsx';

export default function SongsHub() {
  const { data: stats } = useData('stats', loadStats);
  const { data: zionMeta } = useData('zionMeta', () => loadMeta('zion'));
  const { data: thirMeta } = useData('thirumaraiMeta', () => loadMeta('thirumarai'));
  const { typography, isThanglish, setThanglish } = useSettings();
  const { showToast } = useChrome();
  const [query, setQuery] = useState('');
  const [cacheStatus, setCacheStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useMeta(
    'Tamil Christian Songs — Zion & Thirumarai | Adventist Tamil Tool',
    'Search 1,000+ Tamil Christian songs: Zion songs and Thirumarai Hope and Old songs. Works offline.'
  );

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const onMessage = (event) => {
      const data = event.data;
      if (!data || (data.type !== 'CACHE_STATUS' && data.type !== 'CACHE_PROGRESS')) return;
      setCacheStatus(data);
      if (data.type === 'CACHE_STATUS' && data.total && data.cached >= data.total) {
        setSaving(false);
        setSaved(true);
        showToast('All songs saved for offline use');
      } else if (data.type === 'CACHE_STATUS' && data.done) {
        setSaving(false);
        showToast('Could not finish saving. Connect to the internet and try again.');
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    navigator.serviceWorker.ready
      .then((registration) => registration.active?.postMessage({ type: 'GET_STATUS' }))
      .catch(() => {});
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [showToast]);

  const saveOfflineLibrary = async () => {
    if (!('serviceWorker' in navigator)) {
      showToast('Offline saving is not supported in this browser.');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) return;
      setSaving(true);
      registration.active.postMessage({ type: 'CACHE_LIBRARY' });
      showToast('Saving the full song library for offline use…', 4000);
    } catch {
      setSaving(false);
      showToast('Offline saving is not supported in this browser.');
    }
  };

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (value.length < 2) return [];
    const list = [];
    const matches = (song, collection) => {
      const number = String(song.number || '').toLowerCase();
      const hopeNumber = String(song.hopeNumber || '').toLowerCase();
      const titleTa = String(song.title_ta || '').toLowerCase();
      const titleEn = String(song.title_en || '').toLowerCase();
      const exactNumber = number === value || hopeNumber === value;
      const partialTitle = titleTa.includes(value) || titleEn.includes(value);
      if (exactNumber || partialTitle) list.push({ ...song, collection });
    };
    for (const song of zionMeta?.songs || []) matches(song, 'zion');
    for (const song of thirMeta?.songs || []) matches(song, 'thirumarai');
    return list.slice(0, 40);
  }, [query, zionMeta, thirMeta]);

  const cards = [
    {
      to: '/songs/zion/',
      title: isThanglish ? 'Zion Iniya Geethangal' : 'சீயோன் இனிய கீதங்கள்',
      sub: null,
      desc: '600 songs in 38 categories',
      icon: 'music',
      count: stats?.zion || 600,
    },
    {
      to: '/songs/thirumarai/old/',
      title: isThanglish ? 'Thirumarai Thirupaadalgal' : 'திருமறைத்திருப் பாடல்கள்',
      sub: isThanglish ? '( Old Song Book )' : '( பழைய புத்தக வரிசை )',
      desc: 'The complete Thirumarai collection',
      icon: 'book-open',
      count: stats?.thirumarai || 421,
    },
    {
      to: '/songs/thirumarai/hope/',
      title: isThanglish ? 'Thirumarai Thirupaadalgal' : 'திருமறைத்திருப் பாடல்கள்',
      sub: isThanglish ? '( Songs of Hope )' : '( நம்பிக்கையின் கீதங்கள் புத்தக வரிசை )',
      desc: 'Nambikaiyin Geethangal collection',
      icon: 'sparkles',
      count: stats?.thirumaraiHope || 255,
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
                <MixedText as="span" size={16} className="song-title">
                  {isThanglish ? song.title_en || song.title_ta : song.title_ta}
                </MixedText>
                {!isThanglish && song.title_en && <span className="song-sub">{song.title_en}</span>}
              </span>
              <span className="result-source">
                {song.collection === 'zion' ? 'Zion' : 'Thirumarai'}
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
        <div className="collection-grid stacked">
          {cards.map((card) => (
            <Link key={card.to} to={card.to} className="collection-card">
              <span className="collection-icon"><Icon name={card.icon} size={24} /></span>
              <span className="collection-text">
                <MixedText as="h3" size={typography.title.fontSize}>{card.title}</MixedText>
                {card.sub && <span className="collection-tamil">{card.sub}</span>}
                <span className="collection-desc">{card.desc}</span>
              </span>
              <span className="collection-count">{card.count}</span>
              <span className="collection-go">Open <Icon name="chevron-right" size={15} /></span>
            </Link>
          ))}
        </div>
      )}

      <div className="lang-toggle" role="group" aria-label="Song language">
        <button
          type="button"
          className={!isThanglish ? 'active' : ''}
          aria-pressed={!isThanglish}
          onClick={() => setThanglish(false)}
        >
          தமிழ்
        </button>
        <button
          type="button"
          className={isThanglish ? 'active' : ''}
          aria-pressed={isThanglish}
          onClick={() => setThanglish(true)}
        >
          Thanglish
        </button>
      </div>

      <button
        type="button"
        className={`btn btn-primary btn-wide offline-save${saved ? ' is-faded' : ''}`}
        disabled={saving || saved}
        onClick={saveOfflineLibrary}
      >
        <Icon name={saving ? 'refresh' : 'download'} size={16} />
        {saving
          ? `Saving songs offline… ${cacheStatus?.cached ?? 0}${cacheStatus?.total ? ` / ${cacheStatus.total}` : ''}`
          : 'Save all songs offline'}
      </button>
    </Page>
  );
}

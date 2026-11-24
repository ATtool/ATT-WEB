import React, { useMemo } from 'react';
import Page from '../components/Page.jsx';
import SongList from '../components/SongList.jsx';
import MixedText from '../components/MixedText.jsx';
import { Link } from '../router.jsx';
import { Loading } from '../components/States.jsx';
import { useData } from '../context/DataContext.jsx';
import { loadMeta } from '../data/api.js';
import { useMeta } from '../lib/useMeta.js';
import { useSettings } from '../context/SettingsContext.jsx';
import Icon from '../components/Icon.jsx';

export function ThirumaraiHub() {
  const { data: meta } = useData('thirumaraiMeta', () => loadMeta('thirumarai'));
  const { typography } = useSettings();
  const hopeCount = useMemo(() => (meta?.songs || []).filter((song) => song.hopeNumber).length, [meta]);

  useMeta(
    'Thirumarai Tamil Songs — Hope & Old Collections | Adventist Tamil Tool',
    'Browse 421 Thirumarai Tamil Christian songs in the Nambikaiyin Geethangal (Hope) and Old collections, with Tamil lyrics and transliteration.'
  );

  return (
    <Page title="Thirumarai" eyebrow="திருமறைப் பாடல்கள்" backFallback="/songs/">
      <div className="collection-grid two">
        <Link to="/songs/thirumarai/hope/" className="collection-card">
          <span className="collection-icon"><Icon name="sparkles" size={24} /></span>
          <span className="collection-count">{hopeCount || 255}</span>
          <MixedText as="h3" size={typography.title.fontSize}>Hope Songs</MixedText>
          <span className="collection-tamil">நம்பிக்கையின் கீதங்கள்</span>
          <span className="collection-desc">Nambikaiyin Geethangal collection</span>
          <span className="collection-go">Open <Icon name="chevron-right" size={15} /></span>
        </Link>
        <Link to="/songs/thirumarai/old/" className="collection-card">
          <span className="collection-icon"><Icon name="book-open" size={24} /></span>
          <span className="collection-count">{meta?.count || 421}</span>
          <MixedText as="h3" size={typography.title.fontSize}>Old Songs</MixedText>
          <span className="collection-tamil">பழைய திருமறைப் பாடல்கள்</span>
          <span className="collection-desc">The complete Thirumarai collection</span>
          <span className="collection-go">Open <Icon name="chevron-right" size={15} /></span>
        </Link>
      </div>
      {!meta && <Loading label="Loading Thirumarai…" />}
      <div className="info-note">
        <Icon name="info" size={17} />
        <p>
          Some songs appear in both collections with different numbers. Both links open the same song page, so your
          favourites stay in sync.
        </p>
      </div>
    </Page>
  );
}

export default function ThirumaraiScreen({ variant }) {
  const { data: meta } = useData('thirumaraiMeta', () => loadMeta('thirumarai'));
  const isHope = variant === 'hope';
  const songs = useMemo(
    () => (isHope ? (meta?.songs || []).filter((song) => song.hopeNumber) : meta?.songs || []),
    [meta, isHope]
  );

  useMeta(
    isHope
      ? 'Thirumarai Hope Songs — Nambikaiyin Geethangal | Adventist Tamil Tool'
      : 'Thirumarai Old Songs — Tamil Lyrics | Adventist Tamil Tool',
    isHope
      ? 'All 255 Nambikaiyin Geethangal (Hope) songs with Tamil lyrics, transliteration, search and favourites.'
      : 'All 421 Thirumarai Tamil Christian songs with Tamil lyrics, Tanglish transliteration, search and favourites.'
  );

  return (
    <Page
      title={isHope ? 'Hope Songs' : 'Thirumarai Songs'}
      eyebrow={isHope ? 'நம்பிக்கையின் கீதங்கள்' : 'திருமறை'}
      backFallback="/songs/thirumarai/"
      actions={meta ? <span className="header-badge">{songs.length}</span> : null}
    >
      <div className="segmented-links">
        <Link to="/songs/thirumarai/hope/" className={`segmented-link ${isHope ? 'active' : ''}`}>
          Hope · {meta ? meta.songs.filter((song) => song.hopeNumber).length : 255}
        </Link>
        <Link to="/songs/thirumarai/old/" className={`segmented-link ${!isHope ? 'active' : ''}`}>
          Old · {meta?.count || 421}
        </Link>
      </div>
      {meta ? (
        <SongList
          meta={{ ...meta, songs }}
          collection="thirumarai"
          variant={variant}
          favoritesKey="@thirumarai_favs"
        />
      ) : (
        <Loading label="Loading Thirumarai songs…" />
      )}
    </Page>
  );
}

import React, { useMemo } from 'react';
import Page from '../components/Page.jsx';
import SongReader from '../components/SongReader.jsx';
import { Loading } from '../components/States.jsx';
import NotFound from './NotFound.jsx';
import { useData } from '../context/DataContext.jsx';
import { loadOtherSongs, loadSong } from '../data/api.js';
import { normalizeOtherSongs } from '../data/other.js';
import { useMeta } from '../lib/useMeta.js';
import { useRoute } from '../router.jsx';

function StandardSong({ collection, id }) {
  const key = `song:${collection}:${id}`;
  const { data: song } = useData(key, () => loadSong(collection, id));

  useMeta(
    song
      ? `${song.number}. ${song.title_ta}${song.title_en ? ` (${song.title_en})` : ''} — Tamil Lyrics | Adventist Tamil Tool`
      : 'Tamil Song | Adventist Tamil Tool',
    song
      ? `Tamil lyrics and Tanglish transliteration for ${song.title_ta}${
          song.title_en ? ` (${song.title_en})` : ''
        }. ${song.firstLine || ''}`
      : 'Tamil Christian song lyrics.'
  );

  if (!id) return <NotFound />;
  if (!song) {
    return (
      <Page title="Song" backFallback={`/songs/${collection}/`}>
        <Loading label="Loading song…" />
      </Page>
    );
  }
  return <SongReader song={song} collection={collection} />;
}

function OtherSong({ id }) {
  const { data: payload } = useData('otherSongs', loadOtherSongs);
  const songs = useMemo(() => normalizeOtherSongs(payload), [payload]);
  const song = songs.find((item) => item.id === id);

  useMeta(
    song
      ? `${song.number}. ${song.title_ta} — Tamil Lyrics | Adventist Tamil Tool`
      : 'Other Songs | Adventist Tamil Tool',
    song ? `Tamil lyrics for ${song.title_ta}${song.title_en ? ` (${song.title_en})` : ''}.` : 'Tamil Christian songs.'
  );

  if (!payload) {
    return (
      <Page title="Song" backFallback="/songs/other/">
        <Loading label="Loading song…" />
      </Page>
    );
  }
  if (!song) return <NotFound />;
  return <SongReader song={song} collection="other" />;
}

export default function SongPage() {
  const route = useRoute();
  if (route.name !== 'song') return <NotFound />;
  if (route.collection === 'other') return <OtherSong id={route.id} />;
  return <StandardSong collection={route.collection} id={route.id} />;
}

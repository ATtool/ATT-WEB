import React, { useMemo, useState } from 'react';
import Page from '../components/Page.jsx';
import SongList from '../components/SongList.jsx';
import Icon from '../components/Icon.jsx';
import { Loading } from '../components/States.jsx';
import { useData, useDataContext } from '../context/DataContext.jsx';
import { loadOtherSongs, fetchLive } from '../data/api.js';
import { normalizeOtherSongs } from '../data/other.js';
import { useChrome } from '../context/ChromeContext.jsx';
import { useMeta } from '../lib/useMeta.js';

export default function OtherSongs() {
  const { data: payload } = useData('otherSongs', loadOtherSongs);
  const { put } = useDataContext();
  const { showToast } = useChrome();
  const [refreshing, setRefreshing] = useState(false);
  const songs = useMemo(() => normalizeOtherSongs(payload), [payload]);

  useMeta(
    'Other Tamil Christian Songs | Adventist Tamil Tool',
    'Additional Tamil Christian songs from the online library, with Tamil lyrics, search and offline reading.'
  );

  const refresh = async () => {
    setRefreshing(true);
    try {
      const live = await fetchLive('otherSongs');
      put('otherSongs', live);
      showToast(`Updated · ${live?.songs?.length || 0} songs`);
    } catch {
      showToast('Could not refresh. Showing the saved list.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Page
      title="Other Songs"
      eyebrow="மற்ற பாடல்கள்"
      backFallback="/songs/"
      actions={
        <button type="button" className="icon-btn" aria-label="Refresh songs" onClick={refresh} disabled={refreshing}>
          <Icon name="refresh" className={refreshing ? 'spin' : ''} />
        </button>
      }
    >
      {payload?.isLive === false && (
        <div className="info-note">
          <Icon name="info" size={17} />
          <p>Live updates are paused by the publisher. The latest saved songs are shown below.</p>
        </div>
      )}
      {payload ? (
        <SongList
          meta={{ songs, categories: [], count: songs.length }}
          collection="other"
          favoritesKey="@other_favs"
        />
      ) : (
        <Loading label="Loading other songs…" />
      )}
    </Page>
  );
}

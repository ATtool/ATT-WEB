import React from 'react';
import Page from '../components/Page.jsx';
import SongList from '../components/SongList.jsx';
import { Loading } from '../components/States.jsx';
import MixedText from '../components/MixedText.jsx';
import { useData } from '../context/DataContext.jsx';
import { loadMeta } from '../data/api.js';
import { useMeta } from '../lib/useMeta.js';
import { useSettings } from '../context/SettingsContext.jsx';

export default function ZionScreen({ categorySlug }) {
  const { data: meta } = useData('zionMeta', () => loadMeta('zion'));
  const { isThanglish } = useSettings();
  const category = categorySlug ? meta?.categories?.find((item) => item.slug === categorySlug) : null;

  const title = category
    ? isThanglish
      ? category.nameEn || category.name
      : category.name
    : 'Zion Songs';
  useMeta(
    category
      ? `${category.name} — Zion Tamil Christian Songs | Adventist Tamil Tool`
      : 'Zion Tamil Christian Songs — 600 Songs | Adventist Tamil Tool',
    category
      ? `Zion songs in the ${category.name}${category.nameEn ? ` (${category.nameEn})` : ''} category with Tamil lyrics and Tanglish transliteration.`
      : 'Browse all 600 Zion Tamil Christian songs with Tamil lyrics, Tanglish transliteration, categories, search and favourites.'
  );

  return (
    <Page
      title={title}
      eyebrow={category ? 'Zion · Category' : 'சீயோன் பாடல்கள்'}
      backFallback="/songs/"
      actions={
        meta ? (
          <span className="header-badge">{category ? category.count : meta.count}</span>
        ) : null
      }
    >
      {category && (
        <div className="category-head">
          <MixedText size={14} className="category-desc">
            {category.nameEn || 'Zion song category'}
          </MixedText>
        </div>
      )}
      {meta ? (
        <SongList
          meta={meta}
          collection="zion"
          favoritesKey="@zion_favs"
          initialCategory={categorySlug || 'All'}
        />
      ) : (
        <Loading label="Loading Zion songs…" />
      )}
    </Page>
  );
}

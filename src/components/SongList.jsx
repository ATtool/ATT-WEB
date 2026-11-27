import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import MixedText from './MixedText.jsx';
import Sheet from './Sheet.jsx';
import { EmptyState } from './States.jsx';
import { Link } from '../router.jsx';
import { songPath } from '../lib/paths.js';
import { useFavorites } from '../lib/favorites.js';
import { useSettings } from '../context/SettingsContext.jsx';

// Same first-letter rule as the mobile app: first Tamil letter or Latin letter.
const letterOf = (title) => {
  const match = String(title || '').match(/[\u0B85-\u0BB9][\u0BBE-\u0BCD]?|[A-Za-z]/);
  return match ? match[0].toUpperCase() : '';
};

const titleOf = (song, isThanglish) =>
  isThanglish ? song.title_en || song.title_ta : song.title_ta;

const categoryOf = (song, isThanglish) =>
  isThanglish ? song.category_en || song.category || '' : song.category || '';

const displayNumber = (song, variant) =>
  variant === 'hope' ? song.hopeNumber || song.number : song.number;

export default function SongList({
  meta,
  collection,
  variant,
  initialCategory = 'All',
  favoritesKey,
}) {
  const songs = meta?.songs || [];
  const categories = meta?.categories || [];
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState('number');
  const [category, setCategory] = useState(initialCategory);
  const [letter, setLetter] = useState('All');
  const [letterMode, setLetterMode] = useState(false);
  const [sheet, setSheet] = useState(null);
  const { isFavorite, toggle, ids } = useFavorites(favoritesKey);
  const { isThanglish } = useSettings();

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setSearch('');
    setFavoritesOnly(false);
    setLetter('All');
    setLetterMode(false);
    setSort('number');
  }, [collection, variant]);

  const letters = useMemo(() => {
    const set = new Set();
    for (const song of songs) {
      const value = letterOf(titleOf(song, isThanglish));
      if (value) set.add(value);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ta'));
  }, [songs, isThanglish]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = songs.filter((song) => {
      if (favoritesOnly && !ids.has(String(song.id))) return false;
      if (category !== 'All' && song.categorySlug !== category) return false;
      if (letter !== 'All' && letterOf(titleOf(song, isThanglish)) !== letter) return false;
      if (!query) return true;
      // Same search rule as the mobile app: number, Tamil title or English title.
      const haystack = `${song.number} ${song.hopeNumber || ''} ${song.title_ta || ''} ${
        song.title_en || ''
      }`.toLowerCase();
      return haystack.includes(query);
    });

    list = [...list];
    if (sort === 'alpha' || letter !== 'All') {
      list.sort((a, b) =>
        String(titleOf(a, isThanglish) || '').localeCompare(String(titleOf(b, isThanglish) || ''), 'ta')
      );
    } else {
      list.sort((a, b) => {
        const av = parseInt(displayNumber(a, variant), 10);
        const bv = parseInt(displayNumber(b, variant), 10);
        return (Number.isFinite(av) ? av : 0) - (Number.isFinite(bv) ? bv : 0);
      });
    }
    return list;
  }, [songs, search, favoritesOnly, category, letter, sort, ids, variant, isThanglish]);

  const activeCategory = categories.find((item) => item.slug === category);
  const activeCategoryLabel = activeCategory
    ? isThanglish
      ? activeCategory.nameEn || activeCategory.name
      : activeCategory.name
    : 'Category';
  const filtersActive = search || favoritesOnly || category !== 'All' || letter !== 'All' || sort !== 'number';

  // --- Filter rules mirrored from the mobile app: filters are mutually exclusive ---
  const handleSearchChange = (value) => {
    setSearch(value);
    setFavoritesOnly(false);
    setCategory('All');
    setLetterMode(false);
    setLetter('All');
  };

  const handleToggleFavorites = () => {
    setFavoritesOnly((value) => !value);
    setSearch('');
    setCategory('All');
    setLetterMode(false);
    setLetter('All');
  };

  const selectNumberOrder = () => {
    setSort('number');
    setLetterMode(false);
    setLetter('All');
    setSheet(null);
  };

  const selectAlphaOrder = () => {
    setSort('alpha');
    setLetterMode(true);
    setLetter('All');
    setSheet(null);
  };

  const handleCategorySelect = (slug) => {
    setCategory(slug);
    setSearch('');
    setFavoritesOnly(false);
    setSort('number');
    setLetterMode(false);
    setLetter('All');
    setSheet(null);
  };

  const pickLetter = (value) => {
    setLetter(value);
    setLetterMode(false);
  };

  const backToLetterGrid = () => {
    setLetter('All');
    setLetterMode(true);
  };

  const clearFilters = () => {
    setSearch('');
    setFavoritesOnly(false);
    setCategory(initialCategory);
    setSort('number');
    setLetterMode(false);
    setLetter('All');
  };

  return (
    <div className="song-list-wrap">
      <div className="list-toolbar">
        <div className="search-field">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search songs / பாடல் / number"
            aria-label="Search songs"
            autoComplete="off"
            spellCheck="false"
          />
          {search && (
            <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setSearch('')}>
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        <div className="chip-row">
          {filtersActive && (
            <button type="button" className="chip chip-clear" onClick={clearFilters}>
              Clear
            </button>
          )}
          <button
            type="button"
            className={`chip ${letterMode ? 'active' : ''}`}
            onClick={() => setSheet('sort')}
          >
            <Icon name="list" size={15} />
            {sort === 'number' ? 'Number' : 'A–Z'}
          </button>
          {categories.length > 0 && (
            <button
              type="button"
              className={`chip ${category !== 'All' ? 'active' : ''}`}
              onClick={() => setSheet('category')}
            >
              <Icon name="book" size={15} />
              {activeCategoryLabel}
            </button>
          )}
          <button
            type="button"
            className={`chip ${favoritesOnly ? 'active' : ''}`}
            onClick={handleToggleFavorites}
          >
            <Icon name="heart" size={15} />
            Favorites
            {ids.size > 0 && <span className="chip-count">{ids.size}</span>}
          </button>
        </div>

        {!letterMode && (
          <div className="list-count">
            {filtered.length} {filtered.length === 1 ? 'song' : 'songs'}
            {letter !== 'All' ? ` · ${letter}` : ''}
          </div>
        )}
      </div>

      {letterMode ? (
        <div>
          <button type="button" className="letter-back" onClick={selectNumberOrder}>
            <Icon name="arrow-left" size={17} />
            Back to Numbers
          </button>
          <div className="letter-grid">
            {letters.map((value) => (
              <button key={value} type="button" className="letter" onClick={() => pickLetter(value)}>
                <MixedText size={15}>{value}</MixedText>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {letter !== 'All' && (
            <button type="button" className="letter-back" onClick={backToLetterGrid}>
              <Icon name="arrow-left" size={17} />
              அகரவரிசைக்குச் செல் (Back)
            </button>
          )}
          {filtered.length === 0 ? (
            <EmptyState
              icon="music"
              title="No songs found"
              text={
                favoritesOnly
                  ? 'Tap the heart on a song to save it here.'
                  : 'Try a different spelling or clear the filters.'
              }
            />
          ) : (
            <div className="song-list">
              {filtered.map((song) => {
                const number = displayNumber(song, variant);
                const title = titleOf(song, isThanglish);
                const sub = isThanglish ? '' : song.title_en;
                const categoryLabel = categoryOf(song, isThanglish);
                return (
                  <Link key={song.id} to={songPath(collection, song)} className="song-row">
                    <span className="song-number">
                      <MixedText size={15}>{number}</MixedText>
                    </span>
                    <span className="song-main">
                      <MixedText as="span" size={16} className="song-title">
                        {title || song.title_ta || song.title_en}
                      </MixedText>
                      {sub && <span className="song-sub">{sub}</span>}
                      {categoryLabel && !activeCategory && <span className="song-cat">{categoryLabel}</span>}
                    </span>
                    <button
                      type="button"
                      className={`fav-btn ${isFavorite(song.id) ? 'active' : ''}`}
                      aria-label={isFavorite(song.id) ? 'Remove from favorites' : 'Add to favorites'}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggle(song.id);
                      }}
                    >
                      <Icon name="heart" size={19} />
                    </button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Sheet open={sheet === 'sort'} title="Sort songs" onClose={() => setSheet(null)}>
        <button type="button" className={`sheet-option ${sort === 'number' ? 'active' : ''}`} onClick={selectNumberOrder}>
          <span>எண் வரிசை (Number order)</span>
          {sort === 'number' && <Icon name="check" size={18} />}
        </button>
        <button type="button" className={`sheet-option ${sort === 'alpha' ? 'active' : ''}`} onClick={selectAlphaOrder}>
          <span>அகரவரிசை (Alphabetical)</span>
          {sort === 'alpha' && <Icon name="check" size={18} />}
        </button>
      </Sheet>

      <Sheet open={sheet === 'category'} title="Select category" onClose={() => setSheet(null)}>
        <button
          type="button"
          className={`sheet-option ${category === 'All' ? 'active' : ''}`}
          onClick={() => handleCategorySelect('All')}
        >
          <span>All categories</span>
          <span className="sheet-meta">{songs.length}</span>
        </button>
        {categories.map((item) => {
          const primary = isThanglish ? item.nameEn || item.name : item.name;
          const secondary = isThanglish ? item.name : item.nameEn;
          return (
            <button
              key={item.slug}
              type="button"
              className={`sheet-option ${category === item.slug ? 'active' : ''}`}
              onClick={() => handleCategorySelect(item.slug)}
            >
              <span>
                <MixedText size={15}>{primary}</MixedText>
                {secondary && <small>{secondary}</small>}
              </span>
              <span className="sheet-meta">{item.count}</span>
            </button>
          );
        })}
      </Sheet>
    </div>
  );
}

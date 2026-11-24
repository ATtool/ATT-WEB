import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import MixedText from './MixedText.jsx';
import Sheet from './Sheet.jsx';
import { EmptyState } from './States.jsx';
import { Link } from '../router.jsx';
import { songPath } from '../lib/paths.js';
import { useFavorites } from '../lib/favorites.js';

const TAMIL_RE = /[\u0B80-\u0BFF]/;

const firstLetter = (title) => {
  for (const char of String(title || '')) {
    if (TAMIL_RE.test(char)) return char;
  }
  const latin = String(title || '').trim().charAt(0).toUpperCase();
  return latin || '#';
};

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

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setSearch('');
    setFavoritesOnly(false);
    setLetter('All');
  }, [collection, variant]);

  const letters = useMemo(() => {
    const set = new Set();
    for (const song of songs) set.add(firstLetter(song.title_ta || song.title_en));
    return [...set].sort((a, b) => a.localeCompare(b, 'ta'));
  }, [songs]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = songs.filter((song) => {
      if (favoritesOnly && !ids.has(String(song.id))) return false;
      if (category !== 'All' && song.categorySlug !== category) return false;
      if (letter !== 'All' && firstLetter(song.title_ta || song.title_en) !== letter) return false;
      if (!query) return true;
      const haystack = `${song.number} ${song.hopeNumber || ''} ${song.title_ta} ${song.title_en} ${
        song.firstLine || ''
      }`.toLowerCase();
      return haystack.includes(query);
    });

    list = [...list];
    if (sort === 'alpha') {
      list.sort((a, b) => String(a.title_ta || a.title_en).localeCompare(String(b.title_ta || b.title_en), 'ta'));
    } else {
      list.sort((a, b) => {
        const av = parseInt(displayNumber(a, variant), 10);
        const bv = parseInt(displayNumber(b, variant), 10);
        return (Number.isFinite(av) ? av : 0) - (Number.isFinite(bv) ? bv : 0);
      });
    }
    return list;
  }, [songs, search, favoritesOnly, category, letter, sort, ids, variant]);

  const activeCategory = categories.find((item) => item.slug === category);
  const filtersActive = search || favoritesOnly || category !== 'All' || letter !== 'All' || sort !== 'number';

  const clearFilters = () => {
    setSearch('');
    setFavoritesOnly(false);
    setCategory(initialCategory);
    setLetter('All');
    setSort('number');
  };

  return (
    <div className="song-list-wrap">
      <div className="list-toolbar">
        <div className="search-field">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
          <button
            type="button"
            className={`chip ${favoritesOnly ? 'active' : ''}`}
            onClick={() => setFavoritesOnly((value) => !value)}
          >
            <Icon name="heart" size={15} />
            Favorites
            {ids.size > 0 && <span className="chip-count">{ids.size}</span>}
          </button>
          <button type="button" className="chip" onClick={() => setSheet('sort')}>
            <Icon name="list" size={15} />
            {sort === 'number' ? 'Number' : 'A–Z'}
          </button>
          {categories.length > 0 && (
            <button type="button" className="chip" onClick={() => setSheet('category')}>
              <Icon name="book" size={15} />
              {activeCategory ? activeCategory.name : 'Category'}
            </button>
          )}
          <button
            type="button"
            className={`chip ${letterMode ? 'active' : ''}`}
            onClick={() => {
              setLetterMode((value) => !value);
              setLetter('All');
            }}
          >
            அ–ஃ
          </button>
          {filtersActive && (
            <button type="button" className="chip chip-clear" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>

        {letterMode && (
          <div className="letter-strip" role="list">
            <button
              type="button"
              className={`letter ${letter === 'All' ? 'active' : ''}`}
              onClick={() => setLetter('All')}
            >
              All
            </button>
            {letters.map((value) => (
              <button
                key={value}
                type="button"
                className={`letter ${letter === value ? 'active' : ''}`}
                onClick={() => setLetter(value)}
              >
                <MixedText size={15}>{value}</MixedText>
              </button>
            ))}
          </div>
        )}

        <div className="list-count">
          {filtered.length} {filtered.length === 1 ? 'song' : 'songs'}
          {letter !== 'All' ? ` · ${letter}` : ''}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="music"
          title="No songs found"
          text={favoritesOnly ? 'Tap the heart on a song to save it here.' : 'Try a different spelling or clear the filters.'}
        />
      ) : (
        <div className="song-list">
          {filtered.map((song) => {
            const number = displayNumber(song, variant);
            return (
              <Link key={song.id} to={songPath(collection, song)} className="song-row">
                <span className="song-number">
                  <MixedText size={15}>{number}</MixedText>
                </span>
                <span className="song-main">
                  <MixedText as="span" size={16} className="song-title">
                    {song.title_ta || song.title_en}
                  </MixedText>
                  {song.title_en && <span className="song-sub">{song.title_en}</span>}
                  {song.category && !activeCategory && <span className="song-cat">{song.category}</span>}
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

      <Sheet open={sheet === 'sort'} title="Sort songs" onClose={() => setSheet(null)}>
        <button
          type="button"
          className={`sheet-option ${sort === 'number' ? 'active' : ''}`}
          onClick={() => {
            setSort('number');
            setSheet(null);
          }}
        >
          <span>Number order</span>
          {sort === 'number' && <Icon name="check" size={18} />}
        </button>
        <button
          type="button"
          className={`sheet-option ${sort === 'alpha' ? 'active' : ''}`}
          onClick={() => {
            setSort('alpha');
            setSheet(null);
          }}
        >
          <span>Alphabetical</span>
          {sort === 'alpha' && <Icon name="check" size={18} />}
        </button>
      </Sheet>

      <Sheet open={sheet === 'category'} title="Select category" onClose={() => setSheet(null)}>
        <button
          type="button"
          className={`sheet-option ${category === 'All' ? 'active' : ''}`}
          onClick={() => {
            setCategory('All');
            setSheet(null);
          }}
        >
          <span>All categories</span>
          <span className="sheet-meta">{songs.length}</span>
        </button>
        {categories.map((item) => (
          <button
            key={item.slug}
            type="button"
            className={`sheet-option ${category === item.slug ? 'active' : ''}`}
            onClick={() => {
              setCategory(item.slug);
              setSheet(null);
            }}
          >
            <span>
              <MixedText size={15}>{item.name}</MixedText>
              {item.nameEn && <small>{item.nameEn}</small>}
            </span>
            <span className="sheet-meta">{item.count}</span>
          </button>
        ))}
      </Sheet>
    </div>
  );
}

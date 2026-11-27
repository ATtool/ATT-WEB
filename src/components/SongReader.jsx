import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import MixedText from './MixedText.jsx';
import Sheet from './Sheet.jsx';
import { SliderRow } from './Controls.jsx';
import { Link, useRouter } from '../router.jsx';
import { songPath } from '../lib/paths.js';
import { parseLyrics, lyricsForMode } from '../lib/lyrics.js';
import { useFavorites } from '../lib/favorites.js';
import { shareText } from '../lib/share.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useChrome } from '../context/ChromeContext.jsx';

const LATIN_RE = /^[A-Za-z]+$/;

function LyricLine({ line, mode }) {
  if (mode === 'combined') {
    return (
      <>
        {String(line.content || ' ')
          .split(/([A-Za-z]+)/)
          .map((part, index) =>
            LATIN_RE.test(part) ? (
              <span key={index} className="lyric-latin">
                {part}
              </span>
            ) : (
              <MixedText key={index}>{part}</MixedText>
            )
          )}
      </>
    );
  }
  return <MixedText>{line.content.trim() === '' ? ' ' : line.content}</MixedText>;
}

export default function SongReader({ song, collection, onClose, variant }) {
  const { goBack, navigate } = useRouter();
  const { isDark, titleSize, setTitleSize, lyricsSize, setLyricsSize, lyricsLineHeight, setLyricsLineHeight, lyricsSpacing, setLyricsSpacing, restoreDefaultTextSettings, isThanglish } = useSettings();
  const { showToast } = useChrome();
  const favoritesKey =
    collection === 'zion' ? '@zion_favs' : collection === 'thirumarai' ? '@thirumarai_favs' : null;
  const { isFavorite, toggle } = useFavorites(favoritesKey || '__none');
  const [mode, setMode] = useState(isThanglish ? 'translit' : 'ta');
  const [textSettings, setTextSettings] = useState(false);

  // The song language follows the Tamil / Thanglish toggle from the Songs tab.
  useEffect(() => {
    setMode(isThanglish ? 'translit' : 'ta');
  }, [isThanglish]);

  const number = variant === 'hope' ? song.hopeNumber || song.number : song.number;
  const displayTitle = isThanglish ? song.title_en || song.title_ta : song.title_ta;
  const navTitle = (item) => (isThanglish ? item.title_en || item.title_ta : item.title_ta);
  const stanzas = useMemo(() => parseLyrics(lyricsForMode(song, mode)), [song, mode]);
  const hasTranslit = !!song.translit;
  const hasCombined = !!song.combined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [song.id]);

  const onShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${number} - ${displayTitle}\n\n${lyricsForMode(song, mode)}`;
    const ok = await shareText({ title: displayTitle, text, url });
    showToast(ok ? 'Song shared' : 'Could not share this song');
  };

  const modeOptions = [
    { value: 'ta', label: 'தமிழ்' },
    ...(hasTranslit ? [{ value: 'translit', label: 'Tanglish' }] : []),
    ...(hasCombined ? [{ value: 'combined', label: 'Mixed' }] : []),
  ];

  return (
    <div className={`reader ${onClose ? 'reader-modal' : ''}`}>
      <header className="reader-header">
        <button
          type="button"
          className="icon-btn"
          aria-label={onClose ? 'Close reader' : 'Go back'}
          onClick={() => (onClose ? onClose() : goBack('/songs/'))}
        >
          <Icon name={onClose ? 'close' : 'arrow-left'} />
        </button>
        <div className="reader-header-title">
          <MixedText size={15}>
            {number} · {displayTitle || song.title_ta || song.title_en}
          </MixedText>
        </div>
        <div className="reader-header-actions">
          {favoritesKey && (
            <button
              type="button"
              className={`icon-btn ${isFavorite(song.id) ? 'is-fav' : ''}`}
              aria-label="Favorite"
              onClick={() => toggle(song.id)}
            >
              <Icon name="heart" />
            </button>
          )}
          <button type="button" className="icon-btn" aria-label="Share song" onClick={onShare}>
            <Icon name="share" />
          </button>
        </div>
      </header>

      <main className="reader-scroll">
        <div className="reader-hero">
          <span className="reader-number">
            <MixedText size={16}>{number}</MixedText>
          </span>
          <MixedText as="h1" size={titleSize} className="reader-title">
            {displayTitle || song.title_ta || song.title_en}
          </MixedText>
          {!isThanglish && song.title_en && <div className="reader-title-en">{song.title_en}</div>}
          <div className="reader-tags">
            {song.category && <span className="tag">{song.category}</span>}
            {collection === 'thirumarai' && song.hopeNumber && song.hopeNumber !== song.number && (
              <span className="tag">Hope #{song.hopeNumber}</span>
            )}
            {collection === 'thirumarai' && <span className="tag">Old #{song.number}</span>}
            {song.category_en && <span className="tag">{song.category_en}</span>}
          </div>
        </div>

        <div className="reader-toolbar">
          <div className="mode-tabs" role="tablist">
            {modeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={mode === option.value}
                className={`mode-tab ${mode === option.value ? 'active' : ''}`}
                onClick={() => setMode(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="reader-tools">
            <button type="button" className="tool-btn" onClick={() => setLyricsSize(lyricsSize - 1)} aria-label="Decrease text size">
              A−
            </button>
            <button type="button" className="tool-btn" onClick={() => setLyricsSize(lyricsSize + 1)} aria-label="Increase text size">
              A+
            </button>
            <button type="button" className="tool-btn" onClick={() => setTextSettings(true)} aria-label="Text settings">
              <Icon name="type" size={17} />
            </button>
          </div>
        </div>

        <div
          className="lyrics"
          style={{
            fontSize: `${lyricsSize}px`,
            lineHeight: `${lyricsLineHeight}px`,
            letterSpacing: `${lyricsSpacing}px`,
          }}
        >
          {stanzas.length === 0 && <p className="lyrics-empty">Lyrics are not available for this song.</p>}
          {stanzas.map((stanza, index) => (
            <div className={`stanza ${stanza.number ? 'numbered' : ''}`} key={`${stanza.number || 's'}-${index}`}>
              {stanza.number && (
                <div className="stanza-num">
                  <MixedText size={lyricsSize}>{stanza.number}</MixedText>
                </div>
              )}
              <div className="stanza-lines">
                {stanza.lines.map((line, lineIndex) => (
                  <div key={lineIndex} className={`lyric-line ${line.isRefrain ? 'refrain' : ''}`}>
                    <LyricLine line={line} mode={mode} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {(song.prev || song.next) && (
          <nav className="reader-nav" aria-label="Song navigation">
            {song.prev ? (
              <Link to={songPath(collection, song.prev)} className="reader-nav-btn">
                <Icon name="chevron-left" size={18} />
                <span>
                  <small>Previous</small>
                  <MixedText size={14}>
                    {song.prev.number} · {navTitle(song.prev)}
                  </MixedText>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {song.next ? (
              <Link to={songPath(collection, song.next)} className="reader-nav-btn next">
                <span>
                  <small>Next</small>
                  <MixedText size={14}>
                    {song.next.number} · {navTitle(song.next)}
                  </MixedText>
                </span>
                <Icon name="chevron-right" size={18} />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}

        <div className="reader-bottom-space" />
      </main>

      <Sheet open={textSettings} title="Text settings" onClose={() => setTextSettings(false)}>
        <SliderRow label="Title size" value={titleSize} min={16} max={30} onChange={setTitleSize} />
        <SliderRow label="Lyrics size" value={lyricsSize} min={12} max={45} onChange={setLyricsSize} />
        <SliderRow label="Line height" value={lyricsLineHeight} min={20} max={70} onChange={setLyricsLineHeight} />
        <SliderRow label="Letter spacing" value={lyricsSpacing} min={0} max={8} onChange={setLyricsSpacing} />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            restoreDefaultTextSettings();
            setTextSettings(false);
            showToast('Text settings restored');
          }}
        >
          Restore defaults
        </button>
      </Sheet>
    </div>
  );
}

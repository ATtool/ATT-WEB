import React, { useEffect, useMemo, useState } from 'react';
import Page from '../components/Page.jsx';
import MixedText from '../components/MixedText.jsx';
import Markdown from '../components/Markdown.jsx';
import Icon from '../components/Icon.jsx';
import { Loading } from '../components/States.jsx';
import { Link, useRoute } from '../router.jsx';
import { mannaPath } from '../lib/paths.js';
import { formatDate } from '../lib/dates.js';
import { useData, useDataContext } from '../context/DataContext.jsx';
import { loadManna, loadMannaIndex, fetchLive } from '../data/api.js';
import { useChrome } from '../context/ChromeContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useMeta } from '../lib/useMeta.js';
import { shareText } from '../lib/share.js';
import { todayISO } from '../lib/dates.js';

const buildIndex = (devotions) => {
  if (!devotions) return null;
  return {
    dates: Object.keys(devotions)
      .sort()
      .reverse()
      .map((date) => {
        const entry = devotions[date] || {};
        return {
          date,
          title: entry.title || '',
          verse: entry.verse || '',
          excerpt: String(entry.content || '').slice(0, 180),
        };
      }),
  };
};

const monthKey = (date) => String(date).slice(0, 7);
const monthLabel = (date) => {
  const [year, month] = String(date).split('-');
  const months = [
    'ஜனவரி',
    'பிப்ரவரி',
    'மார்ச்',
    'ஏப்ரல்',
    'மே',
    'ஜூன்',
    'ஜூலை',
    'ஆகஸ்ட்',
    'செப்டம்பர்',
    'அக்டோபர்',
    'நவம்பர்',
    'டிசம்பர்',
  ];
  return `${months[Number(month) - 1] || month} ${year}`;
};

export function MannaList() {
  const { data: index } = useData('mannaIndex', loadMannaIndex);
  const [live, setLive] = useState(null);
  const [query, setQuery] = useState('');
  const [today, setToday] = useState('');
  const { typography } = useSettings();

  useEffect(() => {
    setToday(todayISO());
  }, []);

  useMeta(
    'Today’s Manna — Tamil Daily Devotions | Adventist Tamil Tool',
    'Read Tamil daily devotions from Today’s Manna. Every devotion is saved for offline reading.'
  );

  useEffect(() => {
    let alive = true;
    fetchLive('manna')
      .then((payload) => {
        if (alive) setLive(buildIndex(payload?.devotions));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const view = live || index;
  const filtered = useMemo(() => {
    // Hide devotions for upcoming dates — only today and past entries are listed.
    const list = (view?.dates || []).filter((item) => !today || item.date <= today);
    const value = query.trim().toLowerCase();
    if (!value) return list;
    return list.filter((item) =>
      `${item.date} ${item.title} ${item.verse}`.toLowerCase().includes(value)
    );
  }, [view, query, today]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      const key = monthKey(item.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <Page title="Today’s Manna" eyebrow="தினமன்னா" backFallback="/">
      <div className="search-field">
        <Icon name="search" size={18} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search devotions…"
          aria-label="Search devotions"
        />
        {query && (
          <button type="button" className="search-clear" aria-label="Clear" onClick={() => setQuery('')}>
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      {!view && <Loading label="Loading devotions…" />}

      {groups.map(([month, items]) => (
        <section className="month-group" key={month}>
          <h2 className="month-title">{monthLabel(`${month}-01`)}</h2>
          {items.map((item) => (
            <Link key={item.date} to={mannaPath(item.date)} className="card devotion-card">
              <div className="devotion-top">
                <span className={`date-pill ${item.date === today ? 'today' : ''}`}>
                  {item.date === today ? 'Today · ' : ''}
                  {formatDate(item.date)}
                </span>
                <Icon name="chevron-right" size={17} />
              </div>
              <MixedText as="h3" size={typography.title.fontSize} className="card-title">{item.title}</MixedText>
              <p className="card-excerpt">{item.verse || item.excerpt}</p>
            </Link>
          ))}
        </section>
      ))}

      {view && filtered.length === 0 && <p className="muted center">No devotions match your search.</p>}
    </Page>
  );
}

export function MannaReader() {
  const route = useRoute();
  const date = route.name === 'manna' ? route.date : null;
  const today = todayISO();
  const key = `manna:${date}`;
  const { data: entry, error } = useData(key, () => loadManna(date));
  const { put } = useDataContext();
  const { showToast } = useChrome();
  const { appFontSize } = useSettings();

  useMeta(
    entry
      ? `${entry.title} — Today’s Manna ${formatDate(entry.date)} | Adventist Tamil Tool`
      : 'Today’s Manna | Adventist Tamil Tool',
    entry ? `${entry.title}. ${String(entry.verse || '').slice(0, 140)}` : 'Tamil daily devotion.'
  );

  useEffect(() => {
    if (!date) return;
    let alive = true;
    fetchLive('manna')
      .then((payload) => {
        const live = payload?.devotions?.[date];
        if (alive && live) {
          put(key, {
            date,
            title: live.title || '',
            verse: live.verse || '',
            content: live.content || '',
            prevDate: entry?.prevDate || null,
            nextDate: entry?.nextDate || null,
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [date, key, put, entry?.prevDate, entry?.nextDate]);

  if (error || (!entry && !date)) {
    return (
      <Page title="Devotion" backFallback="/home/manna/">
        <div className="state">
          <Icon name="wifi-off" size={30} />
          <p>This devotion is not saved offline yet. Open it once while online.</p>
          <Link to="/home/manna/" className="btn btn-ghost">All devotions</Link>
        </div>
      </Page>
    );
  }

  if (!entry) {
    return (
      <Page title="Devotion" backFallback="/home/manna/">
        <Loading label="Loading devotion…" />
      </Page>
    );
  }

  const onShare = async () => {
    const ok = await shareText({
      title: entry.title,
      text: `${entry.title}\n\n${entry.verse}\n\n${entry.content}`,
      url: window.location.href,
    });
    showToast(ok ? 'Devotion shared' : 'Could not share');
  };

  return (
    <Page
      title={formatDate(entry.date)}
      eyebrow="தினமன்னா"
      backFallback="/home/manna/"
      actions={
        <button type="button" className="icon-btn" aria-label="Share devotion" onClick={onShare}>
          <Icon name="share" />
        </button>
      }
    >
      <article className="devotion-reader">
        <MixedText as="h1" size={appFontSize + 8} className="devotion-title">{entry.title}</MixedText>
        {entry.verse && (
          <blockquote className="verse-box">
            <MixedText size={appFontSize + 1}>{entry.verse}</MixedText>
          </blockquote>
        )}
        <Markdown text={entry.content} size={appFontSize + 1} />
      </article>

      <nav className="reader-nav" aria-label="Devotion navigation">
        {entry.prevDate ? (
          <Link to={mannaPath(entry.prevDate)} className="reader-nav-btn">
            <Icon name="chevron-left" size={18} />
            <span>
              <small>Previous</small>
              <MixedText size={14}>{formatDate(entry.prevDate)}</MixedText>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {entry.nextDate && entry.nextDate <= today ? (
          <Link to={mannaPath(entry.nextDate)} className="reader-nav-btn next">
            <span>
              <small>Next</small>
              <MixedText size={14}>{formatDate(entry.nextDate)}</MixedText>
            </span>
            <Icon name="chevron-right" size={18} />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </Page>
  );
}

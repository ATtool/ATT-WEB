import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import MixedText from '../components/MixedText.jsx';
import { Link } from '../router.jsx';
import { mannaPath, sabbathPath, withBase } from '../lib/paths.js';
import { formatDate, parseDateParts, todayISO } from '../lib/dates.js';
import { useData } from '../context/DataContext.jsx';
import { loadHome, fetchLive } from '../data/api.js';
import { useChrome } from '../context/ChromeContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useMeta } from '../lib/useMeta.js';

const parseDMY = (value) => {
  const match = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
};

const pickManna = (devotions, today = todayISO()) => {
  if (!devotions) return null;
  const dates = Object.keys(devotions).sort();
  const date = devotions[today]
    ? today
    : [...dates].reverse().find((item) => item <= today) || dates[dates.length - 1];
  if (!date) return null;
  const entry = devotions[date] || {};
  return {
    date,
    title: entry.title || '',
    verse: entry.verse || '',
    excerpt: String(entry.content || '').slice(0, 240),
  };
};

const currentSabbath = (sabbath, today = todayISO()) => {
  const lessons = Object.entries(sabbath?.lessons || {});
  if (!lessons.length) return null;
  const found = lessons.find(([, lesson]) => {
    const start = parseDMY(lesson?.info?.start_date);
    const end = parseDMY(lesson?.info?.end_date);
    return start && end && today >= start && today <= end;
  });
  const [key, lesson] = found || lessons[lessons.length - 1];
  return {
    quarterTitle: sabbath?.quarter_info?.info?.title || '',
    lessonKey: key,
    lessonTitle: lesson?.info?.title || '',
    start: lesson?.info?.start_date || '',
    end: lesson?.info?.end_date || '',
  };
};

export default function Home() {
  const { data: home } = useData('home', loadHome);
  const [live, setLive] = useState(null);
  const { openDrawer, install, standalone } = useChrome();
  const { typography } = useSettings();

  useMeta(
    'Adventist Tamil Tool — Tamil Songs, Sabbath School & EGW Books',
    'Tamil Christian songs, Today’s Manna, Sabbath School lessons, magazines and EGW books. Works offline on iPhone and Android.'
  );

  useEffect(() => {
    if (!home) return undefined;
    let alive = true;
    const load = async () => {
      const results = await Promise.allSettled([
        fetchLive('manna'),
        fetchLive('updates'),
        fetchLive('magazines'),
        fetchLive('sabbath'),
      ]);
      if (!alive) return;
      const next = { ...home };
      const [manna, updates, magazines, sabbath] = results;
      if (manna.status === 'fulfilled' && manna.value?.devotions) {
        next.manna = pickManna(manna.value.devotions);
      }
      if (updates.status === 'fulfilled' && Array.isArray(updates.value)) {
        next.updates = updates.value.slice(0, 3);
      }
      if (magazines.status === 'fulfilled' && Array.isArray(magazines.value?.magazines)) {
        next.magazine = [...magazines.value.magazines].sort((a, b) =>
          String(b.date_val).localeCompare(String(a.date_val))
        )[0];
      }
      if (sabbath.status === 'fulfilled') {
        next.sabbath = currentSabbath(sabbath.value);
      }
      setLive(next);
    };
    load();
    return () => {
      alive = false;
    };
  }, [home]);

  const view = live || home;
  const counts = view?.counts || {};
  const latestUpdate = view?.updates?.[0];

  const quickLinks = useMemo(
    () => [
      { to: '/songs/', label: 'Songs', sub: 'பாடல்கள்', icon: 'music' },
      { to: '/books/', label: 'Books', sub: 'புத்தகங்கள்', icon: 'books' },
      { to: '/home/manna/', label: 'Manna', sub: 'மன்னா', icon: 'sun' },
      { to: '/home/sabbath-school/', label: 'Sabbath', sub: 'சபாத் பள்ளி', icon: 'book-open' },
      { to: '/home/magazines/', label: 'Magazines', sub: 'இதழ்கள்', icon: 'list' },
      { to: '/home/about/', label: 'About', sub: 'பற்றி', icon: 'info' },
    ],
    []
  );

  return (
    <div className="home">
      <header className="home-header">
        <button type="button" className="icon-btn" aria-label="Open menu" onClick={openDrawer}>
          <Icon name="menu" />
        </button>
        <div className="home-brand">
          <img src={withBase('icons/logo-256.png')} alt="" width="38" height="38" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-ta">அட்வென்டிஸ்ட் தமிழ்</span>
            <span className="brand-en">Adventist Tamil Tool</span>
          </div>
        </div>
        <Link to="/home/settings/" className="icon-btn" aria-label="Settings">
          <Icon name="settings" />
        </Link>
      </header>
      <main className="home-main">
        <section className="home-hero">
          <div className="hero-orb" aria-hidden="true" />
          <span className="hero-kicker">இணையம் இல்லாமலும் பயன்படுத்தலாம்</span>
          <MixedText as="h1" size={typography.display.fontSize + 2} className="hero-title">
            வணக்கம்
          </MixedText>
          <p className="hero-copy">
            Tamil songs, Sabbath School lessons, magazines and Ellen G. White books — all in one place, saved for offline
            use.
          </p>
          <div className="hero-stats">
            <span><strong>{counts.zion || 600}</strong> Zion</span>
            <span><strong>{counts.thirumarai || 421}</strong> Thirumarai</span>
            <span><strong>{counts.books || 30}</strong> Books</span>
          </div>
        </section>

        {latestUpdate && (
          <Link to="/home/updates/" className="update-banner">
            <span className="update-icon"><Icon name="sparkles" size={18} /></span>
            <span className="update-text">
              <strong>{latestUpdate.titleEn || 'What’s new'}</strong>
              <small>{latestUpdate.descEn || latestUpdate.titleTa}</small>
            </span>
            <Icon name="chevron-right" size={18} />
          </Link>
        )}

        <section className="section">
          <div className="section-head">
            <MixedText as="h2" size={typography.h2.fontSize}>Today’s Manna</MixedText>
            <Link to="/home/manna/" className="section-link">All devotions</Link>
          </div>
          {view?.manna ? (
            <Link to={mannaPath(view.manna.date)} className="card manna-card">
              <div className="manna-top">
                <span className="date-pill">{formatDate(view.manna.date)}</span>
                <span className="card-arrow"><Icon name="chevron-right" size={18} /></span>
              </div>
              <MixedText as="h3" size={typography.title.fontSize + 2} className="card-title">
                {view.manna.title}
              </MixedText>
              <p className="card-excerpt">{view.manna.verse || view.manna.excerpt}</p>
              <span className="read-more">Read devotion <Icon name="arrow-up" size={14} className="rot-45" /></span>
            </Link>
          ) : (
            <div className="card skeleton-card">Devotions will appear here.</div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <MixedText as="h2" size={typography.h2.fontSize}>Sabbath School</MixedText>
            <Link to="/home/sabbath-school/" className="section-link">All lessons</Link>
          </div>
          {view?.sabbath ? (
            <Link to={sabbathPath(view.sabbath.lessonKey)} className="card sabbath-card">
              <span className="sabbath-quarter">{view.sabbath.quarterTitle}</span>
              <MixedText as="h3" size={typography.title.fontSize + 1} className="card-title">
                {view.sabbath.lessonTitle}
              </MixedText>
              <div className="sabbath-meta">
                <span><Icon name="calendar" size={14} /> Lesson {view.sabbath.lessonKey}</span>
                <span>{formatDate(view.sabbath.start)} – {formatDate(view.sabbath.end)}</span>
              </div>
            </Link>
          ) : (
            <div className="card skeleton-card">The latest quarter will appear here.</div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <MixedText as="h2" size={typography.h2.fontSize}>Monthly Magazine</MixedText>
            <Link to="/home/magazines/" className="section-link">All issues</Link>
          </div>
          {view?.magazine ? (
            <div className="card magazine-card">
              <div className="magazine-cover" aria-hidden="true">
                <Icon name="book-open" size={30} />
              </div>
              <div className="magazine-info">
                <MixedText as="h3" size={typography.title.fontSize}>{view.magazine.title_tamil}</MixedText>
                <span className="magazine-sub">{view.magazine.title_english}</span>
                <span className="magazine-date">{formatDate(view.magazine.date_val)}</span>
              </div>
              <a
                className="btn btn-primary btn-small"
                href={view.magazine.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open PDF <Icon name="external" size={14} />
              </a>
            </div>
          ) : (
            <div className="card skeleton-card">Magazines will appear here.</div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <MixedText as="h2" size={typography.h2.fontSize}>Explore</MixedText>
          </div>
          <div className="quick-grid">
            {quickLinks.map((item) => (
              <Link key={item.to} to={item.to} className="quick-card">
                <span className="quick-icon"><Icon name={item.icon} size={21} /></span>
                <span className="quick-label">{item.label}</span>
                <span className="quick-sub">{item.sub}</span>
              </Link>
            ))}
          </div>
        </section>

        {!standalone && (
          <section className="install-card">
            <div className="install-icon"><Icon name="download" size={22} /></div>
            <div className="install-copy">
              <strong>Keep it offline</strong>
              <span>Install the app once, then read without internet.</span>
            </div>
            <button type="button" className="btn btn-primary btn-small" onClick={install}>
              Install
            </button>
          </section>
        )}

      </main>
      <footer className="home-footer">
        <span>Adventist Tamil Tool</span>
        <span className="dot">·</span>
        <Link to="/home/about/">About</Link>
        <span className="dot">·</span>
        <Link to="/home/settings/">Settings</Link>
      </footer>
    </div>
  );
}

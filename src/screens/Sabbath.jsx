import React, { useEffect, useRef, useState } from 'react';
import Page from '../components/Page.jsx';
import MixedText from '../components/MixedText.jsx';
import Markdown from '../components/Markdown.jsx';
import Icon from '../components/Icon.jsx';
import { Loading } from '../components/States.jsx';
import NotFound from './NotFound.jsx';
import { Link, useRoute } from '../router.jsx';
import { sabbathPath } from '../lib/paths.js';
import { dayLabel, formatDate, formatRange, todayISO } from '../lib/dates.js';
import { useData, useDataContext } from '../context/DataContext.jsx';
import { loadSabbathDay, loadSabbathIndex, fetchLive } from '../data/api.js';
import { buildSabbathIndex, parseFrontmatter } from '../../shared/sabbath.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useChrome } from '../context/ChromeContext.jsx';
import { useMeta } from '../lib/useMeta.js';
import { shareText } from '../lib/share.js';

const parseDMY = (value) => {
  const match = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
};

const isCurrent = (lesson, today) => {
  const start = parseDMY(lesson.start);
  const end = parseDMY(lesson.end);
  return start && end && today >= start && today <= end;
};

export function SabbathList() {
  const { data: index } = useData('sabbathIndex', loadSabbathIndex);
  const [live, setLive] = useState(null);
  const [today, setToday] = useState('');
  const { typography } = useSettings();

  useEffect(() => {
    setToday(todayISO());
  }, []);

  useMeta(
    'Sabbath School Lessons — Tamil | Adventist Tamil Tool',
    'Read the current Sabbath School quarter in Tamil, with every lesson and daily section saved for offline use.'
  );

  useEffect(() => {
    let alive = true;
    fetchLive('sabbath')
      .then((payload) => {
        if (alive && payload?.lessons) setLive(buildSabbathIndex(payload));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const view = live || index;

  if (!view) {
    return (
      <Page title="Sabbath School" backFallback="/">
        <Loading label="Loading Sabbath School…" />
      </Page>
    );
  }

  return (
    <Page title="Sabbath School" eyebrow="சபாத் பள்ளி" backFallback="/">
      <section className="quarter-hero">
        <span className="quarter-kicker">Current quarter</span>
        <MixedText as="h1" size={typography.h1.fontSize} className="quarter-title">
          {view.quarter.title}
        </MixedText>
        <div className="quarter-dates">
          {formatRange(view.quarter.start, view.quarter.end)}
        </div>
        {view.quarter.description && (
          <div className="quarter-desc">
            <Markdown text={view.quarter.description} size={14} />
          </div>
        )}
      </section>

      <div className="lesson-list">
        {view.lessons.map((lesson) => (
          <article key={lesson.key} className={`card lesson-card ${isCurrent(lesson, today) ? 'current' : ''}`}>
            <div className="lesson-head">
              <span className="lesson-num">{lesson.key}</span>
              <div className="lesson-head-text">
                <MixedText as="h2" size={typography.title.fontSize + 1} className="lesson-title">
                  {lesson.title}
                </MixedText>
                <span className="lesson-dates">{formatRange(lesson.start, lesson.end)}</span>
              </div>
              {isCurrent(lesson, today) && <span className="badge-current">This week</span>}
            </div>
            <div className="day-chips">
              {lesson.days.map((day) => (
                <Link key={day.key} to={sabbathPath(lesson.key, day.key)} className="day-chip">
                  <span className="day-chip-key">{day.key === 'inside-story' ? 'Story' : day.key}</span>
                  <span className="day-chip-title">{day.title}</span>
                </Link>
              ))}
            </div>
            <Link to={sabbathPath(lesson.key)} className="lesson-open">
              Lesson overview <Icon name="chevron-right" size={16} />
            </Link>
          </article>
        ))}
      </div>
    </Page>
  );
}

export function SabbathLesson() {
  const route = useRoute();
  const { data: index } = useData('sabbathIndex', loadSabbathIndex);
  const lesson = index?.lessons?.find((item) => item.key === route.lesson);
  const { typography } = useSettings();

  useMeta(
    lesson
      ? `Lesson ${lesson.key}: ${lesson.title} — Sabbath School | Adventist Tamil Tool`
      : 'Sabbath School Lesson | Adventist Tamil Tool',
    lesson ? `${lesson.title}. ${formatRange(lesson.start, lesson.end)}. Read all daily sections in Tamil.` : 'Sabbath School lesson.'
  );

  if (!index) {
    return (
      <Page title="Sabbath School" backFallback="/home/sabbath-school/">
        <Loading label="Loading lesson…" />
      </Page>
    );
  }
  if (!lesson) return <NotFound />;

  return (
    <Page title={`Lesson ${lesson.key}`} eyebrow={index.quarter.title} backFallback="/home/sabbath-school/">
      <div className="lesson-hero">
        <MixedText as="h1" size={typography.h1.fontSize} className="lesson-hero-title">{lesson.title}</MixedText>
        <span className="lesson-hero-dates">{formatRange(lesson.start, lesson.end)}</span>
      </div>

      <div className="lesson-days-grid">
        {lesson.days.map((day) => (
          <Link key={day.key} to={sabbathPath(lesson.key, day.key)} className="lesson-day-card">
            <span className="lesson-day-key">{day.key === 'inside-story' ? 'Story' : day.key}</span>
            <MixedText as="span" size={15} className="lesson-day-title">{day.title}</MixedText>
            {day.date && <span className="lesson-day-date">{formatDate(day.date)}</span>}
            <Icon name="chevron-right" size={16} />
          </Link>
        ))}
      </div>

      <Link to={sabbathPath(lesson.key, lesson.days[0]?.key || '01')} className="btn btn-primary btn-wide">
        Start reading <Icon name="chevron-right" size={17} />
      </Link>
    </Page>
  );
}

export function SabbathDay() {
  const route = useRoute();
  const lessonKey = route.lesson;
  const dayKey = route.day;
  const key = `sabbath:${lessonKey}:${dayKey}`;
  const { data: entry } = useData(key, () => loadSabbathDay(lessonKey, dayKey));
  const { data: index } = useData('sabbathIndex', loadSabbathIndex);
  const { put } = useDataContext();
  const { showToast } = useChrome();
  const { appFontSize } = useSettings();
  const [read, setRead] = useState([]);
  const entryRef = useRef(null);
  entryRef.current = entry;

  const lesson = index?.lessons?.find((item) => item.key === lessonKey);

  useMeta(
    entry
      ? `${entry.dayTitle} — Lesson ${lessonKey} | Sabbath School | Adventist Tamil Tool`
      : 'Sabbath School | Adventist Tamil Tool',
    entry ? `${entry.dayTitle}. ${entry.lessonTitle}. Tamil Sabbath School lesson.` : 'Tamil Sabbath School lesson.'
  );

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem('@sabbath_read') || '[]');
      setRead(Array.isArray(stored) ? stored : []);
    } catch {
      setRead([]);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    fetchLive('sabbath')
      .then((payload) => {
        const raw = payload?.lessons?.[lessonKey]?.[dayKey];
        if (!raw || !alive) return;
        const { fields, body } = parseFrontmatter(raw);
        const current = entryRef.current || {};
        if (current.content === body) return;
        put(key, {
          ...current,
          lessonKey,
          dayKey,
          lessonTitle: payload?.lessons?.[lessonKey]?.info?.title || current.lessonTitle || '',
          dayTitle: fields.title || current.dayTitle || '',
          date: fields.date || current.date || '',
          quarterTitle: payload?.quarter_info?.info?.title || current.quarterTitle || '',
          content: body,
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [lessonKey, dayKey, key, put]);

  const isRead = read.includes(key);
  const toggleRead = () => {
    const next = isRead ? read.filter((item) => item !== key) : [...read, key];
    setRead(next);
    try {
      window.localStorage.setItem('@sabbath_read', JSON.stringify(next));
    } catch {
      /* ignore */
    }
    showToast(isRead ? 'Marked as unread' : 'Marked as read');
  };

  if (!entry) {
    return (
      <Page title="Sabbath School" backFallback={`/home/sabbath-school/${lessonKey}/`}>
        <Loading label="Loading lesson…" />
      </Page>
    );
  }

  const onShare = async () => {
    const ok = await shareText({
      title: entry.dayTitle,
      text: `${entry.lessonTitle}\n${entry.dayTitle}\n\n${entry.content}`,
      url: window.location.href,
    });
    showToast(ok ? 'Lesson shared' : 'Could not share');
  };

  return (
    <Page
      title={entry.dayTitle || dayLabel(dayKey)}
      eyebrow={`Lesson ${lessonKey} · ${entry.lessonTitle || ''}`}
      backFallback={`/home/sabbath-school/${lessonKey}/`}
      actions={
        <>
          <button
            type="button"
            className={`icon-btn ${isRead ? 'is-read' : ''}`}
            aria-label={isRead ? 'Mark as unread' : 'Mark as read'}
            onClick={toggleRead}
          >
            <Icon name="check" />
          </button>
          <button type="button" className="icon-btn" aria-label="Share lesson" onClick={onShare}>
            <Icon name="share" />
          </button>
        </>
      }
    >
      <div className="day-tabs" role="tablist">
        {(lesson?.days || []).map((day) => (
          <Link
            key={day.key}
            to={sabbathPath(lessonKey, day.key)}
            className={`day-tab ${day.key === dayKey ? 'active' : ''}`}
          >
            {day.key === 'inside-story' ? 'Story' : day.key}
          </Link>
        ))}
      </div>

      <div className="day-meta">
        <span>{formatDate(entry.date)}</span>
        {isRead && <span className="read-badge"><Icon name="check" size={13} /> Read</span>}
      </div>

      <article className="sabbath-content">
        <Markdown text={entry.content} size={appFontSize + 1} />
      </article>

      <nav className="reader-nav" aria-label="Lesson navigation">
        {entry.prev ? (
          <Link to={sabbathPath(entry.prev.lesson, entry.prev.day)} className="reader-nav-btn">
            <Icon name="chevron-left" size={18} />
            <span>
              <small>Previous</small>
              <MixedText size={14}>{entry.prev.title}</MixedText>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {entry.next ? (
          <Link to={sabbathPath(entry.next.lesson, entry.next.day)} className="reader-nav-btn next">
            <span>
              <small>Next</small>
              <MixedText size={14}>{entry.next.title}</MixedText>
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

import React, { useEffect, useMemo, useState } from 'react';
import Page from '../components/Page.jsx';
import MixedText from '../components/MixedText.jsx';
import Icon from '../components/Icon.jsx';
import { Loading } from '../components/States.jsx';
import { useData, useDataContext } from '../context/DataContext.jsx';
import { fetchLive, loadMagazines } from '../data/api.js';
import { formatDate } from '../lib/dates.js';
import { useMeta } from '../lib/useMeta.js';
import { useChrome } from '../context/ChromeContext.jsx';

export default function Magazines() {
  const { data } = useData('magazines', loadMagazines);
  const { put } = useDataContext();
  const { showToast } = useChrome();
  const [year, setYear] = useState('All');

  useMeta(
    'Tamil Adventist Magazines — Monthly Issues | Adventist Tamil Tool',
    'Browse monthly Tamil Adventist magazines and open each issue as a PDF.'
  );

  useEffect(() => {
    let alive = true;
    fetchLive('magazines')
      .then((payload) => {
        if (alive && Array.isArray(payload?.magazines)) put('magazines', payload);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [put]);

  const magazines = useMemo(
    () =>
      [...(data?.magazines || [])].sort((a, b) => String(b.date_val).localeCompare(String(a.date_val))),
    [data]
  );
  const years = useMemo(
    () => [...new Set(magazines.map((item) => String(item.date_val || '').slice(0, 4)).filter(Boolean))],
    [magazines]
  );
  const filtered = year === 'All' ? magazines : magazines.filter((item) => String(item.date_val).startsWith(year));

  return (
    <Page title="Magazines" eyebrow="இதழ்கள்" backFallback="/">
      {years.length > 1 && (
        <div className="chip-row year-row">
          <button type="button" className={`chip ${year === 'All' ? 'active' : ''}`} onClick={() => setYear('All')}>
            All years
          </button>
          {years.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${year === value ? 'active' : ''}`}
              onClick={() => setYear(value)}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      {!data && <Loading label="Loading magazines…" />}

      <div className="magazine-list">
        {filtered.map((item, index) => (
          <a
            key={item.id}
            className="magazine-row card"
            href={item.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => showToast('Opening the PDF in a new tab…')}
          >
            <span className="magazine-thumb" aria-hidden="true">
              <Icon name="book-open" size={24} />
            </span>
            <span className="magazine-row-info">
              <span className="magazine-row-top">
                <MixedText as="span" size={16} className="magazine-row-title">{item.title_tamil}</MixedText>
                {index === 0 && year === 'All' && <span className="badge-latest">Latest</span>}
              </span>
              <span className="magazine-row-en">{item.title_english}</span>
              <span className="magazine-row-date">{formatDate(item.date_val)}</span>
            </span>
            <Icon name="external" size={18} />
          </a>
        ))}
      </div>

      {data && filtered.length === 0 && <p className="muted center">No magazines for this year.</p>}

      <div className="info-note">
        <Icon name="info" size={17} />
        <p>Magazines open as PDFs in your browser. An internet connection is required to read them.</p>
      </div>
    </Page>
  );
}

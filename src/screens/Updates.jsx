import React, { useEffect, useState } from 'react';
import Page from '../components/Page.jsx';
import MixedText from '../components/MixedText.jsx';
import Icon from '../components/Icon.jsx';
import { Loading } from '../components/States.jsx';
import { Link } from '../router.jsx';
import { useData, useDataContext } from '../context/DataContext.jsx';
import { fetchLive, loadUpdates } from '../data/api.js';
import { formatDate } from '../lib/dates.js';
import { useMeta } from '../lib/useMeta.js';

const TARGETS = {
  TodaysManna: { to: '/home/manna/', label: 'Read Manna' },
  SabbathSchool: { to: '/home/sabbath-school/', label: 'Open Sabbath School' },
  Magazine: { to: '/home/magazines/', label: 'Open magazines' },
  Magazines: { to: '/home/magazines/', label: 'Open magazines' },
  Home: { to: '/', label: 'Go home' },
};

export default function Updates() {
  const { data } = useData('updates', loadUpdates);
  const { put } = useDataContext();
  const [live, setLive] = useState(null);

  useMeta('App Updates | Adventist Tamil Tool', 'The latest content and feature updates for Adventist Tamil Tool.');

  useEffect(() => {
    let alive = true;
    fetchLive('updates')
      .then((payload) => {
        if (alive && Array.isArray(payload)) {
          setLive(payload);
          put('updates', payload);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [put]);

  const updates = live || data;

  return (
    <Page title="Updates" eyebrow="புதுப்பிப்புகள்" backFallback="/">
      {!updates && <Loading label="Loading updates…" />}
      <div className="update-list">
        {(updates || []).map((item) => {
          const target = TARGETS[item.targetScreen];
          return (
            <article key={item.id} className="card update-card">
              <div className="update-card-top">
                <span className="date-pill">{formatDate(item.date)}</span>
                {item.isForced && <span className="badge-forced">Important</span>}
              </div>
              <MixedText as="h2" size={18} className="update-title">{item.titleTa || item.titleEn}</MixedText>
              <p className="update-desc">{item.descTa || item.descEn}</p>
              {item.descTa && item.descEn && <p className="update-desc en">{item.descEn}</p>}
              {target && (
                <Link to={target.to} className="btn btn-primary btn-small">
                  {item.buttonTextTa || target.label} <Icon name="chevron-right" size={15} />
                </Link>
              )}
            </article>
          );
        })}
      </div>
      {updates && updates.length === 0 && <p className="muted center">No updates right now.</p>}
      <div className="info-note">
        <Icon name="info" size={17} />
        <p>Updates about Bible, Concordance and Study sections are not shown because those sections are not part of this app.</p>
      </div>
    </Page>
  );
}

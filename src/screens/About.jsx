import React from 'react';
import Page from '../components/Page.jsx';
import MixedText from '../components/MixedText.jsx';
import Icon from '../components/Icon.jsx';
import { withBase } from '../lib/paths.js';
import { useMeta } from '../lib/useMeta.js';
import { useSettings } from '../context/SettingsContext.jsx';

const FEATURES = [
  { icon: 'music', title: 'Tamil songs', text: 'Zion, Thirumarai and other songs with Tanglish transliteration.' },
  { icon: 'book-open', title: 'Sabbath School', text: 'The current quarter with every daily section.' },
  { icon: 'sun', title: 'Daily Manna', text: 'Tamil devotions for every day of the year.' },
  { icon: 'books', title: 'EGW library', text: '30 Ellen G. White books in Tamil.' },
];

export default function About() {
  const { typography } = useSettings();
  useMeta(
    'About Adventist Tamil Tool | Tamil Songs, Sabbath School & Books',
    'Adventist Tamil Tool is a free, offline-friendly Tamil Adventist app with songs, daily devotions, Sabbath School lessons and Ellen G. White books.'
  );

  return (
    <Page title="About" eyebrow="எங்களைப் பற்றி" backFallback="/">
      <div className="about-hero">
        <img src={withBase('icons/logo-256.png')} alt="Adventist Tamil Tool" width="96" height="96" className="about-logo" />
        <MixedText as="h1" size={typography.h1.fontSize}>Adventist Tamil Tool</MixedText>
        <span className="about-version">Version 1.0.0 · Free · No ads</span>
        <p className="about-lead">
          A quiet place for Tamil Adventist songs, daily devotions, Sabbath School and Ellen G. White books — built to
          keep working when the internet does not.
        </p>
      </div>

      <section className="settings-section">
        <h2 className="settings-title">What is inside</h2>
        <div className="feature-list">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-row">
              <span className="feature-icon"><Icon name={feature.icon} size={19} /></span>
              <span>
                <strong>{feature.title}</strong>
                <small>{feature.text}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-title">Connect</h2>
        <a
          className="setting-link"
          href="https://whatsapp.com/channel/0029Vb6Pu8FLI8YfM5H49e0p"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="setting-link-icon"><Icon name="sparkles" size={18} /></span>
          <span>WhatsApp channel<small>Updates and new songs</small></span>
          <Icon name="external" size={17} />
        </a>
        <a
          className="setting-link"
          href="https://play.google.com/store/apps/details?id=com.adventisttamiltool.adventisttamiltool"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="setting-link-icon"><Icon name="download" size={18} /></span>
          <span>Android app<small>Get it on Google Play</small></span>
          <Icon name="external" size={17} />
        </a>
        <a className="setting-link" href="mailto:adventisttamiltool@gmail.com">
          <span className="setting-link-icon"><Icon name="mail" size={18} /></span>
          <span>Email<small>adventisttamiltool@gmail.com</small></span>
          <Icon name="chevron-right" size={18} />
        </a>
      </section>

      <section className="settings-section">
        <h2 className="settings-title">Credits & notes</h2>
        <p className="about-copy">
          Song lyrics, devotions, Sabbath School lessons and magazines are published by their respective Tamil Adventist
          ministries. Ellen G. White books are linked from the public library. This app is a free reading tool and does
          not claim ownership of the texts.
        </p>
        <p className="about-copy">
          Tamil text is rendered with the same two custom fonts used by the mobile app. Your favourites, custom songs and
          reading settings are stored only in this browser.
        </p>
      </section>

      <div className="about-footer">
        <Icon name="heart" size={16} />
        <span>Made for the Tamil Adventist community</span>
      </div>
    </Page>
  );
}

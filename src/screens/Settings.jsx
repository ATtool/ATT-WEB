import React, { useEffect, useState } from 'react';
import Page from '../components/Page.jsx';
import MixedText from '../components/MixedText.jsx';
import Icon from '../components/Icon.jsx';
import { SliderRow, Segmented } from '../components/Controls.jsx';
import { Link } from '../router.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useChrome } from '../context/ChromeContext.jsx';
import { useMeta } from '../lib/useMeta.js';

const formatBytes = (bytes) => {
  if (!bytes || bytes < 1) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
};

export default function Settings() {
  const {
    isDark,
    setTheme,
    appFontSize,
    setAppFontSize,
    titleSize,
    setTitleSize,
    lyricsSize,
    setLyricsSize,
    lyricsLineHeight,
    setLyricsLineHeight,
    lyricsSpacing,
    setLyricsSpacing,
    restoreDefaultTextSettings,
  } = useSettings();
  const { install, standalone, showToast } = useChrome();
  const [estimate, setEstimate] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);

  useMeta('Settings | Adventist Tamil Tool', 'Theme, text size, offline storage and app settings.');

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(setEstimate).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const onMessage = (event) => {
      if (event.data?.type === 'CACHE_STATUS' || event.data?.type === 'CACHE_PROGRESS') {
        setCacheStatus(event.data);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    navigator.serviceWorker.ready
      .then((registration) => registration.active?.postMessage({ type: 'GET_STATUS' }))
      .catch(() => {});
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  const saveOfflineLibrary = async () => {
    if (!('serviceWorker' in navigator)) {
      showToast('Offline saving is not supported in this browser.');
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: 'CACHE_LIBRARY' });
    showToast('Saving the full song library for offline use…', 4000);
  };

  const clearOfflineCache = async () => {
    if (!window.confirm('Clear all offline data? The app will need internet on the next visit.')) return;
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    setCacheStatus(null);
    showToast('Offline cache cleared');
  };

  return (
    <Page title="Settings" eyebrow="அமைப்புகள்" backFallback="/">
      <section className="settings-section">
        <h2 className="settings-title">Appearance</h2>
        <div className="setting-row">
          <span>Theme</span>
          <Segmented
            value={isDark ? 'dark' : 'light'}
            onChange={setTheme}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
          />
        </div>
        <SliderRow label="App font size" value={appFontSize} min={12} max={24} onChange={setAppFontSize} suffix="px" />
        <div className="preview-card">
          <MixedText as="h3" size={titleSize}>கிருபையின் தேவன்</MixedText>
          <MixedText size={lyricsSize} className="preview-lyrics">
            Amazing grace, how sweet the sound — கிருபையால் மீட்கப்பட்டோம்.
          </MixedText>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-title">Song reading</h2>
        <SliderRow label="Title size" value={titleSize} min={16} max={30} onChange={setTitleSize} suffix="px" />
        <SliderRow label="Lyrics size" value={lyricsSize} min={12} max={45} onChange={setLyricsSize} suffix="px" />
        <SliderRow label="Line height" value={lyricsLineHeight} min={20} max={70} onChange={setLyricsLineHeight} suffix="px" />
        <SliderRow label="Letter spacing" value={lyricsSpacing} min={0} max={8} onChange={setLyricsSpacing} suffix="px" />
        <button type="button" className="btn btn-ghost btn-wide" onClick={() => { restoreDefaultTextSettings(); showToast('Reading settings restored'); }}>
          Restore default text settings
        </button>
      </section>

      <section className="settings-section">
        <h2 className="settings-title">Offline library</h2>
        <div className="storage-card">
          <div className="storage-row">
            <span><Icon name="download" size={16} /> Saved songs</span>
            <strong>{cacheStatus ? `${cacheStatus.cached} / ${cacheStatus.total}` : '—'}</strong>
          </div>
          <div className="storage-bar">
            <span
              style={{
                width: cacheStatus && cacheStatus.total ? `${Math.min(100, (cacheStatus.cached / cacheStatus.total) * 100)}%` : '0%',
              }}
            />
          </div>
          <div className="storage-row">
            <span><Icon name="globe" size={16} /> Browser storage used</span>
            <strong>{estimate ? formatBytes(estimate.usage) : '—'}</strong>
          </div>
        </div>
        <div className="settings-buttons">
          <button type="button" className="btn btn-primary" onClick={saveOfflineLibrary}>
            Save all songs offline
          </button>
          <button type="button" className="btn btn-ghost" onClick={clearOfflineCache}>
            Clear offline cache
          </button>
        </div>
        <p className="settings-hint">
          Songs and lessons are saved automatically as you open them. “Save all songs offline” downloads the complete
          library in the background.
        </p>
      </section>

      <section className="settings-section">
        <h2 className="settings-title">App</h2>
        {!standalone && (
          <button type="button" className="setting-link" onClick={install}>
            <span className="setting-link-icon"><Icon name="download" size={18} /></span>
            <span>Install on this device<small>Works offline after the first visit</small></span>
            <Icon name="chevron-right" size={18} />
          </button>
        )}
        <Link to="/home/about/" className="setting-link">
          <span className="setting-link-icon"><Icon name="info" size={18} /></span>
          <span>About Adventist Tamil Tool<small>Version 1.0.0</small></span>
          <Icon name="chevron-right" size={18} />
        </Link>
        <div className="settings-note">
          <Icon name="check" size={16} />
          <p>No account, no ads. Your favourites, custom songs and reading settings stay on this device.</p>
        </div>
      </section>
    </Page>
  );
}

import React from 'react';
import Icon from './Icon.jsx';
import MixedText from './MixedText.jsx';
import { Link, useRoute } from '../router.jsx';
import { withBase } from '../lib/paths.js';
import { useChrome } from '../context/ChromeContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

const DRAWER_LINKS = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/songs/', label: 'Songs', icon: 'music' },
  { to: '/books/', label: 'Books', icon: 'books' },
  { to: '/home/manna/', label: "Today's Manna", icon: 'sun' },
  { to: '/home/sabbath-school/', label: 'Sabbath School', icon: 'book-open' },
  { to: '/home/magazines/', label: 'Magazines', icon: 'list' },
  { to: '/home/settings/', label: 'Settings', icon: 'settings' },
  { to: '/home/about/', label: 'About', icon: 'info' },
];

function Drawer() {
  const { drawerOpen, closeDrawer, install, standalone } = useChrome();
  const { isDark, toggleTheme } = useSettings();

  return (
    <div className={`drawer-root ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
      <button type="button" className="drawer-backdrop" aria-label="Close menu" onClick={closeDrawer} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="drawer-head">
          <img src={withBase('icons/logo-256.png')} alt="" width="46" height="46" className="drawer-logo" />
          <div>
            <div className="drawer-title">Adventist Tamil Tool</div>
            <div className="drawer-sub">Songs · Home · Books</div>
          </div>
          <button type="button" className="icon-btn drawer-close" aria-label="Close menu" onClick={closeDrawer}>
            <Icon name="close" />
          </button>
        </div>

        <nav className="drawer-nav">
          {DRAWER_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="drawer-link" onClick={closeDrawer}>
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="drawer-footer">
          <button type="button" className="drawer-action" onClick={toggleTheme}>
            <Icon name={isDark ? 'sun' : 'moon'} size={20} />
            <span>{isDark ? 'Light theme' : 'Dark theme'}</span>
          </button>
          {!standalone && (
            <button type="button" className="drawer-action" onClick={() => { closeDrawer(); install(); }}>
              <Icon name="download" size={20} />
              <span>Install app</span>
            </button>
          )}
          <div className="drawer-version">Offline PWA · v1.0.0</div>
        </div>
      </aside>
    </div>
  );
}

function BottomNav() {
  const route = useRoute();
  const songsActive = ['songs', 'zion', 'zionCategory', 'thirumarai', 'thirumaraiList', 'song'].includes(route.name);
  const homeActive =
    route.name === 'home' ||
    ['mannaList', 'manna', 'sabbathList', 'sabbathLesson', 'sabbathDay', 'magazines', 'settings', 'about'].includes(
      route.name
    );
  const booksActive = ['books', 'book'].includes(route.name);

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <Link to="/songs/" className={`tab ${songsActive ? 'active' : ''}`} aria-current={songsActive ? 'page' : undefined}>
        <Icon name="music" size={23} />
        <span>Songs</span>
      </Link>
      <Link to="/" className={`tab ${homeActive ? 'active' : ''}`} aria-current={homeActive ? 'page' : undefined}>
        <Icon name="home" size={23} />
        <span>Home</span>
      </Link>
      <Link to="/books/" className={`tab ${booksActive ? 'active' : ''}`} aria-current={booksActive ? 'page' : undefined}>
        <Icon name="books" size={23} />
        <span>Books</span>
      </Link>
    </nav>
  );
}

function IosInstallModal() {
  const { iosHelp, setIosHelp } = useChrome();
  if (!iosHelp) return null;
  return (
    <div className="modal-backdrop" role="presentation" onClick={() => setIosHelp(false)}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Install on iPhone" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <MixedText as="h2" size={22}>Install on iPhone</MixedText>
          <button type="button" className="icon-btn" aria-label="Close" onClick={() => setIosHelp(false)}>
            <Icon name="close" />
          </button>
        </div>
        <p className="modal-copy">Safari does not show an install button. Add the app to your Home Screen:</p>
        <ol className="install-steps">
          <li>Tap the <strong>Share</strong> button in Safari.</li>
          <li>Scroll and tap <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong>. Open the app once online so it can save everything for offline use.</li>
        </ol>
        <button type="button" className="btn btn-primary" onClick={() => setIosHelp(false)}>Got it</button>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const { online, toast } = useChrome();
  return (
    <div className="app">
      <div className="app-frame">{children}</div>
      <BottomNav />
      <Drawer />
      <IosInstallModal />
      {!online && (
        <div className="offline-pill" role="status">
          <Icon name="wifi-off" size={16} />
          <span>Offline — saved content</span>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

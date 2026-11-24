import React from 'react';
import Icon from './Icon.jsx';
import MixedText from './MixedText.jsx';
import { useChrome } from '../context/ChromeContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useRouter } from '../router.jsx';

export default function Page({
  title,
  eyebrow,
  back = true,
  actions = null,
  children,
  className = '',
  hideHeader = false,
  backFallback = '/',
}) {
  const { goBack } = useRouter();
  const { openDrawer } = useChrome();
  const { typography } = useSettings();

  return (
    <div className={`page ${className}`.trim()}>
      {!hideHeader && (
        <header className="page-header">
          <div className="header-inner">
            <button
              type="button"
              className="icon-btn"
              aria-label={back ? 'Go back' : 'Open menu'}
              onClick={() => (back ? goBack(backFallback) : openDrawer())}
            >
              <Icon name={back ? 'arrow-left' : 'menu'} />
            </button>
            <div className="header-titles">
              {eyebrow && <span className="eyebrow">{eyebrow}</span>}
              <MixedText as="h1" size={typography.h1.fontSize} className="header-title">
                {title}
              </MixedText>
            </div>
            <div className="header-actions">{actions}</div>
          </div>
        </header>
      )}
      <main className="page-body">{children}</main>
    </div>
  );
}

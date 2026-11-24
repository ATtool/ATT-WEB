import React from 'react';
import Icon from './Icon.jsx';
import MixedText from './MixedText.jsx';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <MixedText size={14}>{label}</MixedText>
    </div>
  );
}

export function ErrorState({ message = 'This content is not available offline yet.', onRetry }) {
  return (
    <div className="state">
      <Icon name="wifi-off" size={30} />
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = 'search', title = 'Nothing here yet', text }) {
  return (
    <div className="state">
      <Icon name={icon} size={32} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}

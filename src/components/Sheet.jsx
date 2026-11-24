import React from 'react';
import Icon from './Icon.jsx';
import MixedText from './MixedText.jsx';

export default function Sheet({ open, title, onClose, children, className = '' }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`sheet ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          {title ? <MixedText as="h2" size={18}>{title}</MixedText> : <span />}
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

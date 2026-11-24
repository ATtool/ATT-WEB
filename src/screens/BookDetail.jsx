import React from 'react';
import Page from '../components/Page.jsx';
import MixedText from '../components/MixedText.jsx';
import Icon from '../components/Icon.jsx';
import NotFound from './NotFound.jsx';
import { Link, useRoute } from '../router.jsx';
import { EGW_BOOKS_DATA } from '../data/books.js';
import { useMeta } from '../lib/useMeta.js';
import { useChrome } from '../context/ChromeContext.jsx';
import { shareText } from '../lib/share.js';
import { useSettings } from '../context/SettingsContext.jsx';

export default function BookDetail() {
  const route = useRoute();
  const book = EGW_BOOKS_DATA.find((item) => item.id === route.id);
  const { showToast } = useChrome();
  const { typography } = useSettings();

  useMeta(
    book
      ? `${book.title_english} — Tamil (${book.title_tamil}) | Adventist Tamil Tool`
      : 'Book | Adventist Tamil Tool',
    book
      ? `Read or download ${book.title_english} in Tamil${book.title_tamil ? ` (${book.title_tamil})` : ''} by Ellen G. White.`
      : 'Tamil Ellen G. White books.'
  );

  if (!book) return <NotFound />;

  const onShare = async () => {
    const ok = await shareText({
      title: book.title_english,
      text: `${book.title_tamil}\n${book.title_english}`,
      url: window.location.href,
    });
    showToast(ok ? 'Link shared' : 'Could not share');
  };

  return (
    <Page
      title="Book"
      eyebrow="புத்தகம்"
      backFallback="/books/"
      actions={
        <button type="button" className="icon-btn" aria-label="Share book" onClick={onShare}>
          <Icon name="share" />
        </button>
      }
    >
      <div className="book-detail-hero">
        <span className="book-detail-cover" aria-hidden="true">
          <Icon name="book-open" size={46} />
        </span>
        <MixedText as="h1" size={typography.h1.fontSize} className="book-detail-title">
          {book.title_tamil}
        </MixedText>
        <span className="book-detail-en">{book.title_english}</span>
        <span className="tag">Ellen G. White</span>
      </div>

      <div className="book-actions">
        {book.pdf_url && (
          <a className="btn btn-primary btn-wide" href={book.pdf_url} target="_blank" rel="noopener noreferrer">
            <Icon name="download" size={18} /> Download PDF
          </a>
        )}
        {book.website_url && (
          <a className="btn btn-ghost btn-wide" href={book.website_url} target="_blank" rel="noopener noreferrer">
            <Icon name="globe" size={18} /> Read online
          </a>
        )}
        {!book.pdf_url && !book.website_url && <p className="muted">No link is available for this book yet.</p>}
      </div>

      <div className="info-note">
        <Icon name="external" size={17} />
        <p>
          Links open in a new browser tab. PDF downloads and online reading require an internet connection and are not
          stored offline.
        </p>
      </div>

      <div className="book-about card">
        <MixedText as="h2" size={typography.h2.fontSize}>About this book</MixedText>
        <p>
          A Tamil translation of <strong>{book.title_english}</strong> from the writings of Ellen G. White, provided for
          personal study and devotional reading.
        </p>
      </div>

      <Link to="/books/" className="back-link">
        <Icon name="chevron-left" size={16} /> All books
      </Link>
    </Page>
  );
}

import React from 'react';
import Page from '../components/Page.jsx';
import MixedText from '../components/MixedText.jsx';
import Icon from '../components/Icon.jsx';
import { Link } from '../router.jsx';
import { EGW_BOOKS_DATA } from '../data/books.js';
import { useMeta } from '../lib/useMeta.js';
import { useSettings } from '../context/SettingsContext.jsx';

const hues = [188, 42, 268, 12, 152, 212, 320, 96, 240, 24];

export default function BooksScreen() {
  const { typography } = useSettings();

  useMeta(
    'Tamil EGW Books — Ellen G. White Library | Adventist Tamil Tool',
    'Read or download 30 Ellen G. White books in Tamil, including Steps to Christ, The Desire of Ages and The Great Controversy.'
  );

  return (
    <Page title="Books" eyebrow="புத்தகங்கள்" back={false}>
      <div className="books-intro">
        <MixedText as="h2" size={typography.h2.fontSize}>Ellen G. White Library</MixedText>
        <p>30 Tamil books. Open a book to download the PDF or read it online.</p>
      </div>

      <div className="book-grid">
        {EGW_BOOKS_DATA.map((book, index) => (
          <Link key={book.id} to={`/books/${book.id}/`} className="book-card">
            <span
              className="book-cover"
              style={{ '--book-hue': hues[index % hues.length] }}
              aria-hidden="true"
            >
              <Icon name="book-open" size={24} />
            </span>
            <MixedText as="h3" size={15} className="book-title">{book.title_tamil}</MixedText>
            <span className="book-en">{book.title_english}</span>
          </Link>
        ))}
      </div>

      <div className="info-note">
        <Icon name="info" size={17} />
        <p>PDFs open in your browser and need an internet connection. The book list itself is available offline.</p>
      </div>
    </Page>
  );
}

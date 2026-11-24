import React, { useEffect, useRef, useState } from 'react';
import Page from '../components/Page.jsx';
import SongReader from '../components/SongReader.jsx';
import MixedText from '../components/MixedText.jsx';
import Icon from '../components/Icon.jsx';
import Sheet from '../components/Sheet.jsx';
import { EmptyState } from '../components/States.jsx';
import { useChrome } from '../context/ChromeContext.jsx';
import { useMeta } from '../lib/useMeta.js';

const STORAGE_KEY = '@custom_songs';

const emptyForm = { title_ta: '', title_en: '', lyrics: '' };

const readSongs = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function CustomSongs() {
  const { showToast } = useChrome();
  const [songs, setSongs] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);
  const fileRef = useRef(null);

  useMeta('My Songs — Custom Tamil Songs | Adventist Tamil Tool', 'Add your own Tamil Christian songs and keep them offline on this device.');

  useEffect(() => {
    setSongs(readSongs());
  }, []);

  const persist = (next) => {
    setSongs(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      showToast('Storage is full. Could not save.');
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (song) => {
    setEditing(song);
    setForm({ title_ta: song.title_ta || '', title_en: song.title_en || '', lyrics: song.lyrics || '' });
    setFormOpen(true);
  };

  const save = () => {
    if (!form.title_ta.trim() || !form.lyrics.trim()) {
      showToast('Add a Tamil title and the lyrics.');
      return;
    }
    if (editing) {
      persist(
        songs.map((song) =>
          song.id === editing.id
            ? { ...song, title_ta: form.title_ta.trim(), title_en: form.title_en.trim(), lyrics: form.lyrics }
            : song
        )
      );
      showToast('Song updated');
    } else {
      const nextId = songs.length ? Math.max(...songs.map((song) => Number(song.id) || 0)) + 1 : 1;
      persist([
        ...songs,
        {
          id: nextId,
          title_ta: form.title_ta.trim(),
          title_en: form.title_en.trim(),
          lyrics: form.lyrics,
          created_at: new Date().toISOString(),
        },
      ]);
      showToast('Song added');
    }
    setFormOpen(false);
  };

  const remove = (song) => {
    if (!window.confirm(`Delete “${song.title_ta}”?`)) return;
    persist(songs.filter((item) => item.id !== song.id));
    showToast('Song deleted');
  };

  const exportSongs = () => {
    if (!songs.length) {
      showToast('There are no custom songs to export.');
      return;
    }
    const blob = new Blob([JSON.stringify(songs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'my-tamil-songs.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast('Backup downloaded');
  };

  const importSongs = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error('Invalid file');
      const merged = [...songs];
      for (const item of parsed) {
        if (!item?.title_ta || !item?.lyrics) continue;
        const id = merged.length ? Math.max(...merged.map((song) => Number(song.id) || 0)) + 1 : 1;
        merged.push({
          id,
          title_ta: String(item.title_ta),
          title_en: String(item.title_en || ''),
          lyrics: String(item.lyrics),
          created_at: item.created_at || new Date().toISOString(),
        });
      }
      persist(merged);
      showToast(`Imported ${merged.length - songs.length} songs`);
    } catch {
      showToast('That file could not be read.');
    }
  };

  const readerSong = selected
    ? {
        id: selected.id,
        number: String(songs.findIndex((song) => song.id === selected.id) + 1),
        title_ta: selected.title_ta,
        title_en: selected.title_en,
        category: 'My Songs',
        lyrics: selected.lyrics,
        translit: '',
        combined: '',
      }
    : null;

  return (
    <Page
      title="My Songs"
      eyebrow="என் பாடல்கள்"
      backFallback="/songs/"
      actions={
        <button type="button" className="icon-btn" aria-label="Add song" onClick={openAdd}>
          <Icon name="plus" />
        </button>
      }
    >
      <div className="custom-toolbar">
        <p className="custom-note">
          Your songs are stored only on this device. Export a backup before clearing browser data.
        </p>
        <div className="custom-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={exportSongs}>
            <Icon name="download" size={15} /> Export
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => fileRef.current?.click()}>
            <Icon name="plus" size={15} /> Import
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importSongs} />
        </div>
      </div>

      {songs.length === 0 ? (
        <EmptyState
          icon="edit"
          title="No custom songs yet"
          text="Add a song with its Tamil title and lyrics. It will be saved for offline use."
        />
      ) : (
        <div className="song-list">
          {songs.map((song, index) => (
            <div key={song.id} className="song-row custom-row">
              <button type="button" className="custom-open" onClick={() => setSelected(song)}>
                <span className="song-number"><MixedText size={15}>{index + 1}</MixedText></span>
                <span className="song-main">
                  <MixedText as="span" size={16} className="song-title">{song.title_ta}</MixedText>
                  {song.title_en && <span className="song-sub">{song.title_en}</span>}
                </span>
              </button>
              <button type="button" className="icon-btn small" aria-label="Edit song" onClick={() => openEdit(song)}>
                <Icon name="edit" size={17} />
              </button>
              <button type="button" className="icon-btn small danger" aria-label="Delete song" onClick={() => remove(song)}>
                <Icon name="trash" size={17} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="fab" aria-label="Add a song" onClick={openAdd}>
        <Icon name="plus" size={24} />
      </button>

      <Sheet open={formOpen} title={editing ? 'Edit song' : 'Add a song'} onClose={() => setFormOpen(false)}>
        <label className="field">
          <span>Tamil title *</span>
          <input
            value={form.title_ta}
            onChange={(event) => setForm((value) => ({ ...value, title_ta: event.target.value }))}
            placeholder="பாடலின் தலைப்பு"
          />
        </label>
        <label className="field">
          <span>English / Tanglish title</span>
          <input
            value={form.title_en}
            onChange={(event) => setForm((value) => ({ ...value, title_en: event.target.value }))}
            placeholder="Song title in English"
          />
        </label>
        <label className="field">
          <span>Lyrics *</span>
          <textarea
            rows={10}
            value={form.lyrics}
            onChange={(event) => setForm((value) => ({ ...value, lyrics: event.target.value }))}
            placeholder={'1. First verse…\n\n[Chorus]\n…'}
          />
        </label>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={save}>{editing ? 'Save changes' : 'Add song'}</button>
        </div>
      </Sheet>

      {readerSong && (
        <div className="reader-overlay">
          <SongReader song={readerSong} collection="custom" onClose={() => setSelected(null)} />
        </div>
      )}
    </Page>
  );
}

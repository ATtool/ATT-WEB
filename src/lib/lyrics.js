/**
 * Mirrors the smart lyric parser used by the mobile app.
 * Returns stanzas with numbered verses and refrain lines.
 */
export function parseLyrics(text) {
  if (!text) return [];
  const rawLines = String(text).replace(/\r\n/g, '\n').split('\n');
  const stanzas = [];
  let currentNumber = null;
  let currentLines = [];
  let seenChorusText = null;
  let isCurrentBlockChorus = false;

  const isRefrainLine = (line, nextLine) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('~')) return false;
    if (nextLine === undefined) return true;
    return nextLine.trim() === '';
  };

  const flush = () => {
    while (currentLines.length > 0 && currentLines[currentLines.length - 1].content.trim() === '') {
      currentLines.pop();
    }
    while (currentLines.length > 0 && currentLines[0].content.trim() === '') {
      currentLines.shift();
    }
    if (currentLines.length > 0) {
      const blockText = currentLines.map((line) => line.content).join('\n').trim();
      if (isCurrentBlockChorus) {
        if (!seenChorusText) {
          seenChorusText = blockText;
          stanzas.push({ number: currentNumber, lines: currentLines });
        } else if (seenChorusText !== blockText) {
          stanzas.push({ number: currentNumber, lines: currentLines });
        }
      } else {
        stanzas.push({ number: currentNumber, lines: currentLines });
      }
    }
    currentLines = [];
    currentNumber = null;
    isCurrentBlockChorus = false;
  };

  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (trimmed.toLowerCase() === '[chorus]') {
      flush();
      isCurrentBlockChorus = true;
      continue;
    }

    const verseMatch = trimmed.match(/^\[Verse\s+(\d+)\]$/i);
    if (verseMatch) {
      flush();
      currentNumber = `${verseMatch[1]}.`;
      continue;
    }

    const numMatch = trimmed.match(/^\s*(\d{1,3}[.)])\s*(.*)$/);
    if (numMatch && !isCurrentBlockChorus) {
      flush();
      currentNumber = numMatch[1];
      const rest = line.substring(line.indexOf(numMatch[1]) + numMatch[1].length).trim();
      const nextLine = rawLines[i + 1];
      if (rest) currentLines.push({ content: rest, isRefrain: isRefrainLine(rest, nextLine) });
      continue;
    }

    if (trimmed === '') {
      flush();
      continue;
    }

    const nextLine = rawLines[i + 1];
    currentLines.push({ content: line, isRefrain: isRefrainLine(line, nextLine) });
  }
  flush();
  return stanzas;
}

export function lyricsForMode(song, mode) {
  if (!song) return '';
  if (mode === 'combined') return song.combined || song.lyrics || '';
  if (mode === 'translit') return song.translit || song.lyrics || '';
  return song.lyrics || '';
}

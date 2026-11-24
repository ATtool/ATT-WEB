const TAMIL_MONTHS = [
  'ஜனவரி',
  'பிப்ரவரி',
  'மார்ச்',
  'ஏப்ரல்',
  'மே',
  'ஜூன்',
  'ஜூலை',
  'ஆகஸ்ட்',
  'செப்டம்பர்',
  'அக்டோபர்',
  'நவம்பர்',
  'டிசம்பர்',
];

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function parseDateParts(value) {
  const raw = String(value || '').trim();
  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return { year: +match[1], month: +match[2], day: +match[3] };
  match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return { year: +match[3], month: +match[2], day: +match[1] };
  return null;
}

export function formatDate(value, { style = 'long', lang = 'ta' } = {}) {
  const parts = parseDateParts(value);
  if (!parts) return String(value || '');
  const months = lang === 'ta' ? TAMIL_MONTHS : EN_MONTHS;
  if (style === 'short') return `${parts.day} ${months[parts.month - 1]} ${parts.year}`;
  return `${parts.day} ${months[parts.month - 1]} ${parts.year}`;
}

export function formatDateEn(value) {
  return formatDate(value, { lang: 'en' });
}

export function formatRange(start, end) {
  const a = parseDateParts(start);
  const b = parseDateParts(end);
  if (!a || !b) return [start, end].filter(Boolean).join(' – ');
  if (a.month === b.month && a.year === b.year) {
    return `${a.day}–${b.day} ${TAMIL_MONTHS[b.month - 1]} ${b.year}`;
  }
  return `${a.day} ${TAMIL_MONTHS[a.month - 1]} – ${b.day} ${TAMIL_MONTHS[b.month - 1]} ${b.year}`;
}

export function weekdayEn(value) {
  const parts = parseDateParts(value);
  if (!parts) return '';
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return EN_DAYS[date.getUTCDay()];
}

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function toISODate(value) {
  const parts = parseDateParts(value);
  if (!parts) return '';
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export const dayLabel = (key) => {
  if (key === 'inside-story') return 'Inside Story';
  const n = Number(key);
  if (!Number.isFinite(n)) return key;
  return `Day ${n}`;
};

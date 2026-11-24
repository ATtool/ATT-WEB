export function parseFrontmatter(text) {
  const raw = String(text || '');
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const fields = {};
  if (match) {
    for (const line of match[1].split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)\s*$/);
      if (m) fields[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  return { fields, body: match ? raw.slice(match[0].length) : raw };
}

export function buildSabbathIndex(sabbath) {
  const quarterInfo = sabbath?.quarter_info?.info || {};
  const lessonKeys = Object.keys(sabbath?.lessons || {}).sort();
  const lessons = lessonKeys.map((key) => {
    const lesson = sabbath.lessons[key] || {};
    const info = lesson.info || {};
    const dayKeys = Object.keys(lesson).filter((item) => item !== 'info');
    return {
      key,
      title: String(info.title || '').trim(),
      start: String(info.start_date || '').trim(),
      end: String(info.end_date || '').trim(),
      days: dayKeys.map((dayKey) => {
        const { fields } = parseFrontmatter(lesson[dayKey]);
        return {
          key: dayKey,
          title: String(fields.title || '').trim() || (dayKey === 'inside-story' ? 'Inside Story' : `Day ${dayKey}`),
          date: String(fields.date || '').trim(),
        };
      }),
    };
  });
  return {
    quarter: {
      title: String(quarterInfo.title || '').trim(),
      description: String(quarterInfo.description || '').trim(),
      start: String(quarterInfo.start_date || '').trim(),
      end: String(quarterInfo.end_date || '').trim(),
      humanDate: String(quarterInfo.human_date || '').trim(),
      colorPrimary: String(quarterInfo.color_primary || '').trim(),
      splash: String(quarterInfo.splash || '').trim(),
    },
    lessons,
  };
}

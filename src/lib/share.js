export async function shareText({ title, text, url }) {
  const payload = { title, text, url };
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(payload);
      return true;
    } catch (error) {
      if (error && error.name === 'AbortError') return false;
    }
  }
  try {
    const value = [text, url].filter(Boolean).join('\n\n');
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

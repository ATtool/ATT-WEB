import { useCallback, useEffect, useState } from 'react';

export function useFavorites(key) {
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setIds(new Set(parsed.map(String)));
      }
    } catch {
      /* ignore */
    }
  }, [key]);

  const toggle = useCallback(
    (id) => {
      setIds((current) => {
        const next = new Set(current);
        const value = String(id);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        try {
          window.localStorage.setItem(key, JSON.stringify([...next]));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key]
  );

  return { ids, toggle, isFavorite: (id) => ids.has(String(id)) };
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const DataContext = createContext(null);

export function DataProvider({ initial = {}, children }) {
  const [store, setStore] = useState(initial || {});
  const inflight = useRef(new Map());
  const storeRef = useRef(store);
  storeRef.current = store;

  const put = useCallback((key, value) => {
    setStore((current) => ({ ...current, [key]: value }));
  }, []);

  const load = useCallback((key, loader) => {
    if (storeRef.current[key] !== undefined) return Promise.resolve(storeRef.current[key]);
    if (inflight.current.has(key)) return inflight.current.get(key);
    const promise = Promise.resolve()
      .then(loader)
      .then((value) => {
        if (value !== undefined) {
          setStore((current) => (current[key] !== undefined ? current : { ...current, [key]: value }));
        }
        inflight.current.delete(key);
        return value;
      })
      .catch((error) => {
        inflight.current.delete(key);
        console.warn(`[data] ${key}:`, error.message);
        return undefined;
      });
    inflight.current.set(key, promise);
    return promise;
  }, []);

  const value = useMemo(() => ({ store, load, put }), [store, load, put]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useDataContext must be used inside DataProvider');
  return value;
}

export function useData(key, loader) {
  const { store, load } = useDataContext();
  const data = store[key];
  const [error, setError] = useState(null);

  useEffect(() => {
    if (data !== undefined || !loader) return;
    let alive = true;
    load(key, loader).then((result) => {
      if (alive && result === undefined) setError('Could not load this content offline yet.');
    });
    return () => {
      alive = false;
    };
  }, [key, data, loader, load]);

  return { data, loading: data === undefined && !error, error };
}

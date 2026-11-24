import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const SettingsContext = createContext(null);

const KEYS = {
  theme: '@app_theme',
  appFontSize: '@app_font_size',
  titleSize: '@title_size',
  titleSpacing: '@title_spacing',
  lyricsSize: '@lyrics_size',
  lyricsSpacing: '@lyrics_spacing',
  lyricsLineHeight: '@lyrics_line_height',
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const read = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable */
  }
};

export function SettingsProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [appFontSize, setAppFontSizeState] = useState(15);
  const [titleSize, setTitleSizeState] = useState(20);
  const [titleSpacing, setTitleSpacingState] = useState(0);
  const [lyricsSize, setLyricsSizeState] = useState(21);
  const [lyricsSpacing, setLyricsSpacingState] = useState(0);
  const [lyricsLineHeight, setLyricsLineHeightState] = useState(32);
  const appliedBaseRef = useRef(15);

  const shiftReadingSizes = useCallback((delta) => {
    if (!delta) return;
    setTitleSizeState((value) => clamp(value + delta, 16, 30));
    setLyricsSizeState((value) => clamp(value + delta, 12, 45));
    setLyricsLineHeightState((value) => clamp(value + delta, 20, 70));
  }, []);

  const applyAppFontSize = useCallback(
    (size, { persist = true } = {}) => {
      const next = clamp(Number(size) || 15, 12, 24);
      const delta = next - appliedBaseRef.current;
      appliedBaseRef.current = next;
      setAppFontSizeState(next);
      shiftReadingSizes(delta);
      if (persist) write(KEYS.appFontSize, next);
    },
    [shiftReadingSizes]
  );

  useEffect(() => {
    const savedTheme = read(KEYS.theme);
    if (savedTheme) setIsDark(savedTheme === 'dark');

    const savedBase = parseInt(read(KEYS.appFontSize) || '', 10);
    if (Number.isFinite(savedBase)) applyAppFontSize(savedBase, { persist: false });

    const savedTitle = parseInt(read(KEYS.titleSize) || '', 10);
    if (Number.isFinite(savedTitle)) setTitleSizeState(clamp(savedTitle, 16, 30));
    const savedTitleSpacing = parseInt(read(KEYS.titleSpacing) || '', 10);
    if (Number.isFinite(savedTitleSpacing)) setTitleSpacingState(clamp(savedTitleSpacing, 0, 8));
    const savedLyrics = parseInt(read(KEYS.lyricsSize) || '', 10);
    if (Number.isFinite(savedLyrics)) setLyricsSizeState(clamp(savedLyrics, 12, 45));
    const savedLyricsSpacing = parseInt(read(KEYS.lyricsSpacing) || '', 10);
    if (Number.isFinite(savedLyricsSpacing)) setLyricsSpacingState(clamp(savedLyricsSpacing, 0, 8));
    const savedLineHeight = parseInt(read(KEYS.lyricsLineHeight) || '', 10);
    if (Number.isFinite(savedLineHeight)) setLyricsLineHeightState(clamp(savedLineHeight, 20, 70));
  }, [applyAppFontSize]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = isDark ? 'dark' : 'light';
    root.style.setProperty('--app-size', `${appFontSize}px`);
    root.style.setProperty('--title-size', `${titleSize}px`);
    root.style.setProperty('--title-spacing', `${titleSpacing}px`);
    root.style.setProperty('--lyrics-size', `${lyricsSize}px`);
    root.style.setProperty('--lyrics-spacing', `${lyricsSpacing}px`);
    root.style.setProperty('--lyrics-lh', `${lyricsLineHeight}px`);
  }, [isDark, appFontSize, titleSize, titleSpacing, lyricsSize, lyricsSpacing, lyricsLineHeight]);

  const setTheme = useCallback((mode) => {
    const dark = mode === 'dark';
    setIsDark(dark);
    write(KEYS.theme, dark ? 'dark' : 'light');
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((value) => {
      write(KEYS.theme, value ? 'light' : 'dark');
      return !value;
    });
  }, []);

  const setTitleSize = useCallback((value) => {
    const next = clamp(Number(value) || 20, 16, 30);
    setTitleSizeState(next);
    write(KEYS.titleSize, next);
  }, []);

  const setTitleSpacing = useCallback((value) => {
    const next = clamp(Number(value) || 0, 0, 8);
    setTitleSpacingState(next);
    write(KEYS.titleSpacing, next);
  }, []);

  const setLyricsSize = useCallback((value) => {
    const next = clamp(Number(value) || 21, 12, 45);
    setLyricsSizeState(next);
    write(KEYS.lyricsSize, next);
  }, []);

  const setLyricsSpacing = useCallback((value) => {
    const next = clamp(Number(value) || 0, 0, 8);
    setLyricsSpacingState(next);
    write(KEYS.lyricsSpacing, next);
  }, []);

  const setLyricsLineHeight = useCallback((value) => {
    const next = clamp(Number(value) || 32, 20, 70);
    setLyricsLineHeightState(next);
    write(KEYS.lyricsLineHeight, next);
  }, []);

  const restoreDefaultTextSettings = useCallback(() => {
    appliedBaseRef.current = 15;
    setAppFontSizeState(15);
    setTitleSizeState(20);
    setTitleSpacingState(0);
    setLyricsSizeState(21);
    setLyricsSpacingState(0);
    setLyricsLineHeightState(32);
    write(KEYS.appFontSize, 15);
    write(KEYS.titleSize, 20);
    write(KEYS.titleSpacing, 0);
    write(KEYS.lyricsSize, 21);
    write(KEYS.lyricsSpacing, 0);
    write(KEYS.lyricsLineHeight, 32);
  }, []);

  const colors = useMemo(
    () =>
      isDark
        ? {
            background: '#05070A',
            card: 'rgba(255, 255, 255, 0.04)',
            cardSolid: '#12161E',
            text: '#FFFFFF',
            subtext: '#8E94A3',
            primary: '#00F0FF',
            border: 'rgba(255, 255, 255, 0.08)',
            glow: 'rgba(0, 240, 255, 0.15)',
            accent: '#FFD700',
            danger: '#FF3B30',
            success: '#30D158',
            tabBar: '#0A1929',
            tabActive: '#FFD700',
            tabInactive: '#00F0FF',
          }
        : {
            background: '#F4F7FB',
            card: '#FFFFFF',
            cardSolid: '#FFFFFF',
            text: '#0F172A',
            subtext: '#5B677B',
            primary: '#0077E6',
            border: '#E2E8F0',
            glow: 'rgba(0, 119, 230, 0.12)',
            accent: '#D97706',
            danger: '#EF4444',
            success: '#10B981',
            tabBar: '#FFFFFF',
            tabActive: '#0077E6',
            tabInactive: '#64748B',
          },
    [isDark]
  );

  const typography = useMemo(() => {
    const base = appFontSize;
    return {
      display: { fontSize: base + 13 },
      h1: { fontSize: base + 10 },
      h2: { fontSize: base + 6 },
      title: { fontSize: base + 2 },
      body: { fontSize: base },
      subtext: { fontSize: Math.max(11, base - 2) },
      caption: { fontSize: Math.max(10, base - 4) },
    };
  }, [appFontSize]);

  const value = useMemo(
    () => ({
      isDark,
      colors,
      typography,
      appFontSize,
      setAppFontSize: applyAppFontSize,
      setTheme,
      toggleTheme,
      titleSize,
      setTitleSize,
      titleSpacing,
      setTitleSpacing,
      lyricsSize,
      setLyricsSize,
      lyricsSpacing,
      setLyricsSpacing,
      lyricsLineHeight,
      setLyricsLineHeight,
      restoreDefaultTextSettings,
    }),
    [
      isDark,
      colors,
      typography,
      appFontSize,
      applyAppFontSize,
      setTheme,
      toggleTheme,
      titleSize,
      setTitleSize,
      titleSpacing,
      setTitleSpacing,
      lyricsSize,
      setLyricsSize,
      lyricsSpacing,
      setLyricsSpacing,
      lyricsLineHeight,
      setLyricsLineHeight,
      restoreDefaultTextSettings,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}

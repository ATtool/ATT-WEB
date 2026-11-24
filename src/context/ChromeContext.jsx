import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ChromeContext = createContext(null);

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !window.MSStream;

export function ChromeProvider({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [standalone, setStandalone] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, duration = 3200) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), duration);
  }, []);

  useEffect(() => {
    setStandalone(isStandalone());
    setOnline(navigator.onLine);
    const onInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setStandalone(true);
      showToast('App installed. You can now use it offline.');
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('beforeinstallprompt', onInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [showToast]);

  const install = useCallback(async () => {
    if (installPrompt) {
      installPrompt.prompt();
      try {
        await installPrompt.userChoice;
      } catch {
        /* ignored */
      }
      setInstallPrompt(null);
      return;
    }
    if (isIosDevice()) {
      setIosHelp(true);
      return;
    }
    if (standalone) {
      showToast('Already installed on this device.');
      return;
    }
    showToast('Open your browser menu and choose “Install app” or “Add to Home screen”.', 5000);
  }, [installPrompt, standalone, showToast]);

  const value = useMemo(
    () => ({
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      install,
      canInstall: !!installPrompt,
      standalone,
      iosHelp,
      setIosHelp,
      online,
      toast,
      showToast,
    }),
    [drawerOpen, install, installPrompt, standalone, iosHelp, online, toast, showToast]
  );

  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

export function useChrome() {
  const value = useContext(ChromeContext);
  if (!value) throw new Error('useChrome must be used inside ChromeProvider');
  return value;
}

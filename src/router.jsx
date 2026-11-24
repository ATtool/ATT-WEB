import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { currentPath, normalizePath, parseRoute, withBase } from './lib/paths.js';

const RouterContext = createContext(null);

export function RouterProvider({ initialPath, children }) {
  const [path, setPath] = useState(() => normalizePath(initialPath || currentPath()));

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback(
    (to, { replace = false, scroll = true } = {}) => {
      const next = normalizePath(to);
      if (next === path) {
        if (scroll) window.scrollTo(0, 0);
        return;
      }
      if (replace) window.history.replaceState({}, '', withBase(next));
      else window.history.pushState({}, '', withBase(next));
      setPath(next);
      if (scroll) window.scrollTo(0, 0);
    },
    [path]
  );

  const goBack = useCallback(
    (fallback = '/') => {
      if (typeof window !== 'undefined' && window.history.length > 1) window.history.back();
      else navigate(fallback);
    },
    [navigate]
  );

  const value = useMemo(
    () => ({ path, route: parseRoute(path), navigate, goBack }),
    [path, navigate, goBack]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const value = useContext(RouterContext);
  if (!value) throw new Error('useRouter must be used inside RouterProvider');
  return value;
}

export function useRoute() {
  return useRouter().route;
}

export function Link({ to, children, onClick, className = '', ...rest }) {
  const { navigate } = useRouter();
  const href = withBase(to);
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onClick?.(event);
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

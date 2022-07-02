import { useEffect, useState } from 'react';

const darkThemeMediaQuery =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : undefined;

const getCurrentTheme = () => (darkThemeMediaQuery?.matches ? 'dark' : 'light');

const useSystemTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(getCurrentTheme());

  useEffect(() => {
    const listener = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light');
    };

    darkThemeMediaQuery?.addEventListener('change', listener);

    return () => darkThemeMediaQuery?.removeEventListener('change', listener);
  }, []);

  return theme;
};

export default useSystemTheme;

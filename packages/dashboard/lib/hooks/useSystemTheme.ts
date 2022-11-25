import { Theme } from 'lib/types';
import { useEffect, useState } from 'react';

const darkThemeMediaQuery =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : undefined;

const getCurrentTheme = (): Theme => (darkThemeMediaQuery?.matches ? 'Dark' : 'Light');

const useSystemTheme = () => {
  const [theme, setTheme] = useState<Theme>(getCurrentTheme());

  useEffect(() => {
    const listener = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'Dark' : 'Light');
    };

    darkThemeMediaQuery?.addEventListener('change', listener);

    return () => darkThemeMediaQuery?.removeEventListener('change', listener);
  }, []);

  return theme;
};

export default useSystemTheme;

import { Theme, ThemeOption } from 'lib/types';
import { useCallback, useEffect, useState } from 'react';
import useSystemTheme from './useSystemTheme';

const useTheme = () => {
  const systemTheme = useSystemTheme();
  const [theme, setTheme] = useState<Theme>(() => systemTheme);
  const [savedTheme, setSavedTheme] = useState<ThemeOption>(() => {
    let localStorageTheme = localStorage.getItem('theme') as Theme | null;

    if (!localStorageTheme) {
      localStorageTheme = 'Dark';
      localStorage.setItem('theme', savedTheme);
    }

    return localStorageTheme;
  });

  const updateTheme = useCallback((theme: ThemeOption) => {
    localStorage.setItem('theme', theme);
    setSavedTheme(theme);
  }, []);

  useEffect(() => {
    if (savedTheme === 'System') {
      setTheme(systemTheme);
    } else {
      setTheme(savedTheme);
    }
  }, [systemTheme, savedTheme]);

  useEffect(() => {
    if (theme === 'Dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return {
    theme,
    updateTheme,
  };
};

export default useTheme;

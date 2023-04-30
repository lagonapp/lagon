import { createI18n } from 'next-international';
import { useEffect } from 'react';

export const {
  I18nProvider,
  useScopedI18n,
  defineLocale,
  useChangeLocale: _useChangeLocale,
  getLocaleProps,
} = createI18n({
  en: () => import('./en'),
  fr: () => import('./fr'),
});

export const useChangeLocale = () => {
  const changeLocale = _useChangeLocale();
  return (newLocale: Parameters<typeof changeLocale>[0]) => {
    changeLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };
};

export const usePersistLocale = () => {
  const changeLocale = useChangeLocale();

  useEffect(() => {
    const locale = localStorage.getItem('locale') as Parameters<typeof changeLocale>[0] | null;
    if (locale) {
      changeLocale(locale);
    }
  }, []);
};

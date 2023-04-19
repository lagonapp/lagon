import { createI18n } from 'next-international';

export const { I18nProvider, useScopedI18n, defineLocale, useChangeLocale, getLocaleProps } = createI18n({
  en: () => import('./en'),
  fr: () => import('./fr'),
});

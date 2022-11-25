import { createI18n } from 'next-international';
import type Locale from './en';

export const { I18nProvider, useI18n, defineLocale, useChangeLocale, getLocaleProps } = createI18n<typeof Locale>({
  en: () => import('./en'),
  fr: () => import('./fr'),
});

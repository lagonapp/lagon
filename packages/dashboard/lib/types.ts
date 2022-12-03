export const TIMEFRAMES = ['Last 24 hours', 'Last 7 days', 'Last 30 days'] as const;
export type Timeframe = typeof TIMEFRAMES[number];

export const THEMES = ['Light', 'Dark', 'System'] as const;
export type ThemeOption = typeof THEMES[number];
export type Theme = 'Light' | 'Dark';

export const ANALYTICS_TIMEFRAMES = ['Last 24 hours', 'Last 7 days', 'Last 30 days'] as const;
export type AnalyticsTimeframe = typeof ANALYTICS_TIMEFRAMES[number];

export const LOGS_TIMEFRAMES = ['Last hour', 'Last 24 hours', 'Last week'] as const;
export type LogsTimeframe = typeof LOGS_TIMEFRAMES[number];

export const THEMES = ['Light', 'Dark', 'System'] as const;
export type ThemeOption = typeof THEMES[number];
export type Theme = 'Light' | 'Dark';

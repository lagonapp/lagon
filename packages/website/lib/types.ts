export const TIMEFRAMES = ['Last 24 hours', 'Last 7 days', 'Last 30 days'] as const;

export type Timeframe = typeof TIMEFRAMES[number];

export const LOG_LEVELS = ['log', 'error', 'info', 'warn', 'debug', 'all'] as const;

export type LogLevel = typeof LOG_LEVELS[number];

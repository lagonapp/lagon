export const IS_DEV = process.env.NODE_ENV !== 'production';

export const SITE_URL = IS_DEV ? 'http://localhost:3000' : 'https://dash.lagon.app';
export const API_URL = `${SITE_URL}/api`;

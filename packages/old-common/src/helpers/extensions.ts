import { lookup, mimes } from 'mrmime';

mimes['ico'] = 'image/x-icon';

export const extensionToContentType = lookup;

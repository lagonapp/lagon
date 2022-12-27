import lagonAdapter from '@hattip/adapter-lagon';
import hattipHandler from './handler';

export const handler = lagonAdapter(hattipHandler);

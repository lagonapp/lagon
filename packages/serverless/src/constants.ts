import { cpus } from 'node:os';

export const IS_DEV = process.env.NODE_ENV !== 'production';
export const CPUS = cpus().length;

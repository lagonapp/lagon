import { describe, expect, it } from 'vitest';
import { envStringToObject } from '../env';

describe('envStringToObject', () => {
  it('should transform env variables as array of string to object', () => {
    expect(envStringToObject(['a=b', 'c=d'])).toStrictEqual({ a: 'b', c: 'd' });
  });

  it('should skip strange variables', () => {
    expect(envStringToObject(['a=b', 'c'])).toStrictEqual({ a: 'b' });
  });
});

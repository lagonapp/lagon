import { describe, expect, it } from 'vitest';
import { envStringToObject } from '../';

describe('envStringToObject', () => {
  it('should transform env variables as array of string to object', () => {
    expect(
      envStringToObject([
        { key: 'a', value: 'b' },
        { key: 'c', value: 'd' },
      ]),
    ).toStrictEqual({ a: 'b', c: 'd' });
  });
});

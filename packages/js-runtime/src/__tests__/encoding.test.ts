import { describe, it, expect } from 'vitest';
import { TextEncoder, TextDecoder } from '../runtime/encoding';

describe('encoding', () => {
  it('should encode', async () => {
    expect(new TextEncoder().encode('Hello World')).toEqual(
      new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]),
    );
  });

  it('should decode', async () => {
    expect(new TextDecoder().decode(new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]))).toEqual(
      'Hello World',
    );
  });

  it('should encode and decode', async () => {
    const encoded = new TextEncoder().encode('Hello World');
    const decoded = new TextDecoder().decode(encoded);

    expect(decoded).toEqual('Hello World');
  });

  it('should have encoding field on TextEncoder', async () => {
    expect(new TextEncoder().encoding).toEqual('utf-8');
  });

  it('should have encoding field on TextDecoder', async () => {
    expect(new TextDecoder().encoding).toEqual('utf-8');
  });
});

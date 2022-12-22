import { describe, it, expect } from 'vitest';
import '../runtime/blob';

describe('blob', () => {
  it('should blob', async () => {
    const obj = { hello: 'world' };
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: 'application/json',
    });

    expect(blob.size).toEqual(22);
    expect(blob.type).toEqual('application/json');
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { crypto } from '../runtime/crypto';
import '../runtime/core';

describe('randomUUID', () => {
  beforeEach(() => {
    globalThis.Lagon = {
      ...globalThis.Lagon,
      uuid: vi.fn(),
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call Lagon.uuid', () => {
    // @ts-expect-error Lagon is not defined
    globalThis.Lagon.uuid.mockReturnValueOnce('dff2d1a4-32b8-4a83-b455-88707848227a');

    const uuid = crypto.randomUUID();

    expect(uuid).toEqual('dff2d1a4-32b8-4a83-b455-88707848227a');
  });
});

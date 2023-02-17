import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../';

describe('randomUUID', () => {
  beforeEach(() => {
    globalThis.LagonSync = {
      ...globalThis.LagonSync,
      uuid: vi.fn(),
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call LagonSync.uuid', () => {
    // @ts-expect-error LagonSync is not defined
    globalThis.LagonSync.uuid.mockReturnValueOnce('dff2d1a4-32b8-4a83-b455-88707848227a');

    const uuid = crypto.randomUUID();

    expect(uuid).toEqual('dff2d1a4-32b8-4a83-b455-88707848227a');
  });
});

describe('getRandomValues', () => {
  beforeEach(() => {
    globalThis.LagonSync = {
      ...globalThis.LagonSync,
      randomValues: vi.fn(),
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call LagonSync.randomValues', () => {
    // @ts-expect-error LagonSync is not defined
    globalThis.LagonSync.randomValues.mockImplementationOnce(typedArray => typedArray);

    const uuid = crypto.getRandomValues(new Uint8Array([0, 8, 2]));

    expect(uuid).toEqual(new Uint8Array([0, 8, 2]));
  });
});

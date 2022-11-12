import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../';

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

describe('getRandomValues', () => {
  beforeEach(() => {
    globalThis.Lagon = {
      ...globalThis.Lagon,
      randomValues: vi.fn(),
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call Lagon.randomValues', () => {
    // @ts-expect-error Lagon is not defined
    globalThis.Lagon.randomValues.mockImplementationOnce(typedArray => typedArray);

    const uuid = crypto.getRandomValues(new Uint8Array([0, 8, 2]));

    expect(uuid).toEqual(new Uint8Array([0, 8, 2]));
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../runtime/console';

beforeEach(() => {
  globalThis.Lagon = {
    ...globalThis.Lagon,
    log: vi.fn(),
  };
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('Console', () => {
  it('should log', () => {
    console.log('Hello World');

    expect(Lagon.log).toHaveBeenCalledWith('[log] Hello World');
  });

  it('should receive all logs type', () => {
    const types = ['log', 'info', 'debug', 'error', 'warn'] as const;

    for (const type of types) {
      console[type](`Hello ${type}`);

      expect(Lagon.log).toHaveBeenCalledWith(`[${type}] Hello ${type}`);
    }
  });

  it('should log objects', () => {
    console.log({
      hello: 'world',
      nested: {
        hello: 'world',
      },
    });

    expect(Lagon.log).toHaveBeenCalledWith('[log] {"hello":"world","nested":{"hello":"world"}}');
  });

  it('should log arrays', () => {
    console.log(['hello', 'world']);

    expect(Lagon.log).toHaveBeenCalledWith('[log] ["hello","world"]');
  });

  // TODO: test callbacks and functions
  it('should log functions', () => {
    console.log(() => {
      return 'Hello World';
    });

    // TODO: should log function
    expect(Lagon.log).toHaveBeenCalledWith('[log] undefined');
  });
});

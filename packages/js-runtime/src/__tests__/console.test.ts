import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../';

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

  it('should log numbers', () => {
    console.log(42);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] 42');

    console.log(42.42);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] 42.42');
  });

  it('should log booleans', () => {
    console.log(true);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] true');

    console.log(false);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] false');
  });

  it('should log undefined and null', () => {
    console.log(undefined);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] undefined');

    console.log(null);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] null');
  });

  it('should log arrays', () => {
    console.log(['hello', 'world']);

    expect(Lagon.log).toHaveBeenCalledWith('[log] ["hello","world"]');
  });

  it('should log functions', () => {
    console.log(function () {
      return 'Hello World';
    });

    expect(Lagon.log).toHaveBeenCalledWith('[log] [Function]');
  });

  it('should log callbacks', () => {
    console.log(() => {
      return 'Hello World';
    });

    expect(Lagon.log).toHaveBeenCalledWith('[log] [Function]');
  });

  it('should log objects with toString', () => {
    console.log(new Error('Hello World'));
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Error: Hello World');

    class Empty {
      toString() {
        return 'Hello World';
      }
    }

    console.log(new Empty());
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello World');
  });

  it('should format multiple strings', () => {
    console.log('Hello', 'World');

    expect(Lagon.log).toHaveBeenCalledWith('[log] Hello World');
  });

  it('should format multiple strings and objects', () => {
    console.log('Hello', {
      value: 'World',
    });
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello {"value":"World"}');

    console.log(
      'Hello',
      {
        value: 'World',
      },
      42,
      undefined,
    );
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello {"value":"World"} 42 undefined');
  });

  it('should format printf like string', () => {
    console.log('Hello %s', 'World');

    expect(Lagon.log).toHaveBeenCalledWith('[log] Hello World');
  });

  it('should format printf like numbers', () => {
    console.log('Hello %d', 42);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello 42');

    console.log('Hello %d', 42.42);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello 42.42');
  });

  it('should format printf like integers', () => {
    console.log('Hello %i', 42);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello 42');

    console.log('Hello %i', 42.42);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello 42');
  });

  it('should format printf like floats', () => {
    console.log('Hello %f', 42);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello 42');

    console.log('Hello %f', 42.42);
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello 42.42');
  });

  it('should format printf like objects', () => {
    console.log('Hello %o', {
      value: 'World',
    });
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello {"value":"World"}');

    console.log('Hello %O', {
      value: 'World',
    });
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello {"value":"World"}');

    console.log('Hello %j', {
      value: 'World',
    });
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello {"value":"World"}');
  });

  it('should format print like multiple times', () => {
    console.log('Hello %s, this is the %i test of printing %j', 'World', 42, {
      value: 'World',
    });

    expect(Lagon.log).toHaveBeenCalledWith('[log] Hello World, this is the 42 test of printing {"value":"World"}');
  });

  it('should format print like with fallback', () => {
    console.log('Hello %s, this is the %i test of printing %j', 'World');
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello World, this is the %i test of printing %j');

    console.log('Hello %s, this is the %i test of printing %j');
    expect(Lagon.log).toHaveBeenLastCalledWith('[log] Hello %s, this is the %i test of printing %j');
  });
});

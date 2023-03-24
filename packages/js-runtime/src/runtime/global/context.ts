(globalThis => {
  globalThis.__storage__ = new Map();

  globalThis.AsyncContext = class {
    get() {
      return globalThis.__storage__.get(this);
    }

    static wrap(callback: (...args: unknown[]) => void): (...args: unknown[]) => void {
      const snapshot = globalThis.__storage__;

      return function (...args: unknown[]) {
        const prev = globalThis.__storage__;
        try {
          globalThis.__storage__ = snapshot;
          return callback.apply(this, args);
        } finally {
          globalThis.__storage__ = prev;
        }
      };
    }

    run<R>(store: unknown, callback: (...args: unknown[]) => R, ...args: unknown[]): R {
      const prev = globalThis.__storage__;

      try {
        const n = new Map(globalThis.__storage__);
        n.set(this, store);
        globalThis.__storage__ = n;
        return callback(...args);
      } finally {
        globalThis.__storage__ = prev;
      }
    }
  };

  globalThis.AsyncLocalStorage = class extends AsyncContext {
    getStore() {
      return this.get();
    }
  };
})(globalThis);

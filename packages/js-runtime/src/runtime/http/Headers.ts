(globalThis => {
  globalThis.Headers = class {
    private readonly h: Map<string, string[]> = new Map();

    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this.addValue(key, value);
          });
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this.addValue(key, value);
          });
        }
      }
    }

    private addValue(name: string, value: string) {
      name = name.toLowerCase();
      const values = this.h.get(name);

      if (values) {
        values.push(value);
      } else {
        this.h.set(name, [value]);
      }
    }

    append(name: string, value: string) {
      name = name.toLowerCase();
      this.addValue(name, value);
    }

    delete(name: string) {
      name = name.toLowerCase();
      this.h.delete(name);
    }

    *entries(): IterableIterator<[string, string]> {
      for (const [key, values] of this.h) {
        for (const value of values) {
          yield [key, value];
        }
      }
    }

    get(name: string): string | null {
      name = name.toLowerCase();
      return this.h.get(name)?.[0] || null;
    }

    has(name: string): boolean {
      name = name.toLowerCase();
      return this.h.has(name);
    }

    keys(): IterableIterator<string> {
      return this.h.keys();
    }

    set(name: string, value: string) {
      name = name.toLowerCase();
      this.h.set(name, [value]);
    }

    *values(): IterableIterator<string> {
      for (const [, values] of this.h) {
        for (const value of values) {
          yield value;
        }
      }
    }

    forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) {
      for (const [key, value] of this.entries()) {
        callbackfn.call(thisArg, value, key, this);
      }
    }

    [Symbol.iterator](): IterableIterator<[string, string]> {
      return this.entries();
    }
  };
})(globalThis);

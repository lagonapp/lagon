(globalThis => {
  globalThis.Headers = class {
    private readonly h: Map<string, string[]> = new Map();

    constructor(init?: HeadersInit) {
      if (init === null) {
        throw new TypeError('HeadersInit must not be null');
      }

      if (init) {
        if (Array.isArray(init)) {
          init.forEach(entry => {
            if (entry.length !== 2) {
              throw new TypeError('HeadersInit must be an array of 2-tuples');
            }

            this.addValue(entry[0], entry[1]);
          });
        } else {
          if (init instanceof Headers) {
            for (const [key, value] of init) {
              this.addValue(key, value);
            }

            return;
          }

          if (typeof init !== 'object') {
            throw new TypeError('HeadersInit must be an object or an array of 2-tuples');
          }

          Object.entries(init).forEach(([key, value]) => {
            this.addValue(key, value);
          });
        }
      }
    }

    private addValue(name: string, value: string) {
      name = name.toLowerCase();
      value = String(value);
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
      const sorted = [...this.h.entries()].sort(([a], [b]) => a.localeCompare(b));

      for (const [key, values] of sorted) {
        yield [key, values.join(', ')];
      }
    }

    get(name: string): string | null {
      name = name.toLowerCase();
      return this.h.get(name)?.join(', ') || null;
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
      value = String(value);
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

(globalThis => {
  globalThis.URLSearchParams = class {
    private params: Map<string, string[]> = new Map();

    constructor(init?: string[][] | Record<string, string> | string | URLSearchParams) {
      if (init) {
        if (typeof init === 'string') {
          init
            .replace('?', '')
            .split('&')
            .forEach(entry => {
              const [key, value] = entry.split('=');

              this.addValue(key, value);
            });
        } else if (typeof init === 'object') {
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
    }

    private addValue(name: string, value: string) {
      const values = this.params.get(name);

      if (values) {
        values.push(value);
      } else {
        this.params.set(name, [value]);
      }
    }

    append(name: string, value: string) {
      this.addValue(name, value);
    }

    delete(name: string) {
      this.params.delete(name);
    }

    *entries(): IterableIterator<[string, string]> {
      for (const [key, values] of this.params) {
        for (const value of values) {
          yield [key, value];
        }
      }
    }

    forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any) {
      this.params.forEach((values, key) => {
        values.forEach(value => {
          callbackfn.call(thisArg, value, key, this);
        });
      });
    }

    get(name: string): string | null {
      return this.params.get(name)?.[0] || null;
    }

    getAll(name: string): string[] {
      return this.params.get(name) || [];
    }

    has(name: string): boolean {
      return this.params.has(name);
    }

    keys(): IterableIterator<string> {
      return this.params.keys();
    }

    set(name: string, value: string) {
      this.params.set(name, [value]);
    }

    sort() {
      this.params = new Map([...this.params].sort());
    }

    toString(): string {
      return Array.from(this.params.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    }

    *values(): IterableIterator<string> {
      for (const [, values] of this.params) {
        for (const value of values) {
          yield value;
        }
      }
    }

    [Symbol.iterator](): IterableIterator<[string, string]> {
      return this.entries();
    }
  };
})(globalThis);

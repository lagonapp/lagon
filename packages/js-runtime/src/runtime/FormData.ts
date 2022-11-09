(globalThis => {
  // Almost the same implementation as URLSearchParams
  globalThis.FormData = class {
    private fields: Map<string, string[]> = new Map();

    private addValue(name: string, value: string) {
      const values = this.fields.get(name);

      if (values) {
        values.push(value);
      } else {
        this.fields.set(name, [value]);
      }
    }

    append(name: string, value: string) {
      this.addValue(name, value);
    }

    delete(name: string) {
      this.fields.delete(name);
    }

    *entries(): IterableIterator<[string, string]> {
      for (const [key, values] of this.fields) {
        for (const value of values) {
          yield [key, value];
        }
      }
    }

    forEach(callbackfn: (value: string, key: string, parent: FormData) => void, thisArg?: any) {
      this.fields.forEach((values, key) => {
        values.forEach(value => {
          callbackfn.call(thisArg, value, key, this);
        });
      });
    }

    get(name: string): string | null {
      return this.fields.get(name)?.[0] || null;
    }

    getAll(name: string): string[] {
      return this.fields.get(name) || [];
    }

    has(name: string): boolean {
      return this.fields.has(name);
    }

    keys(): IterableIterator<string> {
      return this.fields.keys();
    }

    set(name: string, value: string) {
      this.fields.set(name, [value]);
    }

    *values(): IterableIterator<string> {
      for (const [, values] of this.fields) {
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

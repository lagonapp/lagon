(globalThis => {
  // Almost the same implementation as URLSearchParams
  globalThis.FormData = class {
    private fields: Map<string, FormDataEntryValue[]> = new Map();

    private addValue(name: string, value: FormDataEntryValue) {
      const values = this.fields.get(name);

      if (values) {
        values.push(value);
      } else {
        this.fields.set(name, [value]);
      }
    }

    append(name: string, value: Blob, filename?: string): void;
    append(name: string, value: string): void;
    append(name: string, value: string | Blob, filename?: string) {
      if (value instanceof Blob) {
        this.addValue(name, new File([value], filename ?? ''));
      } else {
        this.addValue(name, value);
      }
    }

    delete(name: string) {
      this.fields.delete(name);
    }

    *entries(): IterableIterator<[string, FormDataEntryValue]> {
      for (const [key, values] of this.fields) {
        for (const value of values) {
          yield [key, value];
        }
      }
    }

    forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any) {
      this.fields.forEach((values, key) => {
        values.forEach(value => {
          callbackfn.call(thisArg, value, key, this);
        });
      });
    }

    get(name: string): FormDataEntryValue | null {
      return this.fields.get(name)?.[0] || null;
    }

    getAll(name: string): FormDataEntryValue[] {
      return this.fields.get(name) || [];
    }

    has(name: string): boolean {
      return this.fields.has(name);
    }

    keys(): IterableIterator<string> {
      return this.fields.keys();
    }

    set(name: string, value: Blob, filename?: string): void;
    set(name: string, value: string): void;
    set(name: string, value: string | Blob, filename?: string) {
      if (value instanceof Blob) {
        this.fields.set(name, [new File([value], filename ?? '')]);
      } else {
        this.fields.set(name, [value]);
      }
    }

    *values(): IterableIterator<FormDataEntryValue> {
      for (const [, values] of this.fields) {
        for (const value of values) {
          yield value;
        }
      }
    }

    [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]> {
      return this.entries();
    }
  };
})(globalThis);

(globalThis => {
  globalThis.URLSearchParams = class {
    private list: [string, string][] = [];
    private url: URL | null = null;

    constructor(init: string[][] | Record<string, string> | string | URLSearchParams = '') {
      if (typeof init === 'string' && init.startsWith('?')) {
        init = init.slice(1);
      }

      this.initialize(init);
    }

    private parse(init: string): [string, string][] {
      const sequences = init.split('&');
      const output: [string, string][] = [];

      for (const sequence of sequences) {
        if (sequence.length === 0) {
          continue;
        }

        let name: string;
        let value: string;

        if (sequence.includes('=')) {
          const [a, b] = sequence.split('=');
          name = a;
          value = b;
        } else {
          name = sequence;
          value = '';
        }

        name = decodeURIComponent(name.replaceAll('+', ' '));
        value = decodeURIComponent(value.replaceAll('+', ' '));

        output.push([name, value]);
      }

      return output;
    }

    private initialize(init: string[][] | Record<string, string> | string | URLSearchParams = '') {
      if (typeof init === 'object') {
        if (Array.isArray(init)) {
          for (const inner of init) {
            if (inner.length !== 2) {
              throw new TypeError(
                "Failed to construct 'URLSearchParams': Sequence initializer must only contain pair elements",
              );
            }

            this.list.push([inner[0], inner[1]]);
          }
        } else {
          Object.entries(init).forEach(([name, value]) => {
            this.list.push([name, value]);
          });
        }
      } else {
        this.list = this.parse(String(init));
      }
    }

    private serialize(list: [string, string][]): string {
      return list
        .map(
          ([name, value]) =>
            `${encodeURIComponent(name.replaceAll(' ', '+'))}=${encodeURIComponent(value.replaceAll(' ', '+'))}`,
        )
        .join('&');
    }

    private update() {
      if (this.url === null) {
        return;
      }

      let serialized: string | null = this.serialize(this.list);

      if (serialized.length === 0) {
        serialized = null;
      }

      // this.url.query = serialized;
    }

    get size(): number {
      return this.list.length;
    }

    append(name: string, value: string) {
      this.list.push([String(name), String(value)]);
      this.update();
    }

    delete(name: string) {
      name = String(name);
      this.list = this.list.filter(([currentName]) => currentName !== name);
      this.update();
    }

    get(name: string): string | null {
      name = String(name);
      return this.list.find(([currentName]) => currentName === name)?.[1] ?? null;
    }

    getAll(name: string): string[] {
      name = String(name);
      return this.list.filter(([currentName]) => currentName === name).map(([, currentValue]) => currentValue);
    }

    has(name: string): boolean {
      name = String(name);
      return this.list.some(([currentName]) => currentName === name);
    }

    set(name: string, value: string) {
      if (this.has(name)) {
        let found = false;

        this.list = this.list.reduce(
          (acc, [currentName, currentValue]) => {
            if (currentName === name) {
              if (found) {
                return acc;
              }

              found = true;
              acc.push([String(name), String(value)]);
            } else {
              acc.push([currentName, currentValue]);
            }

            return acc;
          },
          [] as [string, string][],
        );
      } else {
        this.append(name, value);
      }

      this.update();
    }

    sort() {
      this.list.sort(([a], [b]) => a.localeCompare(b));
      this.update();
    }

    *entries(): IterableIterator<[string, string]> {
      for (const [name, value] of this.list) {
        yield [name, value];
      }
    }

    forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any) {
      for (const [name, value] of this.list) {
        callbackfn.call(thisArg, value, name, this);
      }
    }

    *keys(): IterableIterator<string> {
      for (const [name] of this.list) {
        yield name;
      }
    }

    *values(): IterableIterator<string> {
      for (const [, value] of this.list) {
        yield value;
      }
    }

    [Symbol.iterator](): IterableIterator<[string, string]> {
      return this.entries();
    }

    toString(): string {
      return this.serialize(this.list);
    }
  };
})(globalThis);

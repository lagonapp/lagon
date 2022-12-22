(globalThis => {
  globalThis.File = class extends Blob {};

  globalThis.FileReader = class {
    readonly DONE: number;
    readonly EMPTY: number;
    readonly LOADING: number;

    constructor() {}

    onerror(): ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null {}
    onload(): ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null {}

    readAsText(blob: Blob, encoding?: string) {
      blob.text().then(text => {
        this.result = text;
        this.onload(this);
      });
    }
  };
})(globalThis);

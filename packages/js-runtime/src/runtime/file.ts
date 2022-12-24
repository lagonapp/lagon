(globalThis => {
  globalThis.File = class extends Blob {
    readonly lastModified: number;
    readonly name: string;
    readonly webkitRelativePath: string;

    constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
      super(fileBits, options);

      this.lastModified = options?.lastModified || Date.now();
      this.name = fileName;
      this.webkitRelativePath = '';
    }
  };

  // TODO: properly implement FileReader. It should extends Event
  // @ts-expect-errore to fix
  globalThis.FileReader = class {
    // @ts-expect-errore to fix
    readonly DONE: number;
    // @ts-expect-errore to fix
    readonly EMPTY: number;
    // @ts-expect-errore to fix
    readonly LOADING: number;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    // @ts-expect-errore to fix
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onerror(): ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null {}
    // @ts-expect-errore to fix
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onload(): ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null {}

    readAsText(blob: Blob, encoding?: string) {
      blob.text().then(text => {
        // @ts-expect-errore to fix
        this.result = text;
        // @ts-expect-errore to fix
        this.onload(this);
      });
    }
  };
})(globalThis);

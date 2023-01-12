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

  // TODO: remove this @ts-ignore, not sure why it complains about
  // DONE, EMPTY, LOADING
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.FileReader = class extends EventTarget {
    readonly error: DOMException | null = null;
    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    readonly readyState: number = FileReader.EMPTY;
    readonly result: string | ArrayBuffer | null = null;

    // https://www.w3.org/TR/FileAPI/#APIASynch
    static readonly EMPTY = 0;
    static readonly LOADING = 1;
    static readonly DONE = 2;

    abort() {
      // @ts-expect-error to fix
      this.readyState = FileReader.DONE;

      const event = new ProgressEvent('abort');
      // @ts-expect-error to fix
      this.onabort?.(this, event);
      this.dispatchEvent(event);
    }

    readAsArrayBuffer(blob: Blob) {
      this.read(blob.arrayBuffer());
    }

    readAsBinaryString(blob: Blob) {
      this.read(blob.arrayBuffer());
    }

    readAsDataURL(blob: Blob) {
      this.read(blob.text(), btoa);
    }

    readAsText(blob: Blob, encoding?: string) {
      this.read(blob.text());
    }

    private read<T extends string | ArrayBuffer>(promise: Promise<T>, transform?: (result: T) => T) {
      // @ts-expect-error assigning to read only
      this.readyState = FileReader.LOADING;

      const loadstartEvent = new ProgressEvent('loadstart');
      // @ts-expect-error to fix
      this.onloadstart?.(this, loadstartEvent);
      this.dispatchEvent(loadstartEvent);

      promise
        .then(result => {
          // @ts-expect-error assigning to read only
          this.result = transform ? transform(result) : result;
          // @ts-expect-error assigning to read only
          this.readyState = FileReader.DONE;

          const loadEvent = new ProgressEvent('load');
          // @ts-expect-error to fix
          this.onload?.(this, loadEvent);
          this.dispatchEvent(loadEvent);

          const loadendEvent = new ProgressEvent('loadend');
          // @ts-expect-error to fix
          this.onloadend?.(this, loadendEvent);
          this.dispatchEvent(loadendEvent);
        })
        .catch(() => {
          // @ts-expect-error assigning to read only
          this.readyState = FileReader.DONE;

          const errorEvent = new ProgressEvent('error');
          // @ts-expect-error to fix
          this.onerror?.(this, errorEvent);
          this.dispatchEvent(errorEvent);

          const loadendEvent = new ProgressEvent('loadend');
          // @ts-expect-error to fix
          this.onloadend?.(this, loadendEvent);
          this.dispatchEvent(loadendEvent);
        });
    }
  };
})(globalThis);

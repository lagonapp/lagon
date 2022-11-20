// @ts-expect-error blob-polyfill isn't typed
import { Blob } from 'blob-polyfill';

(globalThis => {
  globalThis.Blob = Blob;
})(globalThis);

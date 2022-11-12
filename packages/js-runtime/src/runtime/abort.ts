// @ts-expect-error abortcontroller-polyfill isn't typed
import { AbortController, AbortSignal } from 'abortcontroller-polyfill/dist/abortcontroller';

(globalThis => {
  globalThis.AbortController = AbortController;
  globalThis.AbortSignal = AbortSignal;
})(globalThis);

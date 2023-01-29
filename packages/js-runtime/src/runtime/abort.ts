(globalThis => {
  const { AbortController, AbortSignal } = require('abortcontroller-polyfill/dist/abortcontroller');

  globalThis.AbortController = AbortController;
  globalThis.AbortSignal = AbortSignal;
})(globalThis);

(globalThis => {
  const { URLPattern } = require('urlpattern-polyfill');

  // @ts-expect-error URLPattern is experimental
  globalThis.URLPattern = URLPattern;
})(globalThis);

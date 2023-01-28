import { URLPattern } from 'urlpattern-polyfill';

(globalThis => {
  // @ts-expect-error URLPattern is experimental
  globalThis.URLPattern = URLPattern;
})(globalThis);

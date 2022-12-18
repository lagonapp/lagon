// esbuild will inline the version as a const, and since both
// runtime and js-runtime are versioned together, we can safely
// import the version from the package.json instead of injecting
// it from the Rust code.
import { version } from '../../../package.json';

(globalThis => {
  globalThis.navigator = {
    ...globalThis.navigator,
    userAgent: `Lagon/${version}`,
  };
})(globalThis);

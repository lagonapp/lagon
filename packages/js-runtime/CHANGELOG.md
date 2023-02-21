# @lagon/js-runtime

## 0.3.4

### Patch Changes

- [#591](https://github.com/lagonapp/lagon/pull/591) [`0b422d6`](https://github.com/lagonapp/lagon/commit/0b422d698d80a77c5ed92bbb213078292092776f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Split sync and async bindings into LagonSync/LagonAsync

## 0.3.3

### Patch Changes

- [#578](https://github.com/lagonapp/lagon/pull/578) [`5159a91`](https://github.com/lagonapp/lagon/commit/5159a91a4c2d73fd0f482a60419e68ce055ecfc2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add Headers#getSetCookie()

## 0.3.2

### Patch Changes

- [#538](https://github.com/lagonapp/lagon/pull/538) [`d48af93`](https://github.com/lagonapp/lagon/commit/d48af93b3547051a4a93542086e5dff5acafcb67) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix Response/Response#arrayBuffer

* [#529](https://github.com/lagonapp/lagon/pull/529) [`877cf2e`](https://github.com/lagonapp/lagon/commit/877cf2ea0b629c573a39cf6019f7654f52949de4) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add URLPattern API

- [#529](https://github.com/lagonapp/lagon/pull/529) [`877cf2e`](https://github.com/lagonapp/lagon/commit/877cf2ea0b629c573a39cf6019f7654f52949de4) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Minify js-runtime

## 0.3.1

## 0.3.0

### Minor Changes

- [#460](https://github.com/lagonapp/lagon/pull/460) [`a7b3e3b`](https://github.com/lagonapp/lagon/commit/a7b3e3b4b30bc41dc7e9fd8357b87c474eb36b1c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add timers APIs (`setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`)

### Patch Changes

- [#458](https://github.com/lagonapp/lagon/pull/458) [`083f639`](https://github.com/lagonapp/lagon/commit/083f6396bb79622222eabd0b769c3a7f382d5d21) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Simplify streaming responses

* [#467](https://github.com/lagonapp/lagon/pull/467) [`ef007f6`](https://github.com/lagonapp/lagon/commit/ef007f68700c01143179d4d2b7342545ccbce9d8) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix timers id to always be unique

- [#467](https://github.com/lagonapp/lagon/pull/467) [`ef007f6`](https://github.com/lagonapp/lagon/commit/ef007f68700c01143179d4d2b7342545ccbce9d8) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `self` to `globalThis`

## 0.2.1

### Patch Changes

- [#429](https://github.com/lagonapp/lagon/pull/429) [`84290e6`](https://github.com/lagonapp/lagon/commit/84290e6de6e87c0c4c80da58cfa7365a88aac7c4) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix implementation of `Response.error()` & `Response.redirect()`

* [#438](https://github.com/lagonapp/lagon/pull/438) [`462b024`](https://github.com/lagonapp/lagon/commit/462b0243445a79d208470711be173d4c9e25e3a1) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `Event` & `EventTarget` APIs

- [#423](https://github.com/lagonapp/lagon/pull/423) [`047b7ce`](https://github.com/lagonapp/lagon/commit/047b7ce72ae479f383293755883928276b9806df) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix implementation of `Response.json()`

## 0.2.0

### Minor Changes

- [#403](https://github.com/lagonapp/lagon/pull/403) [`5e2ca1b`](https://github.com/lagonapp/lagon/commit/5e2ca1b23fe34e299b9b0f090238538732a68ace) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add Blob and File APIs

* [#396](https://github.com/lagonapp/lagon/pull/396) [`f538576`](https://github.com/lagonapp/lagon/commit/f538576ee86179e8a53c03dd19e740ff9252f992) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `navigator.userAgent` API

### Patch Changes

- [#253](https://github.com/lagonapp/lagon/pull/253) [`683e635`](https://github.com/lagonapp/lagon/commit/683e635f3037f1d1f01439f762d3acd494b27c64) Thanks [@cyco130](https://github.com/cyco130)! - Bring URL class closer to the standard

## 0.1.8

### Patch Changes

- [#266](https://github.com/lagonapp/lagon/pull/266) [`7154b8f`](https://github.com/lagonapp/lagon/commit/7154b8f9a5370d8bb345c0ebb14441745228f553) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add support for application/x-www-form-urlencoded in Request/Response formData()

* [#270](https://github.com/lagonapp/lagon/pull/270) [`98bcfa4`](https://github.com/lagonapp/lagon/commit/98bcfa4723382db1abd2d4b14aee201cd3cfd298) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add Blob polyfill

## 0.1.7

### Patch Changes

- [#243](https://github.com/lagonapp/lagon/pull/243) [`b50fc2a`](https://github.com/lagonapp/lagon/commit/b50fc2a6df8a9e98400d8f4df9913240c333dd2a) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add FormData and multipart parsing

* [#247](https://github.com/lagonapp/lagon/pull/247) [`4349fc0`](https://github.com/lagonapp/lagon/commit/4349fc07df656dc1c33545547b14fea043179803) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add error(), redirect() and json() static methods to Response

- [#247](https://github.com/lagonapp/lagon/pull/247) [`4349fc0`](https://github.com/lagonapp/lagon/commit/4349fc07df656dc1c33545547b14fea043179803) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add clone() method to Request and Response

* [#222](https://github.com/lagonapp/lagon/pull/222) [`e8c36ac`](https://github.com/lagonapp/lagon/commit/e8c36ac11612a5a41258383cc312dbfe539d789c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add crypto APIs

- [#250](https://github.com/lagonapp/lagon/pull/250) [`4837cc0`](https://github.com/lagonapp/lagon/commit/4837cc037c6fe3f1572074b8aa4da6e3fe9909e5) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add AbortController/AbortSignal API

## 0.1.6

### Patch Changes

- [#231](https://github.com/lagonapp/lagon/pull/231) [`b823e5a`](https://github.com/lagonapp/lagon/commit/b823e5a68919e1386af92c6a4edc80b0c1e1e17a) Thanks [@cyco130](https://github.com/cyco130)! - URL class now includes non-default port in its origin property

* [#228](https://github.com/lagonapp/lagon/pull/228) [`9274c0a`](https://github.com/lagonapp/lagon/commit/9274c0a06e3948e3bd494d4b1d9e8ec81600f153) Thanks [@cyco130](https://github.com/cyco130)! - Allow null and undefined as the first argument of the Response constructor

- [#240](https://github.com/lagonapp/lagon/pull/240) [`8727bc6`](https://github.com/lagonapp/lagon/commit/8727bc64b98f280eb54e4d94ea1c309c13663b59) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use types from WebWorker API

## 0.1.5

### Patch Changes

- [#227](https://github.com/lagonapp/lagon/pull/227) [`bcf8530`](https://github.com/lagonapp/lagon/commit/bcf8530ed1ecd88103861e5304f937c01ca0fcf7) Thanks [@cyco130](https://github.com/cyco130)! - Make Headers class case insensitive

## 0.1.4

### Patch Changes

- [#213](https://github.com/lagonapp/lagon/pull/213) [`0ee60b8`](https://github.com/lagonapp/lagon/commit/0ee60b859b06613b6e28e495e4dff69b0d12e05d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Make streaming APIs global

## 0.1.3

### Patch Changes

- [#207](https://github.com/lagonapp/lagon/pull/207) [`fed1446`](https://github.com/lagonapp/lagon/commit/fed1446326217aa8a6a50bf2a88b0a965986ac37) Thanks [@QuiiBz](https://github.com/QuiiBz)! - printf-like formatting for console.\*

* [#210](https://github.com/lagonapp/lagon/pull/210) [`763ac50`](https://github.com/lagonapp/lagon/commit/763ac5061c47cef18b27ad56239bbfb3da7c12bf) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add core for Lagon globally shared utilities

- [#206](https://github.com/lagonapp/lagon/pull/206) [`71d72f5`](https://github.com/lagonapp/lagon/commit/71d72f54b8a3ee0bf986e7e563eff3ef9bfef360) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `arrayBuffer()` method to `Response`

## 0.1.2

### Patch Changes

- [#186](https://github.com/lagonapp/lagon/pull/186) [`7e30211`](https://github.com/lagonapp/lagon/commit/7e30211209b3e0f3e0260d26bd7ac3887410b7f9) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Complete fetch API

* [#186](https://github.com/lagonapp/lagon/pull/186) [`7e30211`](https://github.com/lagonapp/lagon/commit/7e30211209b3e0f3e0260d26bd7ac3887410b7f9) Thanks [@QuiiBz](https://github.com/QuiiBz)! - console.\* with multiple arguments are now spaced

- [#181](https://github.com/lagonapp/lagon/pull/181) [`fe752fb`](https://github.com/lagonapp/lagon/commit/fe752fb54011208a76ef4ff538d6aadbd41b2c7f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add streaming APIs

## 0.1.1

### Patch Changes

- [#167](https://github.com/lagonapp/lagon/pull/167) [`9eda38b`](https://github.com/lagonapp/lagon/commit/9eda38b3be711bdf537fc2379e9ecd02a8704edb) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Handle Uint8Array in Response body

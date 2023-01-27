# @lagon/runtime

## 0.3.1

### Patch Changes

- [#490](https://github.com/lagonapp/lagon/pull/490) [`9a67eb7`](https://github.com/lagonapp/lagon/commit/9a67eb77e5927eb6e0da296df7d9aeb02711a86f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Limit the number of `fetch()` calls to 20 per execution

* [#497](https://github.com/lagonapp/lagon/pull/497) [`36a69eb`](https://github.com/lagonapp/lagon/commit/36a69ebee0fc6fe93c0ba869c6e63a8af01946f0) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use a condvar to timeout isolates execution

## 0.3.0

### Minor Changes

- [#460](https://github.com/lagonapp/lagon/pull/460) [`a7b3e3b`](https://github.com/lagonapp/lagon/commit/a7b3e3b4b30bc41dc7e9fd8357b87c474eb36b1c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add timers APIs (`setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`)

### Patch Changes

- [#457](https://github.com/lagonapp/lagon/pull/457) [`9c00ad1`](https://github.com/lagonapp/lagon/commit/9c00ad1a5d8c818a61435b5db8aa9fd5f7ef8727) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix runtime error when calling the same function twice

* [#453](https://github.com/lagonapp/lagon/pull/453) [`aa76449`](https://github.com/lagonapp/lagon/commit/aa76449ac4e199dd2fdcb485765b897a3c6da4ac) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve errors stacktrace

## 0.2.1

### Patch Changes

- [#416](https://github.com/lagonapp/lagon/pull/416) [`c3bbdb3`](https://github.com/lagonapp/lagon/commit/c3bbdb366ee6d419d1738511b3f547899c89e983) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add promise_reject_callback to always throw errors

* [#411](https://github.com/lagonapp/lagon/pull/411) [`b0cfd82`](https://github.com/lagonapp/lagon/commit/b0cfd8246d422d4da0f2fb675053ce6b9af83f52) Thanks [@QuiiBz](https://github.com/QuiiBz)! - AES-GCM uses 16 bytes iv instead of 12 bytes previously

- [#447](https://github.com/lagonapp/lagon/pull/447) [`5a4b0dc`](https://github.com/lagonapp/lagon/commit/5a4b0dca8fc6d340b371c1d20e1b5640c7c01731) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Follow redirects in `fetch`

## 0.2.0

### Patch Changes

- [#381](https://github.com/lagonapp/lagon/pull/381) [`4f7c6ab`](https://github.com/lagonapp/lagon/commit/4f7c6ab08cec7a650b0310f58cfd8f79e89e5244) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Avoid creating a new HTTP(S) client on each `fetch` call

* [#397](https://github.com/lagonapp/lagon/pull/397) [`ab4e2ac`](https://github.com/lagonapp/lagon/commit/ab4e2ac7e1882497a57ed68e54ce972826c98acf) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use an Rc for isolates metadata instead of cloning

- [#405](https://github.com/lagonapp/lagon/pull/405) [`4b59eff`](https://github.com/lagonapp/lagon/commit/4b59effdb9e32a73cf3b98a8945883ac38c33bd2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add SHA-1 to CryptoSubtle#digest

## 0.1.10

### Patch Changes

- [#365](https://github.com/lagonapp/lagon/pull/365) [`c6dec43`](https://github.com/lagonapp/lagon/commit/c6dec4316bf6c2e155a7b244c0b74842f0b3527e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Configurable code generation

## 0.1.9

### Patch Changes

- [#320](https://github.com/lagonapp/lagon/pull/320) [`f866de4`](https://github.com/lagonapp/lagon/commit/f866de4351f7b62389777c03267d1207e6b4d36b) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use macros for Rust <-> JS bindings

## 0.1.8

### Patch Changes

- [#295](https://github.com/lagonapp/lagon/pull/295) [`6e98d1b`](https://github.com/lagonapp/lagon/commit/6e98d1b435e46e85dc74c1161fc7c7041910c73d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `startupTimeout` to functions that is higher than `timeout`

* [#263](https://github.com/lagonapp/lagon/pull/263) [`6db8e71`](https://github.com/lagonapp/lagon/commit/6db8e71d8ce51983d39cba87cf3401040fe5ec39) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use shorter keys for Request/Response

## 0.1.7

### Patch Changes

- [#249](https://github.com/lagonapp/lagon/pull/249) [`20d9b3c`](https://github.com/lagonapp/lagon/commit/20d9b3c2f9c290125fabffc78c221d8674c55fa5) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Properly timeout and terminate long-running functions

* [#249](https://github.com/lagonapp/lagon/pull/249) [`20d9b3c`](https://github.com/lagonapp/lagon/commit/20d9b3c2f9c290125fabffc78c221d8674c55fa5) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add functions statistics

- [#222](https://github.com/lagonapp/lagon/pull/222) [`e8c36ac`](https://github.com/lagonapp/lagon/commit/e8c36ac11612a5a41258383cc312dbfe539d789c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add crypto APIs

## 0.1.6

### Patch Changes

- [#217](https://github.com/lagonapp/lagon/pull/217) [`67290b8`](https://github.com/lagonapp/lagon/commit/67290b812b1b20a473c02e8f07cd802a846b5ddd) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Throw an error when importing modules

* [#223](https://github.com/lagonapp/lagon/pull/223) [`5e803dc`](https://github.com/lagonapp/lagon/commit/5e803dce3488ddf0fb80715cececf63dda773d1e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add on_drop callback and properly handle isolate termination

## 0.1.5

### Patch Changes

- [#205](https://github.com/lagonapp/lagon/pull/205) [`8c01399`](https://github.com/lagonapp/lagon/commit/8c013995536fca105703e8a937c8040798196e6f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Handle fetch errors

* [#206](https://github.com/lagonapp/lagon/pull/206) [`71d72f5`](https://github.com/lagonapp/lagon/commit/71d72f54b8a3ee0bf986e7e563eff3ef9bfef360) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `arrayBuffer()` method to `Response`

## 0.1.4

### Patch Changes

- [#181](https://github.com/lagonapp/lagon/pull/181) [`fe752fb`](https://github.com/lagonapp/lagon/commit/fe752fb54011208a76ef4ff538d6aadbd41b2c7f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add support for http streaming via ReadableStream

* [#186](https://github.com/lagonapp/lagon/pull/186) [`7e30211`](https://github.com/lagonapp/lagon/commit/7e30211209b3e0f3e0260d26bd7ac3887410b7f9) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Complete fetch API

- [#185](https://github.com/lagonapp/lagon/pull/185) [`d40f143`](https://github.com/lagonapp/lagon/commit/d40f143aa8836a3867f7a501bcd76322889c4a2b) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Beautify errors

## 0.1.3

### Patch Changes

- [#168](https://github.com/lagonapp/lagon/pull/168) [`bb3c823`](https://github.com/lagonapp/lagon/commit/bb3c8239c75488d7d6ddaec7aedfb749a18ccfb3) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Implement event loop

* [#164](https://github.com/lagonapp/lagon/pull/164) [`d7f6f32`](https://github.com/lagonapp/lagon/commit/d7f6f3210af0a5f59acd69ddae2452c217603fcd) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Update rusty_v8 to 0.51

- [#164](https://github.com/lagonapp/lagon/pull/164) [`d7f6f32`](https://github.com/lagonapp/lagon/commit/d7f6f3210af0a5f59acd69ddae2452c217603fcd) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Load ICU data to enable i18n

* [#167](https://github.com/lagonapp/lagon/pull/167) [`9eda38b`](https://github.com/lagonapp/lagon/commit/9eda38b3be711bdf537fc2379e9ecd02a8704edb) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Handle Uint8Array in Response body

## 0.1.2

### Patch Changes

- [#156](https://github.com/lagonapp/lagon/pull/156) [`dcfdf5d`](https://github.com/lagonapp/lagon/commit/dcfdf5d591fb787a8d9c549345f8c8901593a455) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add cpu and memory statistics

## 0.1.1

### Patch Changes

- [#146](https://github.com/lagonapp/lagon/pull/146) [`e8175ef`](https://github.com/lagonapp/lagon/commit/e8175effa1e3ccaaa673e60bfba4fcb9376cc15d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Move from Node.js to Rust

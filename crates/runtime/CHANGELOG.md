# @lagon/runtime

## 0.3.19

## 0.3.18

### Patch Changes

- [#932](https://github.com/lagonapp/lagon/pull/932) [`dd96fd0`](https://github.com/lagonapp/lagon/commit/dd96fd0bf692c01023727d12415d737b21035f7d) Thanks [@akitaSummer](https://github.com/akitaSummer)! - Add `CompressionStream` & `DecompressionStream` APIs

## 0.3.17

### Patch Changes

- [#916](https://github.com/lagonapp/lagon/pull/916) [`a8a02dd`](https://github.com/lagonapp/lagon/commit/a8a02dd0bd244599d9c6be622e79c6f4cb1b3db4) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Replace once_cell with std's OnceLock

- [#949](https://github.com/lagonapp/lagon/pull/949) [`d003a29`](https://github.com/lagonapp/lagon/commit/d003a2937775f00c17e1bf6b83d46310355c077d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve performance of Headers & Body (Request & Response)

- [#941](https://github.com/lagonapp/lagon/pull/941) [`2dcce72`](https://github.com/lagonapp/lagon/commit/2dcce72d3d0033472c36d2817d8e13153aeaa1bf) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Support HTTP/2 (along with HTTP/1.1) in `fetch()`

- [#938](https://github.com/lagonapp/lagon/pull/938) [`0a64b68`](https://github.com/lagonapp/lagon/commit/0a64b68b3616fe70d099af6eb5df8a1a9e7093d2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Forward X-Lagon-Id header

## 0.3.16

## 0.3.15

## 0.3.14

### Patch Changes

- [#868](https://github.com/lagonapp/lagon/pull/868) [`33fa56c`](https://github.com/lagonapp/lagon/commit/33fa56c12b80d091a45fdffac0791c46f760e2e2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Allow `export as` for handler function

* [#889](https://github.com/lagonapp/lagon/pull/889) [`62447ba`](https://github.com/lagonapp/lagon/commit/62447bac3dbef88eb31a2ade620f478e7c27b538) Thanks [@akitaSummer](https://github.com/akitaSummer)! - Support RSA-OAEP for `SubtleCrypto#encrypt` & `SubtleCrypto#decrypto`

- [#883](https://github.com/lagonapp/lagon/pull/883) [`00c1e66`](https://github.com/lagonapp/lagon/commit/00c1e6630d43f247e8d9893e63ff5de1ca7e64f5) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve performance by always using Hyper types

## 0.3.13

### Patch Changes

- [#863](https://github.com/lagonapp/lagon/pull/863) [`4e6968a`](https://github.com/lagonapp/lagon/commit/4e6968a3688f52530cb4aed09022fd5dc54c0a80) Thanks [@akitaSummer](https://github.com/akitaSummer)! - Add AES-CTR to `SubtleCrypto#encrypt` & `SubtleCrypto#decrypt`

* [#857](https://github.com/lagonapp/lagon/pull/857) [`c08bbf9`](https://github.com/lagonapp/lagon/commit/c08bbf9405718d7c361f252f7485766fa3ab274c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - `crypto#getRandomValues` updates array in-place

- [#861](https://github.com/lagonapp/lagon/pull/861) [`22f5cc1`](https://github.com/lagonapp/lagon/commit/22f5cc1eea6d65963060d289945dc956312a50b3) Thanks [@akitaSummer](https://github.com/akitaSummer)! - Add RSA-PSS, RSASSA-PKCS1-v1_5 & ECDSA to `SubtleCrypto#sign` & `SubtleCrypto#verify`

## 0.3.12

### Patch Changes

- [#839](https://github.com/lagonapp/lagon/pull/839) [`52b170a`](https://github.com/lagonapp/lagon/commit/52b170a993e43da1bf465d2e5c7dd848c9eb1168) Thanks [@akitaSummer](https://github.com/akitaSummer)! - Add SubtleCrypto#deriveBits

* [#851](https://github.com/lagonapp/lagon/pull/851) [`66b1fa5`](https://github.com/lagonapp/lagon/commit/66b1fa59992ac5fba83f6a0bdec49a6621bacc2c) Thanks [@akitaSummer](https://github.com/akitaSummer)! - Add SubtleCrypto#deriveKey

- [#848](https://github.com/lagonapp/lagon/pull/848) [`cd214f2`](https://github.com/lagonapp/lagon/commit/cd214f2f20aa9bc32f96c0bc7841ac308650d3b7) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Support AES-CBC for `SubtleCrypto#encrypt` & `SubtleCrypto#decrypt`

## 0.3.11

### Patch Changes

- [#834](https://github.com/lagonapp/lagon/pull/834) [`d6e39ae`](https://github.com/lagonapp/lagon/commit/d6e39ae79c2b6cf2aa83c883bf8a926c319e1712) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve Request/Response error messages

## 0.3.10

### Patch Changes

- [#813](https://github.com/lagonapp/lagon/pull/813) [`835094f`](https://github.com/lagonapp/lagon/commit/835094fef023aee532e1d57e895e4f1cb6189d22) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Calculate isolate statistics at every seconds instead of every request

* [#814](https://github.com/lagonapp/lagon/pull/814) [`29fb49d`](https://github.com/lagonapp/lagon/commit/29fb49d7ace2759be57157969b4ffca61ed748d1) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve Request/Response allocations

- [#807](https://github.com/lagonapp/lagon/pull/807) [`b0b0cc5`](https://github.com/lagonapp/lagon/commit/b0b0cc52c37e69518f9a44892150eeac8c642f76) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve Request/Response default headers

* [#802](https://github.com/lagonapp/lagon/pull/802) [`40b8a4f`](https://github.com/lagonapp/lagon/commit/40b8a4f08142cc0fc74eb73209e67b9f0bf8366b) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Update to V8 11.4

## 0.3.9

### Patch Changes

- [#778](https://github.com/lagonapp/lagon/pull/778) [`54df73e`](https://github.com/lagonapp/lagon/commit/54df73e6a0043307f4e153613806122fad1809d2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use once_cell instead of lazy_static

## 0.3.8

### Patch Changes

- [#679](https://github.com/lagonapp/lagon/pull/679) [`f8d78b7`](https://github.com/lagonapp/lagon/commit/f8d78b71538f908a3b86b1f748c8fb8bd969c926) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Terminate isolates with 2 heartbeats missed

* [#680](https://github.com/lagonapp/lagon/pull/680) [`4ce40b8`](https://github.com/lagonapp/lagon/commit/4ce40b8dfa6f412968dbac63e004051684996c4d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Block thread while waiting for new requests

- [#676](https://github.com/lagonapp/lagon/pull/676) [`54e37e3`](https://github.com/lagonapp/lagon/commit/54e37e34b3d49a1ecc70203db4a4bd99165bfa1c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Allow parallel requests to the same isolate

## 0.3.7

### Patch Changes

- [#663](https://github.com/lagonapp/lagon/pull/663) [`822db09`](https://github.com/lagonapp/lagon/commit/822db09957b439cf548dd5bac85e7325e6a468c8) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Create HashMap with_capacity to avoid reallocations

## 0.3.6

### Patch Changes

- [#624](https://github.com/lagonapp/lagon/pull/624) [`046d04f`](https://github.com/lagonapp/lagon/commit/046d04f9cb5d6510fec61057a33614b4e1352f37) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Avoid thread panicking when promise id is not found

## 0.3.5

### Patch Changes

- [#622](https://github.com/lagonapp/lagon/pull/622) [`c0cd90f`](https://github.com/lagonapp/lagon/commit/c0cd90fa08c4861def6196b6527af6cd9aa96ed5) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Support multiple request/response headers for set-cookie

* [#623](https://github.com/lagonapp/lagon/pull/623) [`72c78d1`](https://github.com/lagonapp/lagon/commit/72c78d18537cca86aa0106683dcd6ffb9bda1c3c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve objects creation speed

## 0.3.4

### Patch Changes

- [#591](https://github.com/lagonapp/lagon/pull/591) [`0b422d6`](https://github.com/lagonapp/lagon/commit/0b422d698d80a77c5ed92bbb213078292092776f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Split sync and async bindings into LagonSync/LagonAsync

* [#591](https://github.com/lagonapp/lagon/pull/591) [`0b422d6`](https://github.com/lagonapp/lagon/commit/0b422d698d80a77c5ed92bbb213078292092776f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add option to load V8 heap snapshot

- [#603](https://github.com/lagonapp/lagon/pull/603) [`f1271d4`](https://github.com/lagonapp/lagon/commit/f1271d475554ceff750e46cac0f48cef9e91d4e2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Remove unused HTTP client instance

## 0.3.3

## 0.3.2

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

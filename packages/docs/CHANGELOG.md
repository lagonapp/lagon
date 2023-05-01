# @lagon/docs

## 0.3.6

### Patch Changes

- [#798](https://github.com/lagonapp/lagon/pull/798) [`b931b92`](https://github.com/lagonapp/lagon/commit/b931b92c4aae5e809ab99438fa3b0338521ed62e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add Turso example

## 0.3.5

### Patch Changes

- [`209ee44`](https://github.com/lagonapp/lagon/commit/209ee449043f90b83df8ac8301d136c10dd44aa3) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Set `process.env.NODE_ENV` to "development" when using `lagon dev`

* [#782](https://github.com/lagonapp/lagon/pull/782) [`b92e0de`](https://github.com/lagonapp/lagon/commit/b92e0de61c0254e49ac3626de2517081465010be) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Automatically load .env files with `lagon dev` if present in root

- [#781](https://github.com/lagonapp/lagon/pull/781) [`b5894e2`](https://github.com/lagonapp/lagon/commit/b5894e23da9920c9338f350d25a5276cd70d3267) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add PlanetScale example

## 0.3.4

### Patch Changes

- [#745](https://github.com/lagonapp/lagon/pull/745) [`82c5737`](https://github.com/lagonapp/lagon/commit/82c5737b4aecba78cf3d88362d9064254d773baa) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add vite-plugin-ssr example

* [#754](https://github.com/lagonapp/lagon/pull/754) [`9cd29c6`](https://github.com/lagonapp/lagon/commit/9cd29c605ac58f94c6170d13c1f8cb4ca1c0cd0f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Store logs for 7 days

## 0.3.3

### Patch Changes

- [#733](https://github.com/lagonapp/lagon/pull/733) [`a75de67`](https://github.com/lagonapp/lagon/commit/a75de673cae0e7d2b2ef140b0e54df63875db27a) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add pricing page

* [#738](https://github.com/lagonapp/lagon/pull/738) [`78c3787`](https://github.com/lagonapp/lagon/commit/78c3787422bd5806a6ab8ad6a8bb73009ee89257) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve Deployments docs

- [#733](https://github.com/lagonapp/lagon/pull/733) [`a75de67`](https://github.com/lagonapp/lagon/commit/a75de673cae0e7d2b2ef140b0e54df63875db27a) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Update CPU time to request duration

* [#738](https://github.com/lagonapp/lagon/pull/738) [`78c3787`](https://github.com/lagonapp/lagon/commit/78c3787422bd5806a6ab8ad6a8bb73009ee89257) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Rename Static Files to Assets

## 0.3.2

### Patch Changes

- [#684](https://github.com/lagonapp/lagon/pull/684) [`9da1136`](https://github.com/lagonapp/lagon/commit/9da113606e60078b62f7cc57ba4a31baafd64025) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `AsyncLocalStorage` & `AsyncContext` APIs

* [#688](https://github.com/lagonapp/lagon/pull/688) [`0dffdb2`](https://github.com/lagonapp/lagon/commit/0dffdb215058bdab6617e342b0b17525ff6e4cf7) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Allow `lagon deploy` & `lagon build` to specify files and folders

## 0.3.1

### Patch Changes

- [#251](https://github.com/lagonapp/lagon/pull/251) [`a3b73c6`](https://github.com/lagonapp/lagon/commit/a3b73c623136db5a4840e1d43138ecd96b66059e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve documentation for deployments, static files, npm support

* [#251](https://github.com/lagonapp/lagon/pull/251) [`a3b73c6`](https://github.com/lagonapp/lagon/commit/a3b73c623136db5a4840e1d43138ecd96b66059e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add sitemap

- [#251](https://github.com/lagonapp/lagon/pull/251) [`a3b73c6`](https://github.com/lagonapp/lagon/commit/a3b73c623136db5a4840e1d43138ecd96b66059e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Update Montreal region to Beauharnois

## 0.3.0

### Minor Changes

- [#604](https://github.com/lagonapp/lagon/pull/604) [`73856f5`](https://github.com/lagonapp/lagon/commit/73856f599f623288cd855209dcf1426564dee83f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve functions configuration by saving parameters into a local config file.

  When using `lagon dev`, `lagon build` or `lagon deploy`, you don't need anymore to specify the function's entrypoint and the public directory. These configuration are saved into a local `.lagon/config.json` file.

  Note that `lagon dev` still allows to specify an entrypoint and public directory as before using arguments and options, making it easy to test locally.

### Patch Changes

- [#580](https://github.com/lagonapp/lagon/pull/580) [`74efd18`](https://github.com/lagonapp/lagon/commit/74efd186f97b86dd085c7a90e1f35c78507f5bbe) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use lagon.dev for Lagon-hosted functions

## 0.2.1

### Patch Changes

- [#578](https://github.com/lagonapp/lagon/pull/578) [`5159a91`](https://github.com/lagonapp/lagon/commit/5159a91a4c2d73fd0f482a60419e68ce055ecfc2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add Headers#getSetCookie()

## 0.2.0

### Minor Changes

- [#538](https://github.com/lagonapp/lagon/pull/538) [`d48af93`](https://github.com/lagonapp/lagon/commit/d48af93b3547051a4a93542086e5dff5acafcb67) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add an examples page

### Patch Changes

- [#552](https://github.com/lagonapp/lagon/pull/552) [`6734a50`](https://github.com/lagonapp/lagon/commit/6734a50c004c556c2e09c57bd7f6991c55fa7156) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add Remix integration documentation

## 0.1.3

### Patch Changes

- [#486](https://github.com/lagonapp/lagon/pull/486) [`d5be717`](https://github.com/lagonapp/lagon/commit/d5be71752372260eeabe363e40b3e5b37a6a2d7c) Thanks [@renovate](https://github.com/apps/renovate)! - Add `FileReader` & `ProgressEvent` docs

* [#490](https://github.com/lagonapp/lagon/pull/490) [`9a67eb7`](https://github.com/lagonapp/lagon/commit/9a67eb77e5927eb6e0da296df7d9aeb02711a86f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Limit the number of `fetch()` calls to 20 per execution

- [#495](https://github.com/lagonapp/lagon/pull/495) [`c8349b7`](https://github.com/lagonapp/lagon/commit/c8349b75f4d84ca54643da799c3d05515daf6420) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add san-francisco-us-west and bangalore-ap-south regions

## 0.1.2

### Patch Changes

- [#460](https://github.com/lagonapp/lagon/pull/460) [`a7b3e3b`](https://github.com/lagonapp/lagon/commit/a7b3e3b4b30bc41dc7e9fd8357b87c474eb36b1c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add timers APIs (`setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `queueMicrotask`)

## 0.1.1

### Patch Changes

- [#438](https://github.com/lagonapp/lagon/pull/438) [`462b024`](https://github.com/lagonapp/lagon/commit/462b0243445a79d208470711be173d4c9e25e3a1) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `Event` & `EventTarget` APIs

## 0.1.0

### Minor Changes

- [#403](https://github.com/lagonapp/lagon/pull/403) [`5e2ca1b`](https://github.com/lagonapp/lagon/commit/5e2ca1b23fe34e299b9b0f090238538732a68ace) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add Blob and File APIs

* [#396](https://github.com/lagonapp/lagon/pull/396) [`f538576`](https://github.com/lagonapp/lagon/commit/f538576ee86179e8a53c03dd19e740ff9252f992) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `navigator.userAgent` API

### Patch Changes

- [#374](https://github.com/lagonapp/lagon/pull/374) [`fa2d2a8`](https://github.com/lagonapp/lagon/commit/fa2d2a8b66df18460d7d71b4101d730ff8cc8768) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix position of `lagon link` section

* [#390](https://github.com/lagonapp/lagon/pull/390) [`6c2f557`](https://github.com/lagonapp/lagon/commit/6c2f5577b1997f3b9c46fbfeb7cbedd93a1cb92e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add limits page

- [#405](https://github.com/lagonapp/lagon/pull/405) [`4b59eff`](https://github.com/lagonapp/lagon/commit/4b59effdb9e32a73cf3b98a8945883ac38c33bd2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add SHA-1 to CryptoSubtle#digest

## 0.0.6

### Patch Changes

- [#357](https://github.com/lagonapp/lagon/pull/357) [`4e1372c`](https://github.com/lagonapp/lagon/commit/4e1372ccac668570202b39a53e218151499cb0a7) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve contributing guidelines

* [#365](https://github.com/lagonapp/lagon/pull/365) [`c6dec43`](https://github.com/lagonapp/lagon/commit/c6dec4316bf6c2e155a7b244c0b74842f0b3527e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add --allow-code-generation docs for lagon dev

## 0.0.5

### Patch Changes

- [#300](https://github.com/lagonapp/lagon/pull/300) [`314012b`](https://github.com/lagonapp/lagon/commit/314012be1079505cc99ec4024818dfa6e65a85e1) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Complete docs for the new CLI commands

## 0.0.4

### Patch Changes

- [#222](https://github.com/lagonapp/lagon/pull/222) [`e8c36ac`](https://github.com/lagonapp/lagon/commit/e8c36ac11612a5a41258383cc312dbfe539d789c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add crypto APIs

* [#250](https://github.com/lagonapp/lagon/pull/250) [`4837cc0`](https://github.com/lagonapp/lagon/commit/4837cc037c6fe3f1572074b8aa4da6e3fe9909e5) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add AbortController/AbortSignal API

## 0.0.3

### Patch Changes

- [#238](https://github.com/lagonapp/lagon/pull/238) [`045977c`](https://github.com/lagonapp/lagon/commit/045977cb200281d68c9a834573ca43ff300f9f73) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add --prod option to `lagon deploy`

## 0.0.2

### Patch Changes

- [#225](https://github.com/lagonapp/lagon/pull/225) [`eebaf9d`](https://github.com/lagonapp/lagon/commit/eebaf9d535c9376cdccacb5a7578eae30835c9e1) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add vercel audiences

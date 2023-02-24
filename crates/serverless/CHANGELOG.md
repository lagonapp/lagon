# @lagon/serverless

## 0.1.20

### Patch Changes

- [#614](https://github.com/lagonapp/lagon/pull/614) [`909ff4b`](https://github.com/lagonapp/lagon/commit/909ff4b12ff8dd2f2b282b0c913b14a27ebf7baa) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Reconnect Redis Pub/Sub on error

## 0.1.19

### Patch Changes

- [#591](https://github.com/lagonapp/lagon/pull/591) [`0b422d6`](https://github.com/lagonapp/lagon/commit/0b422d698d80a77c5ed92bbb213078292092776f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add option to load V8 heap snapshot

* [#580](https://github.com/lagonapp/lagon/pull/580) [`74efd18`](https://github.com/lagonapp/lagon/commit/74efd186f97b86dd085c7a90e1f35c78507f5bbe) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use lagon.dev for Lagon-hosted functions

## 0.1.18

### Patch Changes

- [#564](https://github.com/lagonapp/lagon/pull/564) [`8745295`](https://github.com/lagonapp/lagon/commit/87452957505670a0f538505384203d40728da73d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Send 404 if favicon doesn't exists

* [#568](https://github.com/lagonapp/lagon/pull/568) [`867ce0c`](https://github.com/lagonapp/lagon/commit/867ce0ce9e2b97890a385915eaf9ac8474d83188) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix bytes event on sync responses

- [#573](https://github.com/lagonapp/lagon/pull/573) [`90520ae`](https://github.com/lagonapp/lagon/commit/90520ae11497e4b4bf68d8f74fdd627f7fcf33a7) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix logging HTTP request

* [#571](https://github.com/lagonapp/lagon/pull/571) [`b2cca7f`](https://github.com/lagonapp/lagon/commit/b2cca7f897bd5f86e8e32a87a119bf5fa6b8d540) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Trace request id in logs

## 0.1.17

### Patch Changes

- [#557](https://github.com/lagonapp/lagon/pull/557) [`15477b1`](https://github.com/lagonapp/lagon/commit/15477b1b8dfef8076afceaed930044c280175b7c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add IP-based authorization to prometheus exporter

* [#559](https://github.com/lagonapp/lagon/pull/559) [`8e2eaa0`](https://github.com/lagonapp/lagon/commit/8e2eaa0149d0b65e00414f27ff526afa93af78b7) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve error pages

## 0.1.16

### Patch Changes

- [#484](https://github.com/lagonapp/lagon/pull/484) [`d487cd0`](https://github.com/lagonapp/lagon/commit/d487cd0aa08cd0f9908a096133a3705aceeee73f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Always drop isolates on the same thread as created

* [#493](https://github.com/lagonapp/lagon/pull/493) [`f15be2f`](https://github.com/lagonapp/lagon/commit/f15be2f4f568c0a42ab247104d8198d688a0413d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Support cron deployments

## 0.1.15

### Patch Changes

- [#483](https://github.com/lagonapp/lagon/pull/483) [`9468c1f`](https://github.com/lagonapp/lagon/commit/9468c1fc75e45cbe042f5a5b106158d918616562) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Drop and exit isolates in the same thread as they were created

* [#463](https://github.com/lagonapp/lagon/pull/463) [`6cabfb7`](https://github.com/lagonapp/lagon/commit/6cabfb78a97f69cf2206252c423f8fa409a371ad) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use the system root CA to connect to MySQL

- [#458](https://github.com/lagonapp/lagon/pull/458) [`083f639`](https://github.com/lagonapp/lagon/commit/083f6396bb79622222eabd0b769c3a7f382d5d21) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Allow ending a stream before sending the response

## 0.1.14

### Patch Changes

- [#416](https://github.com/lagonapp/lagon/pull/416) [`c3bbdb3`](https://github.com/lagonapp/lagon/commit/c3bbdb366ee6d419d1738511b3f547899c89e983) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Stop streaming and log errors when we have errors/timeouts/memory limits

* [#416](https://github.com/lagonapp/lagon/pull/416) [`c3bbdb3`](https://github.com/lagonapp/lagon/commit/c3bbdb366ee6d419d1738511b3f547899c89e983) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Handle termination results (timeouts and memory limit) before processing streaming to avoid hanging

## 0.1.13

### Patch Changes

- [#389](https://github.com/lagonapp/lagon/pull/389) [`5ec41ee`](https://github.com/lagonapp/lagon/commit/5ec41ee203bba86cb66d9486ffcde9fd2f28e361) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add metrics for errors/timeouts/memory limits

* [#397](https://github.com/lagonapp/lagon/pull/397) [`ab4e2ac`](https://github.com/lagonapp/lagon/commit/ab4e2ac7e1882497a57ed68e54ce972826c98acf) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use an Rc for isolates metadata instead of cloning

- [#379](https://github.com/lagonapp/lagon/pull/379) [`d48f00c`](https://github.com/lagonapp/lagon/commit/d48f00c3e042f6ec66cfba9ff7b2dafa418fcc84) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Forward X-Real-Ip header to X-Forwarded-For

* [#379](https://github.com/lagonapp/lagon/pull/379) [`d48f00c`](https://github.com/lagonapp/lagon/commit/d48f00c3e042f6ec66cfba9ff7b2dafa418fcc84) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Forward X-Lagon-Region header

## 0.1.12

### Patch Changes

- [#354](https://github.com/lagonapp/lagon/pull/354) [`2b0b265`](https://github.com/lagonapp/lagon/commit/2b0b265ce4657db96728e5a9c82eddefa4801bc9) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add LAGON_LISTEN_ADDR and PROMETHEUS_LISTEN_ADDR env variables

* [#353](https://github.com/lagonapp/lagon/pull/353) [`2bf63f3`](https://github.com/lagonapp/lagon/commit/2bf63f37dd92fdb99a173af5b49033a23456f4b4) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Don't use a .env file on release builds

- [#363](https://github.com/lagonapp/lagon/pull/363) [`04afb96`](https://github.com/lagonapp/lagon/commit/04afb9616bbffaa4e0ac5e1c5fcd2e0724b02713) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add more metrics

## 0.1.11

### Patch Changes

- [#335](https://github.com/lagonapp/lagon/pull/335) [`e10aabe`](https://github.com/lagonapp/lagon/commit/e10aabee456fa54892507f9b4407b66faee450d3) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve performances by not spawning a thread on each request

* [#329](https://github.com/lagonapp/lagon/pull/329) [`e24d381`](https://github.com/lagonapp/lagon/commit/e24d3811ef6b54d8c343edc26697713bdd4b2985) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve logs

## 0.1.10

### Patch Changes

- [#257](https://github.com/lagonapp/lagon/pull/257) [`2a185ef`](https://github.com/lagonapp/lagon/commit/2a185efa8395e770129025c2f8c973b4711c0c19) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add logs for response types

* [#261](https://github.com/lagonapp/lagon/pull/261) [`fee60e4`](https://github.com/lagonapp/lagon/commit/fee60e4641c39eac5b89ebe5a24b398070e5d291) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve performances by avoiding expensive clones

- [#295](https://github.com/lagonapp/lagon/pull/295) [`6e98d1b`](https://github.com/lagonapp/lagon/commit/6e98d1b435e46e85dc74c1161fc7c7041910c73d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `startupTimeout` to functions that is higher than `timeout`

* [#264](https://github.com/lagonapp/lagon/pull/264) [`e970b9d`](https://github.com/lagonapp/lagon/commit/e970b9d09aecc7d173e5f1056a7c0bee854ce93a) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Properly clear isolates cache after the configured seconds and no requests

- [#276](https://github.com/lagonapp/lagon/pull/276) [`6dca4fd`](https://github.com/lagonapp/lagon/commit/6dca4fd0d4157693115a1420a4a405a14486a87d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix functions timeout

## 0.1.9

### Patch Changes

- [#249](https://github.com/lagonapp/lagon/pull/249) [`20d9b3c`](https://github.com/lagonapp/lagon/commit/20d9b3c2f9c290125fabffc78c221d8674c55fa5) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add functions statistics

* [#252](https://github.com/lagonapp/lagon/pull/252) [`745ad8d`](https://github.com/lagonapp/lagon/commit/745ad8d65a7ee40b874bfdf28a236aa9bee548a0) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Support .html and index.html for static file paths

## 0.1.8

### Patch Changes

- [#239](https://github.com/lagonapp/lagon/pull/239) [`241305a`](https://github.com/lagonapp/lagon/commit/241305a80725856c7e437650f0b9a2d17b4e9e42) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add more context to logs

* [#238](https://github.com/lagonapp/lagon/pull/238) [`045977c`](https://github.com/lagonapp/lagon/commit/045977cb200281d68c9a834573ca43ff300f9f73) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add production/preview deployments

- [#237](https://github.com/lagonapp/lagon/pull/237) [`747774b`](https://github.com/lagonapp/lagon/commit/747774b5bbf763fcb44de4834c3ac8c3dcd2604c) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve error handling

## 0.1.7

### Patch Changes

- [#216](https://github.com/lagonapp/lagon/pull/216) [`b5d47cb`](https://github.com/lagonapp/lagon/commit/b5d47cb30e7741c4f27adb8fbbf4c6cca6966021) Thanks [@bahlo](https://github.com/bahlo)! - Fix Axiom logger

* [#224](https://github.com/lagonapp/lagon/pull/224) [`0d2cd1a`](https://github.com/lagonapp/lagon/commit/0d2cd1a291c1815f28fd24d09222df5b2447c9d4) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve 500/400 pages with proper HTML/CSS

- [#223](https://github.com/lagonapp/lagon/pull/223) [`5e803dc`](https://github.com/lagonapp/lagon/commit/5e803dce3488ddf0fb80715cececf63dda773d1e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add configurable LRU time cache for isolates

* [#220](https://github.com/lagonapp/lagon/pull/220) [`4d368dc`](https://github.com/lagonapp/lagon/commit/4d368dc22bcbb311eb31aeb1947490ac311590c9) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Forward client IP through X-Forwarded-For header

## 0.1.6

### Patch Changes

- [#213](https://github.com/lagonapp/lagon/pull/213) [`0ee60b8`](https://github.com/lagonapp/lagon/commit/0ee60b859b06613b6e28e495e4dff69b0d12e05d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Make streaming APIs global

## 0.1.5

### Patch Changes

- [#204](https://github.com/lagonapp/lagon/pull/204) [`f95dbe4`](https://github.com/lagonapp/lagon/commit/f95dbe41212f020a2fafe2ba072ae137cce67ff8) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix subsequent requests when streaming response

* [#204](https://github.com/lagonapp/lagon/pull/204) [`f95dbe4`](https://github.com/lagonapp/lagon/commit/f95dbe41212f020a2fafe2ba072ae137cce67ff8) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Correctly resolve stream bytes

## 0.1.4

### Patch Changes

- [#181](https://github.com/lagonapp/lagon/pull/181) [`fe752fb`](https://github.com/lagonapp/lagon/commit/fe752fb54011208a76ef4ff538d6aadbd41b2c7f) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add support for http streaming via ReadableStream

* [#183](https://github.com/lagonapp/lagon/pull/183) [`2830c24`](https://github.com/lagonapp/lagon/commit/2830c24116924353140f077d10ec978b7c0952e3) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix assets directory not deleting on undeploys

## 0.1.3

### Patch Changes

- [#164](https://github.com/lagonapp/lagon/pull/164) [`d7f6f32`](https://github.com/lagonapp/lagon/commit/d7f6f3210af0a5f59acd69ddae2452c217603fcd) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix URL format

* [#164](https://github.com/lagonapp/lagon/pull/164) [`d7f6f32`](https://github.com/lagonapp/lagon/commit/d7f6f3210af0a5f59acd69ddae2452c217603fcd) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix domains assignement

- [#164](https://github.com/lagonapp/lagon/pull/164) [`d7f6f32`](https://github.com/lagonapp/lagon/commit/d7f6f3210af0a5f59acd69ddae2452c217603fcd) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use TLS for Redis / MySQL connections

* [#162](https://github.com/lagonapp/lagon/pull/162) [`2821265`](https://github.com/lagonapp/lagon/commit/282126547213021475c05d36e5c12fd2db51add5) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add stdout & axiom logging

## 0.1.2

### Patch Changes

- [#160](https://github.com/lagonapp/lagon/pull/160) [`94c14ac`](https://github.com/lagonapp/lagon/commit/94c14ac522075079e0d271467f4445b38f9a2d47) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Correctly bundle assets

* [#160](https://github.com/lagonapp/lagon/pull/160) [`94c14ac`](https://github.com/lagonapp/lagon/commit/94c14ac522075079e0d271467f4445b38f9a2d47) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix deployments not working with multiple assets

- [#156](https://github.com/lagonapp/lagon/pull/156) [`dcfdf5d`](https://github.com/lagonapp/lagon/commit/dcfdf5d591fb787a8d9c549345f8c8901593a455) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add statistics

## 0.1.1

### Patch Changes

- [#146](https://github.com/lagonapp/lagon/pull/146) [`e8175ef`](https://github.com/lagonapp/lagon/commit/e8175effa1e3ccaaa673e60bfba4fcb9376cc15d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Move from Node.js to Rust

# @lagon/cli

## 0.4.7

### Patch Changes

- [#564](https://github.com/lagonapp/lagon/pull/564) [`8745295`](https://github.com/lagonapp/lagon/commit/87452957505670a0f538505384203d40728da73d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Send 404 if favicon doesn't exists

* [#579](https://github.com/lagonapp/lagon/pull/579) [`1d22c01`](https://github.com/lagonapp/lagon/commit/1d22c01a8455db85a65052dbae78a43136657bed) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve contrast of the colors

## 0.4.6

### Patch Changes

- [#542](https://github.com/lagonapp/lagon/pull/542) [`04235a1`](https://github.com/lagonapp/lagon/commit/04235a181d62c3f2501c981100694241d24fd4d4) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Only update the dev server when files are added/deleted/modified

* [#561](https://github.com/lagonapp/lagon/pull/561) [`8e67150`](https://github.com/lagonapp/lagon/commit/8e671507f1d925a057fd5030c6c5a76be19cdda9) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Increase timeout of isolate for `dev` command

- [#559](https://github.com/lagonapp/lagon/pull/559) [`8e2eaa0`](https://github.com/lagonapp/lagon/commit/8e2eaa0149d0b65e00414f27ff526afa93af78b7) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve error pages

## 0.4.5

### Patch Changes

- [#453](https://github.com/lagonapp/lagon/pull/453) [`aa76449`](https://github.com/lagonapp/lagon/commit/aa76449ac4e199dd2fdcb485765b897a3c6da4ac) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Show errors in the terminal instead of as request responses

* [#458](https://github.com/lagonapp/lagon/pull/458) [`083f639`](https://github.com/lagonapp/lagon/commit/083f6396bb79622222eabd0b769c3a7f382d5d21) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Allow ending a stream before sending the response

## 0.4.4

### Patch Changes

- [#416](https://github.com/lagonapp/lagon/pull/416) [`c3bbdb3`](https://github.com/lagonapp/lagon/commit/c3bbdb366ee6d419d1738511b3f547899c89e983) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Stop streaming and log errors when we have errors/timeouts/memory limits

* [#424](https://github.com/lagonapp/lagon/pull/424) [`6384939`](https://github.com/lagonapp/lagon/commit/6384939835ec621fff547fa4cc86185144eb2ded) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Bundle in ESNext

- [#424](https://github.com/lagonapp/lagon/pull/424) [`6384939`](https://github.com/lagonapp/lagon/commit/6384939835ec621fff547fa4cc86185144eb2ded) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Define process.env.NODE_ENV as "production"

* [#434](https://github.com/lagonapp/lagon/pull/434) [`4697533`](https://github.com/lagonapp/lagon/commit/4697533b6189eb71a10dcc356f0a35a6916079e2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix ESBuild path on Windows

## 0.4.3

### Patch Changes

- [#390](https://github.com/lagonapp/lagon/pull/390) [`6c2f557`](https://github.com/lagonapp/lagon/commit/6c2f5577b1997f3b9c46fbfeb7cbedd93a1cb92e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Implement limits

* [#406](https://github.com/lagonapp/lagon/pull/406) [`7e0738a`](https://github.com/lagonapp/lagon/commit/7e0738a2a610f0047ac4a78a899411b2bc7068ee) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix random segfault with `lagon dev`

## 0.4.2

### Patch Changes

- [#365](https://github.com/lagonapp/lagon/pull/365) [`c6dec43`](https://github.com/lagonapp/lagon/commit/c6dec4316bf6c2e155a7b244c0b74842f0b3527e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add --allow-code-generation flag to dev command

## 0.4.1

### Patch Changes

- [#340](https://github.com/lagonapp/lagon/pull/340) [`75eac5d`](https://github.com/lagonapp/lagon/commit/75eac5d096a08d91334b8bc7fb345cd9a8de4ff4) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix some commands returning an error due to wrong parsing

## 0.4.0

### Minor Changes

- [#273](https://github.com/lagonapp/lagon/pull/273) [`c146417`](https://github.com/lagonapp/lagon/commit/c146417246e0ea8da4d83f35fac65611b755c0b7) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Rename `lagon undeploy` to `lagon rm`

* [#300](https://github.com/lagonapp/lagon/pull/300) [`314012b`](https://github.com/lagonapp/lagon/commit/314012be1079505cc99ec4024818dfa6e65a85e1) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `lagon ls`, `lagon undeploy` & `lagon promote` commands

- [#275](https://github.com/lagonapp/lagon/pull/275) [`54b0714`](https://github.com/lagonapp/lagon/commit/54b07148a084d6daaa5ee2e2e06f4d32d242cb88) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `lagon link` command

### Patch Changes

- [#267](https://github.com/lagonapp/lagon/pull/267) [`99ad5b4`](https://github.com/lagonapp/lagon/commit/99ad5b48ce0c308e90b66cdd3c1c47403a79c855) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Improve console.\* logs with `lagon dev`

* [#274](https://github.com/lagonapp/lagon/pull/274) [`58bb4d9`](https://github.com/lagonapp/lagon/commit/58bb4d9e3a001dc18d6d20b53f7dc1c3acfcc8b4) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Allow having multiple Functions in a folder

## 0.3.6

### Patch Changes

- [#252](https://github.com/lagonapp/lagon/pull/252) [`745ad8d`](https://github.com/lagonapp/lagon/commit/745ad8d65a7ee40b874bfdf28a236aa9bee548a0) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Support .html and index.html for static file paths

## 0.3.5

### Patch Changes

- [#238](https://github.com/lagonapp/lagon/pull/238) [`045977c`](https://github.com/lagonapp/lagon/commit/045977cb200281d68c9a834573ca43ff300f9f73) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add --prod option to `lagon deploy`

* [#236](https://github.com/lagonapp/lagon/pull/236) [`6b44882`](https://github.com/lagonapp/lagon/commit/6b448821f525d4039f97607f31f133e44d227902) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Properly handle tRPC errors

## 0.3.4

### Patch Changes

- [#219](https://github.com/lagonapp/lagon/pull/219) [`b271c2a`](https://github.com/lagonapp/lagon/commit/b271c2ad4adea50a97ef143748b20b9210d0baf9) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add env option to dev command

* [#220](https://github.com/lagonapp/lagon/pull/220) [`4d368dc`](https://github.com/lagonapp/lagon/commit/4d368dc22bcbb311eb31aeb1947490ac311590c9) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Forward client IP through X-Forwarded-For header

## 0.3.3

### Patch Changes

- [#213](https://github.com/lagonapp/lagon/pull/213) [`0ee60b8`](https://github.com/lagonapp/lagon/commit/0ee60b859b06613b6e28e495e4dff69b0d12e05d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Make streaming APIs global

## 0.3.2

### Patch Changes

- [#204](https://github.com/lagonapp/lagon/pull/204) [`f95dbe4`](https://github.com/lagonapp/lagon/commit/f95dbe41212f020a2fafe2ba072ae137cce67ff8) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix subsequent requests when streaming response

* [#212](https://github.com/lagonapp/lagon/pull/212) [`5fe9e73`](https://github.com/lagonapp/lagon/commit/5fe9e73bc115e46b74135de269dae43243594124) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Notify for new release

- [#202](https://github.com/lagonapp/lagon/pull/202) [`b7ee4db`](https://github.com/lagonapp/lagon/commit/b7ee4db186c1aaa824168c85c2f0174b27123024) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Open the configured URL on login

* [#212](https://github.com/lagonapp/lagon/pull/212) [`5fe9e73`](https://github.com/lagonapp/lagon/commit/5fe9e73bc115e46b74135de269dae43243594124) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Show correct version with --version

## 0.3.1

### Patch Changes

- [#195](https://github.com/lagonapp/lagon/pull/195) [`8c12b2b`](https://github.com/lagonapp/lagon/commit/8c12b2b7384af87615cfb8a5d34983d0421a5b28) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix dev command

## 0.3.0

### Minor Changes

- [#189](https://github.com/lagonapp/lagon/pull/189) [`77a7218`](https://github.com/lagonapp/lagon/commit/77a7218801cd7bd99ba388fcb064e81d5204e487) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add lagon dev command

* [#191](https://github.com/lagonapp/lagon/pull/191) [`84c2e44`](https://github.com/lagonapp/lagon/commit/84c2e44afcc3f0a4290718c81f3f3c2cea0bc47d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Allow custom site URL for self hosting

### Patch Changes

- [#192](https://github.com/lagonapp/lagon/pull/192) [`bfa85c7`](https://github.com/lagonapp/lagon/commit/bfa85c7dbbdd3a94cb75f53ac16f5be0efd9c1b2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Correctly install the binary before executing it

* [#185](https://github.com/lagonapp/lagon/pull/185) [`d40f143`](https://github.com/lagonapp/lagon/commit/d40f143aa8836a3867f7a501bcd76322889c4a2b) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Beautify errors

- [#193](https://github.com/lagonapp/lagon/pull/193) [`b9f2623`](https://github.com/lagonapp/lagon/commit/b9f26230ca1412e59bb27c8941566cdb864f495e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add live-reload to dev server

* [#192](https://github.com/lagonapp/lagon/pull/192) [`bfa85c7`](https://github.com/lagonapp/lagon/commit/bfa85c7dbbdd3a94cb75f53ac16f5be0efd9c1b2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix executable name on Windows

## 0.2.0

### Minor Changes

- [#159](https://github.com/lagonapp/lagon/pull/159) [`cbf1778`](https://github.com/lagonapp/lagon/commit/cbf1778d274ee90285d3119c0b971995b74f806a) Thanks [@G3root](https://github.com/G3root)! - Update clap to v4

### Patch Changes

- [#179](https://github.com/lagonapp/lagon/pull/179) [`d5d3759`](https://github.com/lagonapp/lagon/commit/d5d3759f87afc49786aeb62c0e0c7e04a20643de) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Using presigned URLs for file uploads

* [#179](https://github.com/lagonapp/lagon/pull/179) [`d5d3759`](https://github.com/lagonapp/lagon/commit/d5d3759f87afc49786aeb62c0e0c7e04a20643de) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix HTTPS requests error

## 0.1.3

### Patch Changes

- [#153](https://github.com/lagonapp/lagon/pull/153) [`f2a70de`](https://github.com/lagonapp/lagon/commit/f2a70ded31c126ea2630ec39738826b01f0ab6b3) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Show help when no subcommand provided

* [#160](https://github.com/lagonapp/lagon/pull/160) [`94c14ac`](https://github.com/lagonapp/lagon/commit/94c14ac522075079e0d271467f4445b38f9a2d47) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Correctly bundle assets

- [#155](https://github.com/lagonapp/lagon/pull/155) [`92e4710`](https://github.com/lagonapp/lagon/commit/92e471016ee8b23a608126e97ea73f330efa80cd) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Migrate tRPC v9 to v10

## 0.1.2

### Patch Changes

- [#150](https://github.com/lagonapp/lagon/pull/150) [`4b4a991`](https://github.com/lagonapp/lagon/commit/4b4a99135330a2d35689a7aed8feaeb5a6d162a8) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix binary name

## 0.1.1

### Patch Changes

- [#146](https://github.com/lagonapp/lagon/pull/146) [`e8175ef`](https://github.com/lagonapp/lagon/commit/e8175effa1e3ccaaa673e60bfba4fcb9376cc15d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Move from Node.js to Rust

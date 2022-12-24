# @lagon/dashboard

## 0.1.0

### Minor Changes

- [#395](https://github.com/lagonapp/lagon/pull/395) [`18aaee0`](https://github.com/lagonapp/lagon/commit/18aaee062886b768541f045c5f958024446f9018) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Redeploy the production deployment when a settings is updated

### Patch Changes

- [#376](https://github.com/lagonapp/lagon/pull/376) [`2575f90`](https://github.com/lagonapp/lagon/commit/2575f90f6998f235e7e3e85c1dc7a1f51d31259b) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix create function button and playground deployments

* [#390](https://github.com/lagonapp/lagon/pull/390) [`6c2f557`](https://github.com/lagonapp/lagon/commit/6c2f5577b1997f3b9c46fbfeb7cbedd93a1cb92e) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Implement limits

- [#394](https://github.com/lagonapp/lagon/pull/394) [`1c01e67`](https://github.com/lagonapp/lagon/commit/1c01e678ca4b8eea2037dbc4541fbbb1761a66b3) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add indexes to Prisma schema

* [#376](https://github.com/lagonapp/lagon/pull/376) [`2575f90`](https://github.com/lagonapp/lagon/commit/2575f90f6998f235e7e3e85c1dc7a1f51d31259b) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Updating a function will only update the given fields instead of all fields

- [#376](https://github.com/lagonapp/lagon/pull/376) [`2575f90`](https://github.com/lagonapp/lagon/commit/2575f90f6998f235e7e3e85c1dc7a1f51d31259b) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Don't allow creating/updating functions with a non-unique name

## 0.0.10

### Patch Changes

- [#351](https://github.com/lagonapp/lagon/pull/351) [`b23f359`](https://github.com/lagonapp/lagon/commit/b23f359f13fee4e6473d581843b36054fcc3673a) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Use query instead of queryLegacy for axiom

* [#371](https://github.com/lagonapp/lagon/pull/371) [`33f9698`](https://github.com/lagonapp/lagon/commit/33f96983d63109918675256e5e23a649c2483ed2) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix Axiom logs sorting by \_time instead of time

* Updated dependencies [[`baae7ce`](https://github.com/lagonapp/lagon/commit/baae7ce981b31f0d97946d435cb859a609b7dd20), [`951cbd1`](https://github.com/lagonapp/lagon/commit/951cbd1c9204dcb4d54581fa6eb29108f40b4255), [`1e0134d`](https://github.com/lagonapp/lagon/commit/1e0134d93808caaa5387905d0fb2bded64ed31e1), [`33f9698`](https://github.com/lagonapp/lagon/commit/33f96983d63109918675256e5e23a649c2483ed2)]:
  - @lagon/ui@0.2.0

## 0.0.9

### Patch Changes

- [#340](https://github.com/lagonapp/lagon/pull/340) [`75eac5d`](https://github.com/lagonapp/lagon/commit/75eac5d096a08d91334b8bc7fb345cd9a8de4ff4) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Allow promoting deployments for functions without a production deployment

* [#323](https://github.com/lagonapp/lagon/pull/323) [`dd3d74a`](https://github.com/lagonapp/lagon/commit/dd3d74af202840ec101f131fbf9916fef9e0a182) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Log tRPC errors to console + clean code

## 0.0.8

### Patch Changes

- [#295](https://github.com/lagonapp/lagon/pull/295) [`6e98d1b`](https://github.com/lagonapp/lagon/commit/6e98d1b435e46e85dc74c1161fc7c7041910c73d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add `startupTimeout` to functions that is higher than `timeout`

## 0.0.7

### Patch Changes

- [#241](https://github.com/lagonapp/lagon/pull/241) [`74b3fb6`](https://github.com/lagonapp/lagon/commit/74b3fb6797d2b25ece2bd953cadbfd74b7ba2691) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix typo for "Déploiement" in french

* [#238](https://github.com/lagonapp/lagon/pull/238) [`045977c`](https://github.com/lagonapp/lagon/commit/045977cb200281d68c9a834573ca43ff300f9f73) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add production/preview deployments

## 0.0.6

### Patch Changes

- [#184](https://github.com/lagonapp/lagon/pull/184) [`43d4df4`](https://github.com/lagonapp/lagon/commit/43d4df47191c9eeec58e91cb695082fd6b069713) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Fix deployments domain field that wasn't an array

## 0.0.5

### Patch Changes

- [#179](https://github.com/lagonapp/lagon/pull/179) [`d5d3759`](https://github.com/lagonapp/lagon/commit/d5d3759f87afc49786aeb62c0e0c7e04a20643de) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Using presigned URLs for file uploads

## 0.0.4

### Patch Changes

- [#155](https://github.com/lagonapp/lagon/pull/155) [`92e4710`](https://github.com/lagonapp/lagon/commit/92e471016ee8b23a608126e97ea73f330efa80cd) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Migrate tRPC v9 to v10

* [#156](https://github.com/lagonapp/lagon/pull/156) [`dcfdf5d`](https://github.com/lagonapp/lagon/commit/dcfdf5d591fb787a8d9c549345f8c8901593a455) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Add statistics

## 0.0.3

### Patch Changes

- [#146](https://github.com/lagonapp/lagon/pull/146) [`e8175ef`](https://github.com/lagonapp/lagon/commit/e8175effa1e3ccaaa673e60bfba4fcb9376cc15d) Thanks [@QuiiBz](https://github.com/QuiiBz)! - Move common & prisma packages to website

## 0.0.2

### Patch Changes

- Updated dependencies [[`9f2feef`](https://github.com/lagonapp/lagon/commit/9f2feef1d13a286e957f01521589e3e4ae1b8119)]:
  - @lagon/common@0.0.2

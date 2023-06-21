---
'@lagon/runtime-utils': patch
'@lagon/serverless': patch
---

Avoid allocating `String` where possible and use `&str` instead

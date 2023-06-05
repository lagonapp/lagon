---
'@lagon/js-runtime': patch
'@lagon/cli': patch
'@lagon/serverless': patch
---

Set content-length header to 0 when body is null and method POST or PUT in `fetch()`

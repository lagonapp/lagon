---
'@lagon/cli': minor
'@lagon/docs': minor
---

Improve functions configuration by saving parameters into a local config file.

When using `lagon dev`, `lagon build` or `lagon deploy`, you don't need anymore to specify the function's entrypoint and the public directory. These configuration are saved into a local `.lagon/config.json` file.

Note that `lagon dev` still allows to specify an entrypoint and public directory as before using arguments and options, making it easy to test locally.

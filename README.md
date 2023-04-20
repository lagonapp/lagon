<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/logo-white.png">
    <source media="(prefers-color-scheme: light)" srcset="./assets/logo-black.png">
    <img alt="Lagon logo" height="60px" src="./assets/logo-white.png">
  </picture>
  <p align="center">
    Deploy Serverless Functions at the Edge
    <br />
    <br />
    <a align="center" href="https://discord.lagon.dev" alt="Discord"><img src="https://img.shields.io/discord/996005154753093713" /></a>
    <a href="https://github.com/lagonapp/lagon/actions/workflows/wpt.yml" alt="web-platform-tests"><img src="https://wpt.lagon.dev" /></a>
  </p>
</p>

<hr />

![Dashboard](./assets/dashboard.png)

## About

Lagon is an open-source runtime and platform that allows developers to run TypeScript and JavaScript Serverless Functions close to users.

> **Note**: Lagon is in Alpha. Get access to Lagon Cloud via the [waitlist](https://tally.so/r/n9q1Rp)

Current status:

- Dev: In heavy development, features are being added and APIs have breaking changes
- **Alpha**: Missing features and bugs to fix, progressive access to Lagon Cloud ([waitlist](https://tally.so/r/n9q1Rp))
- ~Beta~: Stable APIs, last features are being added, Lagon Cloud available without a waitlist
- ~General Availability~: Cloud and self-hosted versions available for production usage

## Packages

- **[cli](./crates/cli)** CLI to manage Functions
- **[dashboard](./packages/dashboard)** Dashboard and API
- **[docs](./packages/docs)** Documentation website
- **[js-runtime](./packages/js-runtime)** JavaScript code for the Runtime, containing the Web APIs
- **[runtime](./crates/runtime)** Rust JavaScript Runtime, using V8 Isolates
- **[serverless](./crates/serverless)** HTTP entrypoint for Functions, using the Runtime and exporting metrics
- **[ui](./packages/ui)** Design system
- **[wpt-runner](./crates/wpt-runner)** Run web-platform-tests on Lagon
- **[www](./www)** Public website

## Features

- JavaScript Runtime written in Rust using V8 Isolates
- Native Web APIs like `Request`, `Response`...
- 100% open-source
- Deploy APIs, SSR(ed) websites, Webhooks endpoints, Cron jobs...
- CLI to manage Functions and develop locally
- Deploy at the Edge using the Cloud version, or self-host it

## Roadmap

The roadmap is accessible to anyone on GitHub. Feel free to open an issue to discuss new features that you would like to see implemented.

[See the roadmap on GitHub](https://github.com/orgs/lagonapp/projects/1)

## Contributing

[See the contributing guide](https://docs.lagon.app/contributing)

## How it works

Lagon uses V8 Isolates, which are sandboxed environments used to run plain JavaScript. That means each Function's memory is isolated from each others, and you can run a lot of them at the same time with very few resources. [Node.js](https://nodejs.org/), [Electron](https://www.electronjs.org/), [Deno](https://deno.land/) (and [Deno Deploy](https://deno.com/deploy)), [Cloudflare Workers](https://workers.cloudflare.com/) are also using V8 Isolates to execute JavaScript.

Starting an Isolate is a lot faster than starting a whole Node.js process, which allows for almost free cold starts.

## License

[GNU AGPLv3](./LICENSE)

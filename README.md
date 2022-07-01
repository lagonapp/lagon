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
    <a align="center" href="https://lagon.app">
      lagon.app
    </a>
    <br />
    <br />
    Open Source • TypeScript • Web APIs
    <br />
    Cron triggers • Instant deployments
    <br />
    Interactive playground
  </p>
</p>

<hr />

![Dashboard](./assets/dashboard.png)

## About

Lagon is a free Open Source Runtime and SaaS that make it easy to deploy TypeScript and JavaScript Serverless Functions at the Edge, using V8 Isolates. You will be able to self-host it.

> **Warning**: Lagon is still in heavy development. Do not use for production usages.

Current status:
- **Dev**
- *Alpha*
- *Beta*
- *General Availability*

## Packages

- **[runtime](./packages/runtime)** Runtime used to run functions inside V8 Isolates
- **[serverless](./packages/serverless)** Entrypoint for all functions, using the runtime and exporting metrics
- **[website](./packages/website)** Dashboard and API
- **[cli](./packages/cli)** CLI to deploy functions
- **[types](./packages/types)** Types of the runtime used when creating functions
- **[www](./www)** Public website

## Planned features

- JavaScript Runtime based on V8 Isolates with Web APIs
- Deploy APIs, SSR(ed) websites, Webhooks endpoints, Cron jobs...
- CLI to deploy/remove functions and run them locally
- Playground in the website
- Deploy at the Edge using the SaaS, or self-host it

## Roadmap

Lagon is a fairly recent project. It is still in heavy development, so expect breaking changes and buggy features.

[See the roadmap on GitHub](https://github.com/orgs/lagonapp/projects/1)

## How it works

Lagon uses V8 Isolates, which are sandboxed environments used to run plain JavaScript. That means each Function memory is isolated from each other and from the host.

They start very quickly (faster than starting a Node.js process), and we can run multiple Isolates inside a single Node.js process.

Each Function is then deployed globally in 8 locations (expect more locations soon), close to users to reduce latency.

## License

[GNU AGPLv3](./LICENSE)
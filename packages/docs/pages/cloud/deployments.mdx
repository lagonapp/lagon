import { Callout } from 'nextra-theme-docs';

## Deploying a new Function

A Function is bound to Deployments: **Production** and **Preview** deployments. [Default and custom Domains](/cloud/domains) always points to the current production Deployment.

Your Function always has a single production Deployment and typically has multiple preview Deployments. Each Deployment is immutable, and always accessible via a unique URL.

### Using the CLI

You can deploy a new Function using the `lagon deploy` command:

```bash
lagon deploy your-file.ts
```

This will create a new Function and a new production Deployment. You can then deploy again this Function using the same command:

<Callout type="info">
  By default, `lagon deploy` will create a preview Deployment. You can use the `--prod` flag to automatically promote
  this new Deployment to production.
</Callout>

```bash
# Create a preview deployment
lagon deploy your-file.ts
# Create a production deployment
lagon deploy --prod your-file.ts
```

Follow the [`lagon deploy` documentation](/cli#lagon-deploy) to learn more.

### Using the GitHub Action

If you are using GitHub and want to automate your Deployments with [GitHub Actions](https://github.com/features/actions), you can use the [Lagon GitHub Action](https://github.com/lagonapp/github-action).

Follow the [Lagon GitHub Action documentation](https://github.com/lagonapp/github-action) to learn more.

### Using the Dashboard

You can also create Functions and Deployments through the [Dashboard](https://dash.lagon.app), using the Playground.

Head over to the [Dashboard](https://dash.lagon.app), and click on the "Create a Function" button. You will be redirected to the Playground, where you can see your new Function, with the code at the left and the deployed result at the right:

![Playground](/images/playground.png)

You can now edit the code in the Playground, and click on the "Deploy" button to create a new production Deployment.You will see the result of your changes at the right.

## Cold starts

When a Deployment is requested for the first time in a [region](/cloud/regions), Lagon will spin up a new V8 Isolate, triggering a cold start. This might take a few milliseconds, depending on the size of your Deployment.

On subsequent requests, the same Isolate will be reused, allowing for much faster response times. After 15 minutes without any requests, the Isolate is spun down, and the next request will trigger a new cold start.

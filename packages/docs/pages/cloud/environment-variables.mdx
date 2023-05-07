import { Callout } from 'nextra-theme-docs';

You can use Environment Variables to store configuration options, or sensitive information such as API keys, passwords, and tokens.

Environment variables are injected to [`process.env`](http://localhost:3000/runtime-apis#processenv) when your Function is executed. You can access them the same way you would access them in Node.js:

```typescript {2}
export function handler(request: Request): Response {
  if (request.headers.get('Authorization') !== process.env.AUTH_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  return new Response('Welcome!');
}
```

By default, it will only contain the `NODE_ENV` variable, which is set to `"production"` when deployed, and to `"development"` when using [`lagon dev`](/cli#lagon-dev).

## Development

During development, `.env` files are automatically detected and loaded. You can also manually specify the `--env` flag of the [`dev` command](http://localhost:3000/cli#lagon-dev) to use a custom path for your environment file.

## Adding environment variables

Head over to the settings tab of your Function, and scroll to the "Environment variables" section. Here, you can see all your Environment Variables, which are empty by default.

Enter a key and value, then click on "Add". You can keep adding Environment Variables until you're satisfied, and then click on "Submit" to save your changes.

You can also copy and paste an entire `.env` file, which will be automatically parsed and added to your Environment Variables.

<Callout type="info">
  After submitting, your Function's current production Deployment will automatically be updated with the new environment
  variables: you don't need to manually trigger another Deployment!
</Callout>

![Environment Variables](/images/env-variables.png)

## Removing environment variables

To remove an Environment Variable, click on the "Remove" button next to it. Click on "Submit" to save your changes.

![Environment Variables List](/images/env-variables-list.png)

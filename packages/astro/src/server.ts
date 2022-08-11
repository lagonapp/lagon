import type { SSRManifest } from 'astro';
import { App } from 'astro/app';

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest, false);

  const handler = async (request: Request) => {
    const routeData = app.match(request, { matchNotFound: true });

    if (routeData) {
      Reflect.set(request, Symbol.for('astro.clientAddress'), request.headers.get('cf-connecting-ip'));
      return app.render(request, routeData);
    }

    return new Response(null, {
      status: 404,
      statusText: 'Not found',
    });
  };

  return { handler };
}

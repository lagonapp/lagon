import { Server } from 'SERVER';
import { manifest } from 'MANIFEST';

const server = new Server(manifest);
// eslint-disable-next-line no-undef
await server.init({ env: process.env });

export async function handler(request) {
  const response = await server.respond(request, {
    getClientAddress() {
      return request.headers.get('x-forwarded-for');
    },
  });

  response.headers.set('content-type', 'text/html');

  return response;
}

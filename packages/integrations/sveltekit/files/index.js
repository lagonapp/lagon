import { Server } from 'SERVER';
import { manifest } from 'MANIFEST';

const server = new Server(manifest);
await server.init({ env: process.env });

export async function handler(request) {
  return server.respond(request, {
    getClientAddress() {
      return request.headers.get('x-forwarded-for');
    },
  });
}

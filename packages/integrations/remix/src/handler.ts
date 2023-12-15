import { createRequestHandler as createRemixRequestHandler, ServerBuild } from '@remix-run/server-runtime';

export type RequestHandler = (request: Request) => Promise<Response>;

export function createRequestHandler({ build, mode }: { build: ServerBuild; mode?: string }): RequestHandler {
  const handleRequest = createRemixRequestHandler(build, mode);

  return async (request: Request) => {
    try {
      return handleRequest(request);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (process.env.NODE_ENV === 'development') {
        return new Response(e.message || e.toString(), {
          status: 500,
        });
      }

      return new Response('Internal Error', { status: 500 });
    }
  };
}

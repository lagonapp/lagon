import { renderPage } from 'vite-plugin-ssr/server';

export async function handler(request: Request) {
  try {
    const { httpResponse } = await renderPage({
      urlOriginal: request.url.toString(),
    });

    if (!httpResponse) throw new Error('No response');

    const { body, statusCode, contentType } = httpResponse;

    return new Response(body, { status: statusCode, headers: { 'Content-Type': contentType } });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

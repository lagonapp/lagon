import satori, { init } from 'satori/wasm';
import initYoga from 'yoga-wasm-web';
import yogaWasm from './node_modules/yoga-wasm-web/dist/yoga.wasm';

export async function handler(request: Request): Promise<Response> {
  const getYoga = initYoga(yogaWasm);
  const yoga = await getYoga;
  init(yoga);

  const robotoArrayBuffer = await fetch(
    'https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/roboto-webfont/Roboto-Regular-webfont.ttf',
  ).then(res => res.arrayBuffer());
  const svg = await satori(
    {
      type: 'div',
      props: {
        children: 'hello, world',
        style: { color: 'black' },
      },
    },
    {
      width: 600,
      height: 400,
      fonts: [
        {
          name: 'Roboto Regular',
          data: robotoArrayBuffer,
          weight: 400,
          style: 'normal',
        },
      ],
    },
  );

  return new Response(svg, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

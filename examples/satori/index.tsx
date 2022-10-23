import satori, { init } from 'satori/wasm';
import initYoga from 'yoga-wasm-web';
import yogaWasm from './node_modules/yoga-wasm-web/dist/yoga.wasm';
import React from 'react';

// "Dynamic text generated as image" Vercel example:
// https://vercel.com/docs/concepts/functions/edge-functions/og-image-examples#dynamic-text-generated-as-image
export async function handler(request: Request): Promise<Response> {
  const getYoga = initYoga(yogaWasm);
  const yoga = await getYoga;
  init(yoga);

  const robotoArrayBuffer = await fetch(
    'https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/roboto-webfont/Roboto-Regular-webfont.ttf',
  ).then(res => res.arrayBuffer());

  const { searchParams } = new URL(request.url);

  // ?title=<title>
  const hasTitle = searchParams.has('title');
  const title = hasTitle ? searchParams.get('title')?.slice(0, 100) : 'My default title';

  const svg = await satori(
    <div
      style={{
        backgroundColor: 'black',
        backgroundSize: '150px 150px',
        height: '100%',
        width: '100%',
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        flexWrap: 'nowrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          justifyItems: 'center',
        }}
      >
        <img
          alt="Vercel"
          height={200}
          src="data:image/svg+xml,%3Csvg width='116' height='100' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M57.5 0L115 100H0L57.5 0z' /%3E%3C/svg%3E"
          style={{ margin: '0 30px' }}
          width={232}
        />
      </div>
      <div
        style={{
          fontSize: 60,
          fontStyle: 'normal',
          letterSpacing: '-0.025em',
          color: 'white',
          marginTop: 30,
          padding: '0 120px',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
        }}
      >
        {title}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
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

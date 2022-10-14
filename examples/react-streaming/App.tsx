import React, { lazy, Suspense } from 'react';
import { hydrateRoot } from 'react-dom/client';
const Hello = lazy(() => import('./Hello'));

const App = () => {
  return (
    <>
      <h1>Hello World!</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Hello />
      </Suspense>
    </>
  );
};

if (typeof window !== 'undefined') {
  hydrateRoot(document.getElementById('root')!, <App />);
}

export const Wrapper = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="stylesheet" href="/main.css" />
      </head>
      <body>
        <div id="root">
          <App />
        </div>
        <script type="module" src="/App.js"></script>
      </body>
    </html>
  );
};

export default App;

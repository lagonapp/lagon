import React, { lazy, Suspense } from 'react';
const Hello = lazy(() => import('./Hello'));

const App = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="stylesheet" href="/main.css" />
      </head>
      <body>
        <div>
          <h1>Hello World!</h1>
          <Suspense fallback={<div>Loading...</div>}>
            <Hello />
          </Suspense>
        </div>
      </body>
    </html>
  );
};

export default App;

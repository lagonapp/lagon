import React, { Suspense } from 'react';
import { hydrateRoot } from 'react-dom/client';

const Stripe = () => {
  return <pre>Hello</pre>;
};

const App = () => {
  return (
    <div>
      <h1>Hello World!</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Stripe />
      </Suspense>
    </div>
  );
};

if (typeof window !== 'undefined') {
  hydrateRoot(document.getElementById('root')!, <App />);
}

export default App;

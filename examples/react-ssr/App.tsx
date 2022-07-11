import React, { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';

const App = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Hello World!</h1>
      <p>Count: {count}</p>
      <button type="button" onClick={() => setCount(count + 1)}>
        Increment
      </button>
      {new Array(1000).fill(0).map((_, i) => (
        <div key={i}>Hello World!</div>
      ))}
    </div>
  );
};

if (typeof window !== 'undefined') {
  hydrateRoot(document.getElementById('root')!, <App />);
}

export default App;

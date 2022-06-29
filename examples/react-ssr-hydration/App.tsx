import React, { useState } from 'react';
import { hydrate } from 'react-dom';

const App = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Hello World!</h1>
      <p>Count: {count}</p>
      <button type="button" onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

if (typeof window !== 'undefined') {
  hydrate(<App />, document.getElementById('root')!);
}

export default App;

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

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
  const root = createRoot(document.getElementById('root')!);
  root.render(<App />);
}

export default App;

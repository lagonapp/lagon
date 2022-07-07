import { useState } from 'preact/hooks';
import { h, render } from 'preact';
/** @jsx h */

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
  render(<App />, document.getElementById('root')!);
}

export default App;

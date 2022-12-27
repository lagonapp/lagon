import { Page } from 'rakkasjs';

const HomePage: Page = function HomePage() {
  return (
    <main>
      <h1>Hello world!</h1>
      <p>Welcome to the Rakkas demo page 💃</p>
      <p>
        Try editing the files in <code>src/routes</code> to get started or go to the{' '}
        <a href="https://rakkasjs.org" target="_blank" rel="noreferrer">
          website
        </a>
        .
      </p>
      <p>
        You may also check the little <a href="/todo">todo application</a> to learn about API endpoints and data
        fetching.
      </p>
    </main>
  );
};

export default HomePage;

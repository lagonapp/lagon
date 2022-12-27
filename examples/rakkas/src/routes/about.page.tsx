import { FC } from 'react';

const AboutPage: FC = () => (
  <main>
    <h1>About</h1>
    <p>
      <b>Rakkas</b> aims to be a{' '}
      <a href="https://reactjs.org" target="_blank" rel="noreferrer">
        React
      </a>{' '}
      framework powered by{' '}
      <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
        Vite
      </a>
      , with a developer experience inspired by{' '}
      <a href="https://nextjs.org" target="_blank" rel="noreferrer">
        Next.js
      </a>{' '}
      and{' '}
      <a href="https://kit.svelte.dev" target="_blank" rel="noreferrer">
        Svelte Kit
      </a>
      . Pages of a Rakkas web applications are rendered on the server-side and hydrated on the client side.
    </p>
  </main>
);

export default AboutPage;

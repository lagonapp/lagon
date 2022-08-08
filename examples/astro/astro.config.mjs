import { defineConfig } from 'astro/config';
import deno from '@astrojs/deno';
import lagon from '@lagon/astro';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: lagon(),
});

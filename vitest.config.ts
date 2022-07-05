import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    silent: true,
    threads: false,
  },
  plugins: [tsconfigPaths()],
});

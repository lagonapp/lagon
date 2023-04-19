import type { Config } from 'tailwindcss';

export default {
  content: ['./components/**/*.{js,ts,jsx,tsx}', './pages/**/*.{md,mdx}', './theme.config.tsx'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;

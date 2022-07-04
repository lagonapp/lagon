module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        fade: 'fade 0.15s ease',
        'fade-translate': 'fadeTranslate 0.15s ease',
      },
      keyframes: () => ({
        fade: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeTranslate: {
          '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(.96)' },
          '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        },
      }),
    },
  },
  plugins: [],
};

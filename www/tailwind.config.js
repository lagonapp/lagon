const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      ...colors,
      dark: '#050211',
      'dark-gray': '#110C1F',
      'grey': '#95A8C6',
      'blue-1': '#449AFF',
      'blue-2': '#0500FF',
      'blue-3': '#041F47',
      'green': '#44FFB0',
      'purple': '#A449FF',
    },
    extend: {
      animation: {
        fade: 'fade 1s ease-out',
        'fade-slow': 'fadeSlow 1.5s ease-out',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      keyframes: () => ({
        fade: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeSlow: {
          '0%': { opacity: 0 },
          '50%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      }),
      container: {
        screens: {
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
      }
      },
    },
  },
  plugins: [],
};

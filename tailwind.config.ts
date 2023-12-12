import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    colors: {
      charade: {
        50: '#f6f7f9',
        100: '#ecedf2',
        200: '#d4d7e3',
        300: '#aeb4cb',
        400: '#828bae',
        500: '#626d95',
        600: '#4e577b',
        700: '#404664',
        800: '#383d54',
        900: '#2a2d3d',
        950: '#212330',
      },

    },
    extend: {

    },
  },
  plugins: [],
} satisfies Config;

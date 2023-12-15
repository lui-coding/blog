import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bgc: 'var(--background-color)',
        'tc-primary': 'var(--color)',
      },
    },
  },
  plugins: [],
} satisfies Config;

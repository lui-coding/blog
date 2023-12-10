// vite does not support latest postcss-load-config https://github.com/vitejs/vite/pull/15235 
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

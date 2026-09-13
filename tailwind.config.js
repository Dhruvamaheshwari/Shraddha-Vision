/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './app.tsx', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light'],
    logs: false,
  },
};
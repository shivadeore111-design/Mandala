/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0F0F1A',
        surface: '#1A1A2E',
        accent: '#7F77DD',
        'accent-light': '#AFA9EC',
        primary: '#FF6B35',
        muted: '#8888AA',
      },
    },
  },
  plugins: [],
};

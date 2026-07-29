/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#050505',
        'canvas-dark': '#050505',
        surface: '#171717',
        'surface-dark': '#171717',
        'surface-soft': '#1A1A22',
        'surface-soft-dark': '#1A1A22',
        border: '#2A2A2A',
        'border-dark': '#2A2A2A',
        muted: '#1A1A22',
        'muted-dark': '#1A1A22',
        foreground: '#FFFFFF',
        'foreground-dark': '#FFFFFF',
        subtle: '#8A8A8A',
        'subtle-dark': '#8A8A8A',
        brand: '#C4B5FD',
        'brand-dark': '#C4B5FD',
        accent: '#22D3EE',
        'accent-dark': '#22D3EE',
        danger: '#F87171',
        'danger-dark': '#F87171',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#FAF8FF',
        'canvas-dark': '#10091F',
        surface: '#FFFFFF',
        'surface-dark': '#1A102E',
        'surface-soft': '#F1EAFF',
        'surface-soft-dark': '#251642',
        border: '#E7DFF5',
        'border-dark': '#2E2145',
        muted: '#EDE9FE',
        'muted-dark': '#3B2164',
        foreground: '#181124',
        'foreground-dark': '#FAF7FF',
        subtle: '#6B6475',
        'subtle-dark': '#B8A9D6',
        brand: '#7C3AED',
        'brand-dark': '#A78BFA',
        accent: '#06B6D4',
        'accent-dark': '#22D3EE',
        danger: '#DC2626',
        'danger-dark': '#F87171',
      },
    },
  },
  plugins: [],
};

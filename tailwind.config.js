/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#F1F5F9',
        'canvas-dark': '#0B1120',
        surface: '#FFFFFF',
        'surface-dark': '#151D2E',
        border: '#E2E8F0',
        'border-dark': '#1E293B',
        muted: '#EFF6FF',
        'muted-dark': '#1E3A5F',
        foreground: '#0F172A',
        'foreground-dark': '#F1F5F9',
        subtle: '#64748B',
        'subtle-dark': '#94A3B8',
        brand: '#2563EB',
        'brand-dark': '#3B82F6',
        danger: '#DC2626',
        'danger-dark': '#F87171',
      },
    },
  },
  plugins: [],
};

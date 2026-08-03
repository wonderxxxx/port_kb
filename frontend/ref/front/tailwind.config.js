/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maritime: {
          50: '#e6f0ff',
          100: '#b3d4ff',
          200: '#80b8ff',
          300: '#4d9cff',
          400: '#1a80ff',
          500: '#0066e6',
          600: '#004fb3',
          700: '#003980',
          800: '#00224d',
          900: '#000c1a',
        },
        warning: {
          blue: '#3b82f6',
          yellow: '#f59e0b',
          orange: '#f97316',
          red: '#ef4444',
        },
      },
      animation: {
        'pulse-warning': 'pulse-warning 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-warning': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

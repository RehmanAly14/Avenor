/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b1326',
        surface: '#131b2e',
        'surface-light': '#171f33',
        primary: '#d0bcff',
        'primary-dark': '#a078ff',
        secondary: '#0566d9',
        cyan: '#4cd7f6',
        success: '#22c55e',
        warning: '#facc15',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
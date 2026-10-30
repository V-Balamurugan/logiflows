/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0a192f',
          dark: '#0b132b',
          surface: '#111e38',
          card: '#16223f',
          border: '#203358',
          primary: '#2563eb',
          'primary-hover': '#1d4ed8',
          accent: '#0d9488',
          'accent-light': '#14b8a6',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

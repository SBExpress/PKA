/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1a2744',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
}

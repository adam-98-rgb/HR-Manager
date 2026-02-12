/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        header: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        }
      }
    },
  },
  plugins: [],
}

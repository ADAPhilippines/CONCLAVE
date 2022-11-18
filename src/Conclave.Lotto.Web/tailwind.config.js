/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{razor,cs}"],
  theme: {
    extend: {},
    screens: {
        '1xl': '1400px',
    }
  },
  plugins: [],
}

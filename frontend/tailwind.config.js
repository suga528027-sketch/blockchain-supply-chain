/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A8C5B",
        dark: "#0F2027",
        accent: "#F4A300",
      },
    },
  },
  plugins: [],
}
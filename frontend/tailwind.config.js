/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A8C5B",
        dark: "#0F2027",
        accent: "#F4A300",
        'app-bg': 'var(--bg-color)',
        'app-text': 'var(--text-color)',
        'app-text-secondary': 'var(--text-secondary)',
        'app-text-muted': 'var(--text-muted)',
        'app-card': 'var(--card-bg)',
        'app-border': 'var(--border-color)',
        'app-glow': 'var(--primary-glow)',
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: "#8200DB",
        primary: "#000000",
        secondary: "#ffffff",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        forge: {
          "primary": "#000000",
          "secondary": "#ffffff", 
          "accent": "#8200DB",
          "neutral": "#2a2e37",
          "base-100": "#ffffff",
          "base-200": "#f2f2f2",
          "base-300": "#e5e6e6",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
  },
} 
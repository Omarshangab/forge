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
          "base-100": "#ffffff",    // White backgrounds
          "base-200": "#f8fafc",    // Light gray backgrounds  
          "base-300": "#e2e8f0",    // Borders
          "base-content": "#000000", // BLACK text for titles
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
      {
        "forge-dark": {
          "primary": "#ffffff",
          "secondary": "#000000", 
          "accent": "#8200DB",
          "neutral": "#191D24",
          "base-100": "#0f172a",    // Dark slate backgrounds
          "base-200": "#1e293b",    // Darker slate backgrounds
          "base-300": "#334155",    // Dark borders
          "base-content": "#ffffff", // WHITE text for titles
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
  },
} 
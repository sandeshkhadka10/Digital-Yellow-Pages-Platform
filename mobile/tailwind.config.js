/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8eb6ff",
          400: "#598dff",
          500: "#3366ff",
          600: "#2148e6",
          700: "#1b39bf",
          800: "#1a339a",
          900: "#1b3079",
        },
        surface: {
          light: "#ffffff",
          DEFAULT: "#f8fafc",
          dark: "#0b1220",
        },
        ink: {
          light: "#0f172a",
          DEFAULT: "#1e293b",
          muted: "#64748b",
          dark: "#e2e8f0",
        },
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};

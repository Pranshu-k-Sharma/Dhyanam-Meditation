/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#02040d",
        aura: {
          bg: "#f8f2e7",
          bgSoft: "#d1bfa3",
          card: "#d1bfa3",
          gold: "#1c1208",
          goldDeep: "#0f0a05",
          text: "#1c1208",
          textSoft: "#0f0a05",
        },
      },
    },
  },
  plugins: [],
};

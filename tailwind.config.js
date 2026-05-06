/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        safe: "#00E676",
        warn: "#FFC107",
        danger: "#FF5252",
        bgDark: "#050816",
        cardDark: "#111827",
      },
    },
  },
  plugins: [],
};

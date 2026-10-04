/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Urbanist", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(350%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s ease-in-out infinite",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.12)",
      },
      colors: {
        background: "#F5F8FF",
        card: "#FFFFFF",
        primary: {
          DEFAULT: "#1F5EFF",
          hover: "#1649D6",
        },
        ink: "#0B1B4B",
        muted: "#5B6B8C",
        border: "#E2E8F4",
        success: "#16A34A",
        danger: "#DC2626",
      },
    },
  },
  plugins: [],
};

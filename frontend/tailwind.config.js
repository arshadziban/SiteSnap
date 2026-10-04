/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        card: "#FFFFFF",
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
        },
        ink: "#0F172A",
        muted: "#64748B",
        border: "#E2E8F0",
        success: "#16A34A",
        danger: "#DC2626",
      },
    },
  },
  plugins: [],
};

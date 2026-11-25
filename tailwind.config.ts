import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#174D36", emerald: "#0B352B", sage: "#8BAF91", gold: "#D9AD55",
        offwhite: "#F7F8F3", charcoal: "#242B27",
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"], display: ["var(--font-manrope)", "var(--font-inter)", "sans-serif"] },
      boxShadow: { card: "0 1px 2px rgba(11,53,43,.06), 0 4px 16px rgba(11,53,43,.05)" },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0d0c0c",
        "ink-soft": "#2a2a2a",
        muted: "#6e6e6e",
        "muted-soft": "#9b9b9b",
        bg: "#f4f4f4",
        surface: "#ffffff",
        "surface-sunk": "#fafafa",
        border: "#e5e5e5",
        "border-warm": "#ececec",
        forest: "#2e7d32",
        "forest-hover": "#256b29",
        "forest-soft": "#e8f1e9",
        gold: "#d4a843",
        "gold-soft": "#faf3e0",
        terracotta: "#c75d3f",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        md: "0 4px 8px -2px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        lg: "0 10px 20px -4px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.05)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
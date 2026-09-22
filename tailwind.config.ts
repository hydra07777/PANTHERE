import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        panthere: {
          gold: "#D4A843",
          green: "#2E7D32",
          dark: "#1A1A2E",
          light: "#F5F0E8",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

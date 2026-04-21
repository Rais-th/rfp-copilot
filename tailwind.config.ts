import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: "#0a0a0a",
        paper: "#fafaf9",
        subtle: "#6b6b6b",
        line: "#e5e5e5",
        accent: "#0a0a0a",
      },
      maxWidth: {
        prose: "64ch",
      },
    },
  },
  plugins: [],
} satisfies Config;

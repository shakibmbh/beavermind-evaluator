import type { Config } from "tailwindcss";

// Design tokens, chosen deliberately for a call-QC audit tool rather than
// a marketing page: cool paper background (not the common warm-cream AI
// default), a deep teal for structure, amber reserved ONLY for grade/score
// elements, and a muted red reserved ONLY for red flags -- so color itself
// carries rubric meaning instead of being decorative.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F7F4",
        ink: "#1C1E21",
        inkMuted: "#5B5D57",
        line: "#DEDDD6",
        teal: {
          DEFAULT: "#17494B",
          dark: "#0E2E2F",
          light: "#E7EFEE"
        },
        amber: {
          DEFAULT: "#C98A2C",
          light: "#FBF1E1"
        },
        flag: {
          DEFAULT: "#B4432F",
          light: "#FBEAE6"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;

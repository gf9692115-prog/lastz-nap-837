import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          950: "#060806",
          900: "#0A0D0A",
          850: "#0E120F",
          800: "#121712",
          700: "#1A211B",
        },
        acid: {
          DEFAULT: "#D7FF3F",
          300: "#E7FF8A",
          400: "#D7FF3F",
          500: "#B8E326",
        },
        signal: {
          cyan: "#5DE1FF",
          amber: "#FFC857",
          red: "#FF6B6B",
          rose: "#FF7BA9",
        },
      },
      fontFamily: {
        sans: [
          '"Inter"',
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "system-ui",
          "sans-serif",
        ],
        display: [
          '"Bahnschrift"',
          '"DIN Alternate"',
          '"Roboto Condensed"',
          '"Arial Narrow"',
          '"Noto Sans SC"',
          "sans-serif",
        ],
        mono: [
          '"Cascadia Code"',
          '"SFMono-Regular"',
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
      backgroundImage: {
        "fine-grid":
          "linear-gradient(rgba(215,255,63,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(215,255,63,0.045) 1px, transparent 1px)",
      },
      backgroundSize: {
        "fine-grid": "38px 38px",
      },
      boxShadow: {
        acid: "0 0 0 1px rgba(215,255,63,0.35), 0 18px 50px -24px rgba(215,255,63,0.35)",
        panel: "0 22px 70px -32px rgba(0,0,0,0.9)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "12%": { opacity: "0.7" },
          "88%": { opacity: "0.7" },
          "100%": { transform: "translateY(560%)", opacity: "0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.75)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        scan: "scan 5.5s linear infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "slide-up": "slide-up 0.35s ease-out both",
        shimmer: "shimmer 2.2s linear infinite",
        "spin-slow": "spin-slow 2.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

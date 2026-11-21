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
          950: "#0A0606",
          900: "#150E0D",
          850: "#1D1211",
          800: "#2A1715",
          700: "#33201D",
        },
        acid: {
          DEFAULT: "#F2A900",
          300: "#FFCF5C",
          400: "#F2A900",
          500: "#C98A00",
        },
        blood: {
          DEFAULT: "#C8102E",
          300: "#F04A5A",
          400: "#C8102E",
          500: "#8D0D1C",
          600: "#7C0A18",
        },
        line: {
          DEFAULT: "#33201D",
          strong: "#542622",
        },
        bone: "#ECE3D4",
        ash: "#A08D80",
        signal: {
          cyan: "#67C7E8",
          amber: "#FFC15A",
          red: "#FF5D6C",
          rose: "#E9879C",
        },
        zinc: {
          50: "#F8F2EB",
          100: "#F2E9DE",
          200: "#E8DACE",
          300: "#D8C7B8",
          400: "#BFA998",
          500: "#A08D80",
          600: "#806A5F",
          700: "#5D4941",
          800: "#3B2A25",
          900: "#231714",
          950: "#130C0A",
        },
      },
      fontFamily: {
        sans: [
          '"Segoe UI"',
          '"Inter"',
          '"Noto Sans SC"',
          '"PingFang SC"',
          "system-ui",
          "sans-serif",
        ],
        display: [
          '"Bahnschrift"',
          '"DIN Alternate"',
          '"Roboto Condensed"',
          '"Arial Narrow"',
          "sans-serif",
        ],
        decor: [
          '"Impact"',
          '"Haettenschweiler"',
          '"Arial Narrow Bold"',
          '"Bahnschrift SemiCondensed"',
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
          "linear-gradient(rgba(200,16,46,0.075) 1px, transparent 1px), linear-gradient(90deg, rgba(200,16,46,0.075) 1px, transparent 1px)",
      },
      backgroundSize: {
        "fine-grid": "38px 38px",
      },
      boxShadow: {
        acid: "0 0 0 1px rgba(242,169,0,0.3), 0 18px 50px -24px rgba(242,169,0,0.28)",
        blood: "0 0 0 1px rgba(200,16,46,0.35), 0 18px 50px -24px rgba(200,16,46,0.3)",
        panel: "0 22px 70px -32px rgba(0,0,0,0.95)",
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

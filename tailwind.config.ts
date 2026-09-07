import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#f4f4f5",
        hud: {
          bg: "#09090b",
          card: "#121215",
          "card-hover": "#18181c",
          border: "rgba(255, 255, 255, 0.08)",
          "border-bright": "rgba(255, 255, 255, 0.16)",
          accent: "#10b981", // emerald-500
          warning: "#f59e0b", // amber-500
          danger: "#f43f5e", // rose-500
          muted: "#71717a", // zinc-500
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      animation: {
        pulseGlow: "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

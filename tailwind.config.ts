import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wayve: {
          canvas: "#070d17",
          card: "#0b131e",
          surface: "#0f172a",
          panel: "#162032",
          border: "#1e293b",
          subtle: "#334155",
          muted: "#64748b",
          light: "#94a3b8",
          primary: "#10b981",
          accent: "#00e599",
          glow: "rgba(16, 185, 129, 0.35)",
        },
        traffic: {
          normal: "#10b981",
          moderate: "#f59e0b",
          heavy: "#ef4444",
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
      },
      boxShadow: {
        spatial: "0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.08)",
        glow: "0 0 20px rgba(16, 185, 129, 0.35)",
        "glow-sm": "0 0 10px rgba(16, 185, 129, 0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;

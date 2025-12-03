import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light theme
        light: {
          bg: "#F5F7FA",
          surface: "#FFFFFF",
          text: "#111827",
          textSecondary: "#6B7280",
          accent: "#3A78F2",
          success: "#27C081",
          error: "#FF6161",
          border: "#E6E9EE",
        },
        // Dark theme
        dark: {
          bg: "#0F1114",
          surface: "#14171A",
          text: "#ECEFF4",
          textSecondary: "#9AA3AF",
          accent: "#4C8BFF",
          success: "#2DE499",
          error: "#FF7070",
          border: "#1F2326",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        h1: ["22px", { lineHeight: "1.3", fontWeight: "600" }],
        h2: ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.4", fontWeight: "500" }],
        small: ["13px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.08)",
        "soft-lg": "0 4px 16px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;

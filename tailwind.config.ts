import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg:           { DEFAULT: "#f7f8fa", elevated: "#ffffff" },
        panel:        { DEFAULT: "#ffffff", hover: "#f0f2f5" },
        border:       "#e3e6eb",
        "border-strong": "#d1d5db",
        text:         "#1a1b26",
        "text-muted": "#525c6e",
        "text-dim":   "#8b95a5",
        accent:       "#2d8659",
        "accent-light": "#d1e8db",
        "accent-hover": "#246d48",
        warn:         "#b8730a",
        error:        "#c94040",
        ring:         "#3b6dd4",
        "code-bg":    "#131826",
        "code-text":  "#e6e9ef",
        violet:       { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065" },
        fuchsia:      { 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf" },
      },
      keyframes: {
        "chat-pop-in":      { "0%":   { opacity: "0", transform: "translateY(18px) scale(0.96)" }, "100%": { opacity: "1", transform: "translateY(0) scale(1)" } },
        "chat-msg-in":      { "0%":   { opacity: "0", transform: "translateY(6px)" },               "100%": { opacity: "1", transform: "translateY(0)" } },
        "chat-breathe":     { "0%,100%": { transform: "scale(1)" },                                 "50%":     { transform: "scale(1.04)" } },
      },
      animation: {
        "chat-pop-in":  "chat-pop-in 240ms cubic-bezier(0.16,1,0.3,1)",
        "chat-msg-in":  "chat-msg-in 220ms ease-out",
        "chat-breathe": "chat-breathe 2.4s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: { xs: ["11px", { lineHeight: "1.5" }] },
    },
  },
  plugins: [],
};
export default config;

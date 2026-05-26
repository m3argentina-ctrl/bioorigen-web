import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bio: {
          green: "#4A7C59",
          "green-dark": "#3A6147",
          "green-deep": "#2D5016",
          orange: "#E67E22",
          "orange-dark": "#CF6F1C",
          dark: "#2C3E50",
          beige: "#F5F0E8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 16px -8px rgba(44, 62, 80, 0.18)",
        "card-hover": "0 14px 30px -12px rgba(44, 62, 80, 0.30)",
      },
      animation: {
        "fade-in": "fadeIn 0.55s ease-out both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

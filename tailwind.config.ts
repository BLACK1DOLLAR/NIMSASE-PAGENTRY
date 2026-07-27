import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Black-tie palette: near-black ink base, warm gold accent, deep burgundy secondary.
        ink: {
          DEFAULT: "#0b0a0d",
          50: "#f5f4f6",
          100: "#e6e4e9",
          200: "#c9c5d1",
          300: "#a099ab",
          400: "#726a7f",
          500: "#4d4657",
          600: "#372f40",
          700: "#282230",
          800: "#191419",
          900: "#0b0a0d",
          950: "#050408",
        },
        gold: {
          DEFAULT: "#d4af37",
          50: "#fbf6e7",
          100: "#f5e9c3",
          200: "#ecd48b",
          300: "#e2bd5c",
          400: "#d4af37",
          500: "#bd9527",
          600: "#96731f",
          700: "#71561c",
          800: "#4c3a15",
          900: "#2c2209",
        },
        burgundy: {
          DEFAULT: "#5c0a24",
          50: "#fbeaef",
          100: "#f2c3d1",
          200: "#e08aa4",
          300: "#c34d70",
          400: "#98254a",
          500: "#5c0a24",
          600: "#4a081d",
          700: "#390616",
          800: "#27040f",
          900: "#170209",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "gold-line":
          "linear-gradient(90deg, transparent 0%, #d4af37 20%, #f5e9c3 50%, #d4af37 80%, transparent 100%)",
        "radial-glow":
          "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.16), transparent 60%)",
      },
      boxShadow: {
        frame: "0 20px 60px -20px rgba(0,0,0,0.65)",
        "gold-glow": "0 0 0 1px rgba(212,175,55,0.35), 0 18px 40px -18px rgba(212,175,55,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

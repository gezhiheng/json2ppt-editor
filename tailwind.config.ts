import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f3f0",
          200: "#d9d2c7",
          500: "#8b7f73",
          700: "#4f463f",
          900: "#1f1b16"
        },
        ember: {
          400: "#f25c54",
          500: "#e9463d",
          700: "#a72b25"
        },
        slateblue: {
          500: "#3d4db3"
        }
      },
      fontFamily: {
        display: ["Unbounded", "system-ui", "sans-serif"],
        body: ["Spline Sans", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 60px -40px rgba(0,0,0,0.35)",
        sharp: "0 12px 28px -12px rgba(0,0,0,0.45)"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        rise: "rise 0.6s ease-out both"
      }
    }
  },
  plugins: []
} satisfies Config;

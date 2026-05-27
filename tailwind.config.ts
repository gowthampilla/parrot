import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        surface: {
          DEFAULT: "#0F0F10",
          raised: "#151518",
        },
        accent: {
          purple: "#7C3AED", 
          indigo: "#4F46E5", 
          blue: "#3B82F6", 
        },
        border: "#151518",
        input: "#151518",
        ring: "#4F46E5",
        foreground: "#FAFAFA",
        muted: "#A1A1AA",
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"Inter"', '"Geist"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '24px',
        '3xl': '28px',
      },
      boxShadow: {
        'cinematic': '0 20px 40px -10px rgba(0,0,0,0.8)',
        'glow-purple': '0 0 30px -5px rgba(124, 58, 237, 0.15)',
        'glow-indigo': '0 0 30px -5px rgba(79, 70, 229, 0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config;
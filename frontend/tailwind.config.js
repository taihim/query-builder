/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
	  './index.html',
	  './src/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
	  container: {
		center: true,
		padding: "2rem",
		screens: {
		  "2xl": "1400px",
		},
	  },
	  extend: {
		colors: {
		  border: "hsl(214.3 31.8% 91.4%)",
		  input: "hsl(214.3 31.8% 91.4%)",
		  ring: "hsl(222.2 84% 4.9%)",
		  background: "hsl(0 0% 100%)",
		  foreground: "hsl(222.2 84% 4.9%)",
		  primary: {
			DEFAULT: "hsl(221.2 83.2% 53.3%)",
			foreground: "hsl(210 40% 98%)",
		  },
		  secondary: {
			DEFAULT: "hsl(210 40% 96.1%)",
			foreground: "hsl(222.2 47.4% 11.2%)",
		  },
		  muted: {
			DEFAULT: "hsl(210 40% 96.1%)",
			foreground: "hsl(215.4 16.3% 46.9%)",
		  },
		  accent: {
			DEFAULT: "hsl(210 40% 96.1%)",
			foreground: "hsl(222.2 47.4% 11.2%)",
		  },
		  destructive: {
			DEFAULT: "hsl(0 84.2% 60.2%)",
			foreground: "hsl(210 40% 98%)",
		  },
		  card: {
			DEFAULT: "hsl(0 0% 100%)",
			foreground: "hsl(222.2 84% 4.9%)",
		  },
		},
		borderRadius: {
		  lg: "var(--radius)",
		  md: "calc(var(--radius) - 2px)",
		  sm: "calc(var(--radius) - 4px)",
		},
		keyframes: {
		  "accordion-down": {
			from: { height: 0 },
			to: { height: "var(--radix-accordion-content-height)" },
		  },
		  "accordion-up": {
			from: { height: "var(--radix-accordion-content-height)" },
			to: { height: 0 },
		  },
		  "pulse-ring": {
			"0%": { transform: "scale(0.8)", opacity: "0" },
			"50%": { opacity: "0.5" },
			"100%": { transform: "scale(2)", opacity: "0" }
		  },
		  "wiggle": {
			"0%, 100%": { transform: "translateX(0) rotate(0)" },
			"25%": { transform: "translateX(-2px) rotate(-2deg)" },
			"75%": { transform: "translateX(2px) rotate(2deg)" }
		  },
		  "pulse-gentle": {
			"0%, 100%": { opacity: "1" },
			"50%": { opacity: "0.8" }
		  },
		  "wave": {
			"0%": { transform: "scale(1)", opacity: "0.8" },
			"50%": { transform: "scale(1.05)", opacity: "0.4" },
			"100%": { transform: "scale(1.1)", opacity: "0" },
		  },
		},
		animation: {
		  "accordion-down": "accordion-down 0.2s ease-out",
		  "accordion-up": "accordion-up 0.2s ease-out",
		  "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite",
		  "wiggle": "wiggle 1s ease-in-out infinite",
		  "pulse-gentle": "pulse-gentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
		  "wave": "wave 2s ease-out infinite",
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
  } 
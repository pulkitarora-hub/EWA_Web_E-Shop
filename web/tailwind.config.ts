import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fefaf3",
          100: "#fdf2e0",
          200: "#fbe4bf",
          300: "#f6ce8a",
          400: "#e8ab4c",
          500: "#d4922e",
          600: "#b87824",
          700: "#945d1e",
          800: "#7a4d1f",
          900: "#66401c",
        },
        sage: {
          50: "#f6f7f4",
          100: "#e9ece4",
          200: "#d4dac9",
          300: "#b5c0a5",
          400: "#96a682",
          500: "#7a8d65",
          600: "#60714e",
          700: "#4c5a3f",
          800: "#404a36",
          900: "#373f30",
        },
        lavender: {
          50: "#f8f7fc",
          100: "#f0edf8",
          200: "#e3ddf3",
          300: "#cec3e8",
          400: "#b3a0d9",
          500: "#9a7fc9",
          600: "#8666b6",
          700: "#72539f",
          800: "#604785",
          900: "#503c6d",
        },
        warm: {
          50: "#fdfcfb",
          100: "#faf6f2",
          200: "#f5ede4",
          300: "#eddecf",
          400: "#e2c8ae",
          500: "#d5af8e",
          600: "#c49572",
          700: "#b07c5d",
          800: "#926650",
          900: "#785544",
        },
        charcoal: {
          DEFAULT: "#2d2d2d",
          light: "#4a4a4a",
          lighter: "#6b6b6b",
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Nunito Sans"', "system-ui", "sans-serif"],
        heading: ['"Playfair Display"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

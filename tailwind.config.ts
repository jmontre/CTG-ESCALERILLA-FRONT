import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'ctg': {
          'green': '#8BC234',      // Verde pelota (principal)
          'dark': '#2D5016',       // Verde oscuro
          'forest': '#1e4620',     // Verde más oscuro para headers
          'light': '#d4e9b8',      // Verde claro para backgrounds
          'lime': '#9ed944',       // Verde lima para hover
        },
        'club': {
          'primary': '#1e5128',
          'secondary': '#4e9f3d',
          'accent': '#95d5b2',
          'dark': '#081c15',
          'bg': '#d8f3dc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(139, 194, 52, 0.1), 0 10px 20px -2px rgba(139, 194, 52, 0.05)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'hover': '0 8px 30px rgba(139, 194, 52, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;

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
        dark: {
          bg:      '#0a1608',
          surface: '#0f2211',
          card:    '#152b18',
          border:  '#1e4020',
          muted:   '#243d26',
        },
        ctg: {
          green:  '#8BC234',
          dark:   '#2D5016',
          forest: '#1e4620',
          light:  '#d4e9b8',
          lime:   '#9ed944',
          text:   '#F0F7E8',
        },
        club: {
          primary:   '#1e5128',
          secondary: '#4e9f3d',
          accent:    '#95d5b2',
          dark:      '#081c15',
          bg:        '#d8f3dc',
        },
      },
      fontFamily: {
        sans:    ['Manrope', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        soft:  '0 2px 15px -3px rgba(139,194,52,.1), 0 10px 20px -2px rgba(139,194,52,.05)',
        card:  '0 4px 20px rgba(0,0,0,.08)',
        hover: '0 8px 30px rgba(139,194,52,.2)',
      },
      animation: {
        'fade-in':    'fadeIn .4s ease-out',
        'slide-up':   'slideUp .35s ease-out',
        'scale-in':   'scaleIn .25s ease-out',
        'glow-pulse': 'glowPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(139,194,52,.2)' },
          '50%':      { boxShadow: '0 0 25px rgba(139,194,52,.4)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;

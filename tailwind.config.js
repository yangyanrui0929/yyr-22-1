/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'theater': {
          'dark': '#1A1210',
          'wood': '#3D2817',
          'wood-light': '#5C3A1E',
          'brass': '#B8860B',
          'brass-light': '#DAA520',
          'copper': '#B87333',
          'purple': '#6D5BD9',
          'electric': '#00D4FF',
          'charge-pos': '#FF4D4D',
          'charge-neg': '#4D79FF',
          'parchment': '#F5E6D3',
        }
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
        'body': ['"Noto Serif SC"', 'serif'],
      },
      boxShadow: {
        'glow-red': '0 0 20px rgba(255, 77, 77, 0.6)',
        'glow-blue': '0 0 20px rgba(77, 121, 255, 0.6)',
        'glow-gold': '0 0 15px rgba(218, 165, 32, 0.5)',
        'brass': 'inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spark': 'spark 0.6s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        spark: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(2)' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          light: '#006994',
          dark: '#001e36',
          surface: '#00b4d8',
          foam: '#90e0ef',
        }
      },
      fontFamily: {
        display: ['Comfortaa', 'cursive'],
        body: ['Quicksand', 'sans-serif'],
      },
      animation: {
        'bubble-rise': 'bubbleRise 4s ease-in infinite',
        'wave': 'wave 2s ease-in-out infinite',
        'swim': 'swim 1s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        bubbleRise: {
          '0%': { transform: 'translateY(100vh) scale(0.5)', opacity: '0' },
          '50%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-10vh) scale(1)', opacity: '0' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        swim: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(144, 224, 239, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(144, 224, 239, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}


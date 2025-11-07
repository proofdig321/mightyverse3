/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'mv-primary': '#1a0b2e',
        'mv-secondary': '#16213e', 
        'mv-accent': '#0f3460',
        'mv-highlight': '#533a7b',
        'mv-gold': '#e94560',
        'mv-copper': '#f38ba8',
      },
      animation: {
        'holographic-sweep': 'holographic-sweep 3s infinite',
        'holographic-sweep-reverse': 'holographic-sweep-reverse 4s infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.8s ease-out',
      },
      keyframes: {
        'holographic-sweep': {
          '0%': { left: '-100%' },
          '50%': { left: '100%' },
          '100%': { left: '-100%' },
        },
        'holographic-sweep-reverse': {
          '0%': { right: '-100%' },
          '50%': { right: '100%' },
          '100%': { right: '-100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
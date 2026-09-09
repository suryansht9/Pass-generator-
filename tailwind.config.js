/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#EF1D25',
          'red-dark': '#A80F15',
          'red-glow': 'rgba(239, 29, 37, 0.3)',
          black: '#080808',
          dark: '#111111',
          card: '#141416',
          border: '#22242B',
          muted: '#8E95A5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'red-gradient': 'linear-gradient(135deg, #EF1D25 0%, #B80D14 60%, #7A080D 100%)',
        'dark-gradient': 'linear-gradient(180deg, #111111 0%, #080808 100%)',
        'grid-pattern': 'linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

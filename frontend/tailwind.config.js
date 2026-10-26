/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx,mdx}',
    './src/components/**/*.{js,jsx,mdx}',
    './src/app/**/*.{js,jsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAF8',
        'mint-foam': '#E6F7F0',
        'mint-light': '#EDFDF6',
        forest: '#064E3B',
        'forest-dark': '#022C22',
        'forest-light': '#047857',
        saffron: '#F59E0B',
        'saffron-light': '#FEF3C7',
        'saffron-dark': '#D97706',
        lilac: '#EEF2FF',
        'lilac-dark': '#4338CA',
        periwinkle: '#E0E7FF',
        coral: '#FEE2E2',
        'coral-dark': '#B91C1C',
        'navy-border': '#0F2B20',
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
        grotesk: ['"Space Grotesk"', 'sans-serif'],
      },
      borderRadius: {
        bento: '24px',
        'bento-lg': '28px',
        'bento-sm': '16px',
      },
      boxShadow: {
        bento: '4px 4px 0px #0F2B20',
        'bento-sm': '2.5px 2.5px 0px #0F2B20',
        'bento-lg': '6px 6px 0px #0F2B20',
        'bento-hover': '2px 2px 0px #0F2B20',
        pop: '0 12px 32px -4px rgba(6, 78, 59, 0.12)',
        stamp: '2px 2px 0px rgba(6, 78, 59, 0.2)',
      },
    },
  },
  plugins: [],
};

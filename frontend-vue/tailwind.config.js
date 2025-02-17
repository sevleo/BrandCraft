/** @type {import('tailwindcss').Config} */
export default {
  mode: 'jit',
  content: ['./index.html', './src/**/*.{vue,js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      xsm: '500px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        'noto-sans': ['"Noto Sans"', 'sans-serif'],
      },
      transitionTimingFunction: {
        custom: 'cubic-bezier(0.65, 0.05, 0.36, 1)',
      },
      textColor: {
        white: '#ffffff',
        whiteDimmed: '#cccccc',
        green: '#22c55e',
        greenLight: '#a8f0c2',
      },
      backgroundColor: {
        globalBackground: '#141414',
        green: '#30A567',
        greenLight: '#34b26f',
        lightWhite: '#fbfbfb',
      },
      borderColor: {
        imgBorderHover: '#415471',
        imgBorder: '#2f3c51',
        layoutSoft: '#ececec',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        animation: {
          fadeInTop: 'fadeInTop 0.5s ease-in-out',
          fadeInBottom: 'fadeInBottom 3s ease-in-out',
          fadeOutBottom: 'fadeOutBottom 0.5s ease-in-out',
          fadeInRight: 'fadeInRight 0.5s ease-in-out',
          fadeOutRight: 'fadeOutRight 0.5s ease-in-out',
          fadeInLeft: 'fadeInLeft 0.5s ease-in-out',
          fadeOutLeft: 'fadeOutLeft 0.5s ease-in-out'
        },
        keyframes: {
          fadeInTop: {
            '0%': { opacity: '0', transform: 'translateY(-20px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          fadeInBottom: {
            '0%': { opacity: '1', transform: 'translateY(0)' },
            '100%': { opacity: '0', transform: 'translateY(-100px)' },
          },
          fadeOutBottom: {
            '0%': { opacity: '1', transform: 'translateY(0)' },
            '100%': { opacity: '0', transform: 'translateY(20px)' },
          },
          fadeInRight: {
            '0%': { opacity: '0', transform: 'translateX(200px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          fadeOutRight: {
            '0%': { opacity: '1', transform: 'translateX(0)' },
            '100%': { opacity: '0', transform: 'translateX(200px)' },
          },
          fadeInLeft: {
            '0%': { opacity: '0', transform: 'translateX(-200px)' },
            '100%': { opacity: '1', transform: 'translateX(0)' },
          },
          fadeOutLeft: {
            '0%': { opacity: '1', transform: 'translateX(0)' },
            '100%': { opacity: '0', transform: 'translateX(-200px)' },
          },
        },
      },
    },
    plugins: [],
  }
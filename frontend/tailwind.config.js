/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#A66666',
          hover: '#8E5252',
          light: '#F8F0F0',
          dark: '#292323',
          navy: '#1C516C',
          orange: '#FDA649',
          'orange-hover': '#f09635',
          ivory: '#F5F0DD',
          crimson: '#953638',
          'navy-dark': '#17212B',
          muted: '#66737D',
          white: '#FFFFFF',
          'navy-light': '#246587',
          'ivory-dark': '#E9E2C6',
        },
        neutral: {
          bg: '#F8F9FA',
          card: '#FFFFFF',
          dark: '#222222',
          muted: '#6B6B6B',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      screens: {
        'xs': '420px',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(28, 81, 108, 0.06)',
        'card': '0 4px 20px -2px rgba(28, 81, 108, 0.08)',
      }
    },
  },
  plugins: [],
}


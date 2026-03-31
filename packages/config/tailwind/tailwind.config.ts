import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0eef8',
          100: '#d9d4ee',
          200: '#b3a9dd',
          300: '#8d7ecc',
          400: '#6753bb',
          500: '#3C3489',
          600: '#342d78',
          700: '#2b2567',
          800: '#221e56',
          900: '#1a1645',
        },
        accent: {
          50: '#f2f0fa',
          100: '#ddd8f2',
          200: '#bbb1e5',
          300: '#998ad8',
          400: '#7763cb',
          500: '#534AB7',
          600: '#4840a0',
          700: '#3d3689',
          800: '#322c72',
          900: '#27225b',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

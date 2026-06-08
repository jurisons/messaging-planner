import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c0d2ff',
          500: '#4f6ef7',
          600: '#3b5bf5',
          700: '#2a47e0',
        },
      },
    },
  },
  plugins: [],
}

export default config

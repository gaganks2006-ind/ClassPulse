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
          50: '#F2F5F0',
          100: '#E1E8DC',
          200: '#BAC8B1', // Pale Jade / Mint
          300: '#A1B994',
          400: '#7B9669', // Jade Green
          500: '#647B54',
          600: '#404E3B', // Dark Forest Green / Olive
          700: '#333F2F',
          800: '#273024',
          900: '#1A2018',
          950: '#0F130E',
        },
        sage: '#6C8480', // Muted Sage / Slate Blue-Green
        pebble: '#E6E6E6', // Soft Off-White / Light Gray
      }
    },
  },
  plugins: [],
}

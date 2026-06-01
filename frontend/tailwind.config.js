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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc9fc',
          400: '#38aef9',
          500: '#0e93eb',
          600: '#0275ca',
          700: '#035da3',
          800: '#075087',
          900: '#0c436f',
          950: '#082b4a',
        }
      }
    },
  },
  plugins: [],
}

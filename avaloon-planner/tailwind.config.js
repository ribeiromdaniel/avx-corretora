/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidade Avaloon: laranja/preto, editorial disruptivo
        laranja: {
          DEFAULT: '#FF5A00',
          hover: '#E64F00',
          claro: '#FFF1E8',
          escuro: '#C24400',
        },
        carvao: {
          DEFAULT: '#111111',
          claro: '#1E1E1E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Archivo', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

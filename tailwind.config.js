/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta TopMEI - Verde Principal (Confiança e Credibilidade)
        primary: {
          50: '#e8f8f0',   // Verde muito claro (backgrounds suaves)
          100: '#d1f1e1',  // Verde claro (hover states)
          200: '#a3e3c3',  // Verde suave
          300: '#75d5a5',  // Verde médio-claro
          400: '#47c787',  // Verde médio
          500: '#00A859',  // Verde TopMEI (principal)
          600: '#008f4a',  // Verde escuro (hover botões)
          700: '#00763c',  // Verde mais escuro
          800: '#005d2e',  // Verde profundo
          900: '#004420',  // Verde muito escuro
        },
        // Azul Marinho (Profissionalismo e Seriedade)
        secondary: {
          50: '#eef3f8',   // Azul muito claro
          100: '#dde7f1',  // Azul claro
          200: '#bbcfe3',  // Azul suave
          300: '#99b7d5',  // Azul médio-claro
          400: '#779fc7',  // Azul médio
          500: '#1E3A5F',  // Azul Marinho TopMEI
          600: '#1a3352',  // Azul escuro
          700: '#152b45',  // Azul mais escuro
          800: '#112338',  // Azul profundo
          900: '#0c1b2b',  // Azul muito escuro
        },
        // Tons de Cinza Neutros (Elegância)
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Cores Semânticas
        success: {
          light: '#d1f1e1',
          DEFAULT: '#00A859',
          dark: '#008f4a',
        },
        warning: {
          light: '#fff3cd',
          DEFAULT: '#FFA500',
          dark: '#e69500',
        },
        danger: {
          light: '#f8d7da',
          DEFAULT: '#DC3545',
          dark: '#bd2130',
        },
        info: {
          light: '#d1ecf1',
          DEFAULT: '#17A2B8',
          dark: '#138496',
        },
      },
    },
  },
  plugins: [],
}

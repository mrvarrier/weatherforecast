/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#0F4C81',
          dark: '#3B82F6',
        },
        accent: '#F59E0B',
        danger: '#EF4444',
        success: '#10B981',
        background: {
          light: '#F8FAFC',
          dark: '#0B1120',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#131C2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};

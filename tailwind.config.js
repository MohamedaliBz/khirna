/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1F5D3A', dark: '#164429', light: '#2E7A4F', 50: '#EAF3EE', 100: '#D3E6DA' },
        olive: { DEFAULT: '#6B8E23', light: '#8DB33A', 50: '#F1F6E6' },
        wheat: { DEFAULT: '#D4A537', dark: '#B5871F', light: '#E9C66B', 50: '#FBF4E2' },
        cream: { DEFAULT: '#FAF7EF', dark: '#F1EBDB' },
        ink: { DEFAULT: '#1C2B22', soft: '#4A5A50', muted: '#7A887F' },
      },
      fontFamily: { sans: ['Cairo', 'system-ui', 'sans-serif'] },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      boxShadow: { card: '0 2px 12px rgba(28,43,34,0.06), 0 1px 3px rgba(28,43,34,0.05)' },
      keyframes: {
        pop: { '0%': { transform: 'scale(0.4)', opacity: '0' }, '70%': { transform: 'scale(1.1)', opacity: '1' }, '100%': { transform: 'scale(1)' } },
        fadeUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        confetti: { '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' }, '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' } },
      },
      animation: {
        pop: 'pop 0.6s ease-out both',
        fadeUp: 'fadeUp 0.4s ease-out both',
        confetti: 'confetti 2.8s linear forwards',
      },
    },
  },
  plugins: [],
};

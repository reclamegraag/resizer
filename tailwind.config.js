/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        'bg-1': '#121212',
        'bg-2': '#181818',
        surface: '#141414',
        border: '#262626',
        'border-soft': '#3A3A3A',
        muted: '#E5E5E5',
        subtle: '#C4C4C4',
        faint: '#A3A3A3',
        fg: '#FAFAFA',
        accent: '#84CC16',
        'accent-glow': 'rgba(132,204,22,0.15)',
        danger: '#F87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        hero: ['clamp(2.25rem, 8vw, 4.5rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-xl': ['clamp(1.75rem, 5vw, 3rem)', { lineHeight: '1', letterSpacing: '-0.015em' }],
        label: ['0.75rem', { letterSpacing: '0.08em', lineHeight: '1' }],
      },
      borderRadius: {
        card: '14px',
        panel: '20px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out-quart': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '60%': { opacity: '1', transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.2s linear infinite',
        'fade-up': 'fade-up 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 300ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      boxShadow: {
        'inner-hl': 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
        'card-hover': '0 12px 32px -12px rgba(0,0,0,0.8), inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
};

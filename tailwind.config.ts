import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm cream base
        cream: {
          50:  '#FDFAF4',
          100: '#FAF4E6',
          200: '#F5E8CC',
          300: '#EDD5A3',
        },
        // Rich terracotta accent
        terra: {
          400: '#E8845A',
          500: '#D4623A',
          600: '#B84E28',
          700: '#8C3A1C',
        },
        // Warm dark for text
        ink: {
          900: '#1A0F08',
          800: '#2D1E14',
          700: '#3F2D1F',
          500: '#6B4D38',
          400: '#8C6A52',
          300: '#B08C74',
          200: '#CEAD96',
          100: '#E8D5C4',
        },
        // Muted sage for success states
        sage: {
          400: '#7BAE8A',
          500: '#5A9068',
          600: '#407050',
        },
      },
      fontFamily: {
        display: ['Caveat', 'cursive'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 1.4s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'waveform': 'waveform 0.8s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        waveform: {
          from: { transform: 'scaleY(0.2)' },
          to: { transform: 'scaleY(1)' },
        },
      },
      backgroundImage: {
        'noise': "url('/noise.svg')",
        'warm-gradient': 'radial-gradient(ellipse at 30% 20%, #F5E8CC 0%, #FDFAF4 60%)',
      },
      boxShadow: {
        'warm': '0 4px 24px rgba(180, 100, 60, 0.12)',
        'warm-lg': '0 8px 40px rgba(180, 100, 60, 0.18)',
        'inner-warm': 'inset 0 2px 8px rgba(180, 100, 60, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

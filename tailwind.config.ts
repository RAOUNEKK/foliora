import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        'cinzel-decorative': ['Cinzel Decorative', 'Cinzel', 'serif'],
        garamond: ['EB Garamond', 'Georgia', 'serif'],
        lato: ['Lato', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#daa520',
          light: '#ffd700',
          dark: '#b8860b',
        },
        forest: {
          50: '#f0f7f0',
          100: '#dceedc',
          200: '#bbdebb',
          300: '#8ec78e',
          400: '#5daa5d',
          500: '#3d8c3d',
          600: '#2d6e2d',
          700: '#245724',
          800: '#1e451e',
          900: '#1a3a1a',
          950: '#0d1f0d',
        },
        wood: {
          100: '#f5e6d3',
          200: '#e8c99a',
          300: '#d4a96a',
          400: '#b8864a',
          500: '#9a6a32',
          600: '#7d5227',
          700: '#5e3d1e',
          800: '#3d2810',
          900: '#1e1408',
        },
        cream: {
          50: '#fdfdf8',
          100: '#faf8ef',
          200: '#f5f0db',
          300: '#ede5be',
          400: '#e2d499',
        },
        navy: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a5f',
          900: '#1e2d4a',
          950: '#0f172a',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gold-gradient': 'linear-gradient(135deg, #b8860b, #daa520, #ffd700, #daa520, #b8860b)',
        'forest-gradient': 'linear-gradient(135deg, #1a3a1a, #245724, #2d6e2d)',
        'enchanted-bg': 'linear-gradient(180deg, #0d1f0d 0%, #1a3a1a 50%, #1e2810 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        gold: '0 4px 20px rgba(218, 165, 32, 0.3)',
        'gold-lg': '0 8px 40px rgba(218, 165, 32, 0.4)',
        enchanted: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(218, 165, 32, 0.15)',
        book: '4px 4px 20px rgba(0, 0, 0, 0.4), -2px 0 8px rgba(0, 0, 0, 0.3)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'leaf-sway': {
          '0%, 100%': { transform: 'rotate(-5deg) scale(1)' },
          '50%': { transform: 'rotate(5deg) scale(1.02)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        float: 'float 4s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        sparkle: 'sparkle 2s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        'leaf-sway': 'leaf-sway 6s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'enchanted': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ink/paper/muted-light are CSS-variable-backed (see index.css's
        // :root / html.dark blocks) so the whole site's text/background
        // palette flips with the theme toggle, with zero per-component
        // dark: classes needed almost anywhere. The rgb(var(...) /
        // <alpha-value>) form is required for Tailwind's opacity
        // modifiers (bg-ink/10, text-ink/80, etc.) to keep working — a
        // plain var(--x) reference can't be given an alpha channel this
        // way.
        //
        // signal/coral/jade/brass stay literal on purpose: they're
        // accent colors (buttons, badges, links) that already read fine
        // on both a light and a dark surface, so there's no contrast
        // problem to solve by varying them, and keeping brand colors
        // fixed avoids them looking "off-brand" in dark mode.
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: '#2B2E38',
        },
        paper: {
          DEFAULT: 'rgb(var(--color-paper) / <alpha-value>)',
          dim: '#ECECE6',
        },
        // Primary interactive accent — CTAs, links, the price explorer.
        signal: { DEFAULT: '#22C55E', deep: '#15803D', soft: '#DCFCE7' },
        // Secondary accent — badges, small highlights, used sparingly.
        coral: { DEFAULT: '#3352FF', deep: '#1F37C7', soft: '#EBEEFF' },
        // Kept from the original palette for status/state colour (e.g. an
        // "active"/"completed" badge) — not a page-level accent anymore.
        jade: { DEFAULT: '#2F6F62', deep: '#1F4B41' },
        brass: '#B98A2E',
        muted: {
          light: 'rgb(var(--color-muted-light) / <alpha-value>)',
          // .dark stays literal: it was already the "lighter of the two
          // muted shades" used deliberately on permanently-dark surfaces
          // (the admin sidebar, AdminLogin) and as placeholder text on
          // white inputs — neither context should flip with the site
          // theme toggle.
          dark: '#9BA0A8',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        lg: '10px',
        '2xl': '18px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out 1s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'count-up': 'count-up 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'underline-grow': 'underline-grow 0.3s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'underline-grow': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      backgroundSize: {
        '300%': '300%',
      },
    },
  },
  plugins: [],
};

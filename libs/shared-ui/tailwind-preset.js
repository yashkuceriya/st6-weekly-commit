/**
 * Claude design language — Tailwind preset.
 *
 * Warm cream backgrounds, terracotta accent, generous whitespace, soft borders.
 * Distinctly NOT the corporate-blue 15Five aesthetic — the visual identity
 * is part of the product thesis: feel intelligent and human, not enterprise-cold.
 */
import flowbite from 'flowbite/plugin.js';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm neutral surface palette
        cream: {
          50: '#FBFAF6',
          100: '#F5F3EE',
          200: '#EDEAE0',
          300: '#E0DCCD',
          400: '#CFC9B5',
          500: '#B8B099',
          600: '#928A75',
          700: '#6E6856',
          800: '#4A4639',
          900: '#2A2820',
        },
        ink: {
          DEFAULT: '#1F1E1B',
          soft: '#3A3833',
          muted: '#5C5A52',
          subtle: '#8A8779',
        },
        // Claude accent — terracotta / warm orange
        claude: {
          50: '#FBF1EC',
          100: '#F6E0D5',
          200: '#EDC1AB',
          300: '#E29D7E',
          400: '#D97757', // primary
          500: '#C15F3C',
          600: '#A04A2C',
          700: '#7E3A23',
          800: '#5C2B1A',
          900: '#3A1B11',
        },
        accent: {
          DEFAULT: '#D97757',
          hover: '#C15F3C',
          subtle: '#FBF1EC',
        },
        success: {
          DEFAULT: '#5C8A4F',
          subtle: '#EAF1E5',
        },
        warning: {
          DEFAULT: '#C68A2E',
          subtle: '#F8EFD9',
        },
        danger: {
          DEFAULT: '#B5453A',
          subtle: '#F4E0DD',
        },
        border: {
          DEFAULT: '#E8E4D8',
          strong: '#D5CFBE',
          subtle: '#F0EDE3',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Söhne',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
        serif: ['Source Serif 4', 'Tiempos Headline', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Slightly larger defaults for breathing room
        xs: ['0.75rem', { lineHeight: '1.1rem' }],
        sm: ['0.875rem', { lineHeight: '1.35rem' }],
        base: ['1rem', { lineHeight: '1.6rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.85rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.35rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.6rem' }],
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.125rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(31, 30, 27, 0.04), 0 1px 3px 0 rgba(31, 30, 27, 0.06)',
        card: '0 1px 2px 0 rgba(31, 30, 27, 0.04), 0 4px 12px -2px rgba(31, 30, 27, 0.06)',
        lift: '0 4px 8px -2px rgba(31, 30, 27, 0.08), 0 12px 24px -4px rgba(31, 30, 27, 0.10)',
        'inner-soft': 'inset 0 1px 2px 0 rgba(31, 30, 27, 0.04)',
        focus: '0 0 0 3px rgba(217, 119, 87, 0.25)',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [forms({ strategy: 'class' }), typography, flowbite],
};

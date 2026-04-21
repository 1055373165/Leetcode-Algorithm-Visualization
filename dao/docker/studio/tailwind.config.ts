import type { Config } from 'tailwindcss';

/**
 * Studio 的设计 token 与 visualizer/src/theme/colors.ts 的 paper 色板同源，
 * 但用 Tailwind 友好的形式表达，方便快速写 UI。
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#F4EFE6',
          surface: '#EBE4D4',
          raised: '#FBF7EE',
          ink: '#2A2620',
          inkSoft: '#463F36',
          inkMuted: '#6B635A',
          inkFaint: '#A89E90',
          rule: '#D8CFBE',
          ruleStrong: '#BCB09B',
          running: '#5A7F3D',
          blocked: '#B14A36',
          accentWarm: '#C5572A',
          accentCool: '#3C6E71',
          highlight: '#E8B94A',
        },
        terminal: {
          bg: '#13161C',
          surface: '#1B1F28',
          raised: '#232834',
          text: '#D6D8E0',
        },
      },
      fontFamily: {
        serif: [
          'Source Serif Pro',
          'Source Serif 4',
          'Georgia',
          'Noto Serif SC',
          'serif',
        ],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'PingFang SC',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        paper: '0 1px 2px rgba(42, 38, 32, 0.08), 0 4px 12px rgba(42, 38, 32, 0.06)',
        paperDeep: '0 2px 4px rgba(42, 38, 32, 0.1), 0 8px 24px rgba(42, 38, 32, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#080808',
        charcoal: '#111111',
        surface: '#171717',
        gold: {
          DEFAULT: '#C9A64B',
          light: '#E6D3A0',
          border: '#3B321F',
          muted: 'rgba(201, 166, 75, 0.14)',
        },
        ivory: '#F1EEE7',
        stone: '#AAA69C',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'Monaco', 'monospace'],
      },
      borderColor: {
        DEFAULT: '#3B321F',
      },
    },
  },
  plugins: [],
};

export default config;

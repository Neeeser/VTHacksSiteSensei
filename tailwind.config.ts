import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        'primary': '#3490dc',
        'secondary': '#gfed4a',
        'danger': '#e3342f',
        'background': {
          light: '#f7fafc',
          dark: '#1a202c',
        },
        'text': {
          light: {
            primary: '#4a5568',
            secondary: '#718096',
          },
          dark: {
            primary: '#e2e8f0',
            secondary: '#a0aec0',
          },
        },
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
        'serif': ['Merriweather', 'ui-serif', 'Georgia'],
        'mono': ['Fira Code', 'ui-monospace', 'SFMono-Regular'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      
    },
  },
  plugins: [],
}

export default config
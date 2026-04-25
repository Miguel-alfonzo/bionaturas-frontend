import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FDFDFD',
        card: '#FFFFFF',
        'text-main': '#1F2937',
        'primary-green': '#0B5D34',
        'accent-orange': '#E97D14',
        'input-bg': '#F3F4F6',
      },
      boxShadow: {
        'premium-shadow': '0 10px 25px -5px rgba(11, 93, 52, 0.05)',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        title: ['var(--font-plus-jakarta-sans)'],
      },
    },
  },
  plugins: [],
};

export default config;
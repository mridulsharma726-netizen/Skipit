/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Official SkipIt Palette
        primary: {
          DEFAULT: '#2563EB', // Primary Blue
          hover: '#1D4ED8',
          light: '#60A5FA', // Accent Blue
          subtle: '#DBEAFE', // Light Blue
          navy: '#172554', // Deep Navy
        },
        bg: {
          main: '#F4F7FC',
          secondary: '#EEF3FA',
        },
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        functional: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
        glass: {
          subtle: 'rgba(255, 255, 255, 0.45)',
          surface: 'rgba(255, 255, 255, 0.58)',
          strong: 'rgba(255, 255, 255, 0.78)',
          card: 'rgba(255, 255, 255, 0.68)',
          border: 'rgba(255, 255, 255, 0.65)',
          borderSubtle: 'rgba(255, 255, 255, 0.35)',
        },
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.05)',
        'glass-md': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-lg': '0 12px 48px 0 rgba(31, 38, 135, 0.10)',
        'glass-glow': '0 0 25px 0 rgba(37, 99, 235, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

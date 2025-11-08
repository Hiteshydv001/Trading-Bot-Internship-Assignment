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
        primary: '#667eea',
        'primary-dark': '#5568d3',
        secondary: '#764ba2',
        success: '#10b981',
        'success-dark': '#059669',
        danger: '#ef4444',
        'danger-dark': '#dc2626',
        warning: '#f59e0b',
        'warning-dark': '#d97706',
      },
    },
  },
  plugins: [],
}

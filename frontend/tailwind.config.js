/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#070a13',
          card: '#0c1120',
          border: '#1b253b',
          cyan: '#00f0ff',
          blue: '#1e40af',
          amber: '#f59e0b',
          crimson: '#ef4444',
          emerald: '#10b981',
          purple: '#8b5cf6'
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 240, 255, 0.25)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}

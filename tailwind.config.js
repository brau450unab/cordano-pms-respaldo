/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151f32',
          950: '#0b1120',
        },
        slot: {
          available: '#10B981',
          occupied: '#64748B',
          reserved: '#F59E0B',
          subscriber: '#3B82F6',
          pmr: '#06B6D4',
          ev: '#8B5CF6',
          overstay: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'IBM Plex Mono', 'Geist Mono', 'monospace'],
      },
      boxShadow: {
        xs:      '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
        subtle:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        card:    '0 4px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        floating:'0 16px 48px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
        modal:   '0 24px 64px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08)',
      },
      height: {
        '13': '3.25rem',
      }
    }
  },
  plugins: [],
}

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
        toggl: {
          dark: '#2C1338',       /* Deep Aubergine / Nightshade */
          darker: '#1E0C25',     /* Darkest Plum */
          hover: '#412A4C',      /* Muted Aubergine hover */
          subtle: '#563560',     /* Soft aubergine surface */
          pink: '#E57CD8',       /* Toggl Orchid Pink */
          magenta: '#E2498A',    /* Toggl Vibrant Action Magenta */
          coral: '#FF9A76',      /* Warm Coral Accent */
          cream: '#FEF9F5',      /* Warm Paper / Porcelain Base */
          blush: '#FDF1EC',      /* Soft Peach Tint */
          surface: '#FFFFFF',    /* Crisp White Card */
          border: '#EDE4E2',     /* Soft Warm Border */
          'border-dark': '#412A4C', /* Dark Mode / Aubergine Border */
          text: '#2C1338',       /* High Contrast Plum Text */
          muted: '#65546C',      /* Secondary Plum Text */
          faint: '#8C7C92',      /* Tertiary Muted Text */
          amber: '#EAA023',      /* Toggl Amber Tag */
          mint: '#2B9E78',       /* Toggl Mint Tag */
          cyan: '#2DA8D8',       /* Toggl Cerulean Tag */
          purple: '#9E59C7',     /* Toggl Violet Tag */
        },
        slot: {
          available: '#2B9E78',
          occupied: '#65546C',
          reserved: '#EAA023',
          subscriber: '#2DA8D8',
          pmr: '#06B6D4',
          ev: '#9E59C7',
          overstay: '#E2498A',
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        haptik: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        public: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
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

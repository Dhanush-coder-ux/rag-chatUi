/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        system: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // VAATHI OS system colors
        'sys-cyan':    '#00E5FF',
        'sys-cyan-dim': '#0891B2',
        'sys-surface': '#0F172A',
        'sys-card':    '#111827',
        'sys-border':  '#1E293B',
        'sys-bg':      '#020617',
        'sys-success': '#22C55E',
        'sys-warning': '#F59E0B',
        'sys-danger':  '#EF4444',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'glow-cyan':    '0 0 20px -4px rgba(0,229,255,0.45)',
        'glow-cyan-lg': '0 0 40px -8px rgba(0,229,255,0.35)',
        'glow-cyan-xl': '0 0 60px -10px rgba(0,229,255,0.25)',
        'premium':      '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 0 3px rgba(0,0,0,0.02)',
        'premium-dark': '0 4px 24px -4px rgba(0, 0, 0, 0.7), 0 0 1px rgba(0,229,255,0.05)',
        'card-hover':   '0 0 25px rgba(0,229,255,0.25), 0 8px 32px rgba(0,0,0,0.4)',
        'input-glow':   '0 0 15px rgba(0,229,255,0.25), 0 0 0 1px rgba(0,229,255,0.15)',
        'header':       '0 1px 0 rgba(0,229,255,0.08), 0 4px 24px rgba(0,0,0,0.5)',
      },
      animation: {
        blink:          'blink 0.9s step-end infinite',
        shimmer:        'shimmer 1.4s ease infinite',
        'slide-up':     'slide-up 0.25s ease-out both',
        'pulse-cyan':   'pulse-cyan 2s ease-in-out infinite',
        'scan-line':    'scan-line 8s linear infinite',
        'float-orb':    'float-orb 12s ease-in-out infinite',
        'float-orb-2':  'float-orb-2 15s ease-in-out infinite',
        'status-ping':  'status-ping 2s ease-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-up':       'fade-up 0.5s ease-out both',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-cyan': {
          '0%, 100%': { boxShadow: '0 0 6px 2px rgba(0,229,255,0.6)', opacity: '1' },
          '50%':      { boxShadow: '0 0 12px 4px rgba(0,229,255,0.3)', opacity: '0.7' },
        },
        'scan-line': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'float-orb': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%':      { transform: 'translate(-20px, 15px) scale(0.95)' },
        },
        'float-orb-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(-40px, 25px) scale(1.08)' },
          '66%':      { transform: 'translate(20px, -30px) scale(0.92)' },
        },
        'status-ping': {
          '0%':       { transform: 'scale(1)', opacity: '1' },
          '75%, 100%':{ transform: 'scale(2.2)', opacity: '0' },
        },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          fg: 'var(--color-primary-fg)',
          muted: 'var(--color-primary-muted)',
        },
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',

        // Surfaces & text (theme-aware via CSS vars)
        app: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
        },
        muted: 'var(--color-text-muted)',
        subtle: 'var(--color-text-subtle)',
      },
      borderColor: {
        DEFAULT: 'var(--color-border)',
        strong: 'var(--color-border-strong)',
      },
      ringColor: {
        DEFAULT: 'var(--color-primary)',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.06)',
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 12px rgb(0 0 0 / 0.06)',
        elevated: '0 4px 12px rgb(0 0 0 / 0.08), 0 16px 40px rgb(0 0 0 / 0.12)',
        focus: '0 0 0 3px rgb(20 184 166 / 0.25)',
      },
      transitionProperty: {
        colors: 'background-color, border-color, color, fill, stroke',
      },
    },
  },
  plugins: [],
};

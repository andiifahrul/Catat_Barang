import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontSize: {
      'xs': '0.625rem',    // 10px
      'sm': '0.75rem',     // 12px
      'base': '0.875rem',  // 14px
      'lg': '1rem',        // 16px
      'xl': '1.125rem',    // 18px
      '2xl': '1.25rem',    // 20px
      '3xl': '1.5rem',     // 24px
      '4xl': '1.875rem',   // 30px
      '5xl': '2.25rem',    // 36px
      '6xl': '3rem',       // 48px
      '7xl': '3.75rem',    // 60px
      '8xl': '4.5rem',     // 72px
      '9xl': '6rem',       // 96px
    },
    extend: {},
  },
  plugins: [],
}
export default config

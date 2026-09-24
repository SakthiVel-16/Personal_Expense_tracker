export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { 
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Inter', 'system-ui', 'sans-serif']
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      animation: {
        'slide-in-bottom': 'slideInFromBottom 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-center': 'slideInFromCenter 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        slideInFromBottom: {
          'from': { transform: 'translateY(100%)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromCenter: {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
      },
    }
  },
  plugins: []
}
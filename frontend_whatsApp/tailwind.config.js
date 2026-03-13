/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wa-bg': '#efeae2',
        'wa-header': '#f0f2f5',
        'wa-green': '#00a884',
        'wa-msg-sent': '#dcf8c6',
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,css}"],
  theme: {
    extend: {
      // add a font
      fontFamily: {
        vag: ['"VAG Rounded"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


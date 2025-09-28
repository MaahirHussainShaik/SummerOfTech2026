
import type { Config } from "tailwindcss"
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#00C853", // One NZ-ish green vibe for accents
          dark: "#001219"
        }
      }
    }
  },
  plugins: []
}
export default config

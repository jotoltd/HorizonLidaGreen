/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand palette: dark forest green + sage, mapped to the old
        // navy scale so existing components adopt the new colours automatically.
        navy: {
          50: "#f7faf5",
          100: "#eef4ea",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#1f3d2e",
          800: "#244028",
          900: "#1f3522",
        },
        // Accent blue used for route/location links in the brief.
        accent: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#7892b8",
          500: "#486581",
          600: "#334e68",
          700: "#243b53",
          800: "#1e3a5f",
          900: "#0a1f33",
        },
        // Bring back an explicit green scale for direct use.
        green: {
          50: "#f4f8f2",
          100: "#e4efe6",
          200: "#c9dec9",
          300: "#a3c6a3",
          400: "#76a078",
          500: "#4a7c4e",
          600: "#35633a",
          700: "#2a4f2f",
          800: "#244028",
          900: "#1f3522",
        },
        // Remap the old teal scale to the new green palette so existing
        // link/active-step classes inherit the correct colour.
        teal: {
          50: "#f4f8f2",
          100: "#e4efe6",
          200: "#c9dec9",
          300: "#a3c6a3",
          400: "#76a078",
          500: "#4a7c4e",
          600: "#35633a",
          700: "#2a4f2f",
          800: "#244028",
          900: "#1f3522",
        },
        sage: {
          50: "#f7faf5",
          100: "#eef4ea",
          200: "#dce8d6",
          300: "#bed3b5",
          400: "#9ab58f",
          500: "#779a6b",
          600: "#5c7c51",
          700: "#486340",
          800: "#3b4f35",
          900: "#31422d",
        },
        charcoal: "#1f3d2e",
        stone: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
}

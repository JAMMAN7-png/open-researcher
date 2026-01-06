import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 Configuration
 *
 * In Tailwind v4, most theme configuration is done via CSS using @theme inline.
 * This config file is minimal and primarily used for content paths.
 *
 * Theme configuration (colors, animations, etc.) is defined in:
 * - app/globals.css using @theme inline
 *
 * Benefits of CSS-based configuration:
 * - Hot module replacement for theme changes
 * - Better IDE support with CSS variables
 * - Simpler configuration file
 * - Automatic dark mode via prefers-color-scheme
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Dark mode is handled via CSS in globals.css using:
  // 1. .dark class for manual toggle
  // 2. @media (prefers-color-scheme: dark) for automatic detection
  darkMode: "class",
};

export default config;

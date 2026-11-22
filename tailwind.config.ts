import type { Config } from "tailwindcss";

/**
 * Design tokens from design.md §22. The default palette, radii and shadows are
 * replaced (not extended) so stock Tailwind greys and blues can't creep in.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "640px", md: "900px", lg: "1320px" },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      bg: "var(--bg)",
      card: "var(--card)",
      surface: "var(--surface)",
      "surface-2": "var(--surface-2)",
      line: "var(--line)",
      ink: "var(--ink)",
      "ink-2": "var(--ink-2)",
      muted: "var(--muted)",
      faint: "var(--faint)",
      accent: {
        50: "var(--accent-50)",
        100: "var(--accent-100)",
        200: "var(--accent-200)",
        500: "var(--accent-500)",
        600: "var(--accent-600)",
        700: "var(--accent-700)",
        900: "var(--accent-900)",
      },
      success: { DEFAULT: "var(--success)", text: "var(--success-text)", tint: "var(--success-tint)" },
      warning: { DEFAULT: "var(--warning)", text: "var(--warning-text)", tint: "var(--warning-tint)" },
      danger: { DEFAULT: "var(--danger)", text: "var(--danger-text)", tint: "var(--danger-tint)" },
    },
    borderRadius: { none: "0", s: "12px", m: "20px", l: "28px", xl: "32px", full: "999px" },
    boxShadow: {
      flat: "var(--shadow-flat)",
      float: "var(--shadow-float)",
      lift: "var(--shadow-lift)",
      none: "none",
    },
    fontFamily: { sans: ["var(--font)"], mono: ["var(--mono)"] },
    fontWeight: { normal: "400", medium: "500", semibold: "600", extrabold: "800", black: "900" },
    fontSize: {
      h1: ["38px", { lineHeight: "1.08", letterSpacing: "-0.01em", fontWeight: "900" }],
      h2: ["27px", { lineHeight: "1.15", letterSpacing: "-0.005em", fontWeight: "900" }],
      h3: ["19px", { lineHeight: "1.25", fontWeight: "900" }],
      "body-l": ["19px", { lineHeight: "1.5" }],
      body: ["16px", { lineHeight: "1.5" }],
      "body-s": ["14px", { lineHeight: "1.45", fontWeight: "500" }],
      label: ["13px", { lineHeight: "1.2", fontWeight: "600" }],
      eyebrow: ["12px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "800" }],
      number: ["30px", { lineHeight: "1", letterSpacing: "-0.01em", fontWeight: "900" }],
      mono: ["12px", { lineHeight: "1.4", letterSpacing: "0.04em", fontWeight: "500" }],
      badge: ["11px", { lineHeight: "1.2", fontWeight: "800" }],
    },
    extend: {
      maxWidth: { app: "1320px", read: "720px" },
    },
  },
  plugins: [],
};

export default config;

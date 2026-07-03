export const colors = {
  background: {
    DEFAULT: "#0a0a0b",
    elevated: "#151517",
    overlay: "#1c1c1f",
  },
  foreground: {
    DEFAULT: "#fafafa",
    muted: "#a1a1aa",
    subtle: "#71717a",
  },
  border: {
    DEFAULT: "#27272a",
    hover: "#3f3f46",
  },
  accent: {
    DEFAULT: "#7c3aed",
    hover: "#6d28d9",
    foreground: "#ffffff",
  },
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
} as const;

export const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
} as const;

export const typography = {
  fontSans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  fontMono: "var(--font-geist-mono), ui-monospace, monospace",
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
  },
} as const;

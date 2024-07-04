import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  corePlugins: {
    backgroundOpacity: false,
    touchAction: false,
    scrollSnapType: false,
    gradientColorStops: false,
    fontVariantNumeric: false,
    ringOffsetWidth: false,
    ringOffsetColor: false,
    ringOpacity: false,
    boxShadowColor: false,
    blur: false,
    brightness: false,
    contrast: false,
    grayscale: false,
    hueRotate: false,
    invert: false,
    saturate: false,
    sepia: false,
    dropShadow: false,
    backdropBlur: false,
    backdropBrightness: false,
    backdropContrast: false,
    backdropGrayscale: false,
    backdropHueRotate: false,
    backdropInvert: false,
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
    container: false,
  },
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        //   border: "hsl(var(--aui-border))",
        input: "hsl(var(--aui-input))",
        ring: "hsl(var(--aui-ring))",
        background: "hsl(var(--aui-background))",
        foreground: "hsl(var(--aui-foreground))",
        primary: {
          DEFAULT: "hsl(var(--aui-primary))",
          foreground: "hsl(var(--aui-primary-foreground))",
        },
        //   secondary: {
        //     DEFAULT: "hsl(var(--aui-secondary))",
        //     foreground: "hsl(var(--aui-secondary-foreground))",
        //   },
        //   destructive: {
        //     DEFAULT: "hsl(var(--aui-destructive))",
        //     foreground: "hsl(var(--aui-destructive-foreground))",
        //   },
        muted: {
          DEFAULT: "hsl(var(--aui-muted))",
          foreground: "hsl(var(--aui-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--aui-accent))",
          foreground: "hsl(var(--aui-accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--aui-popover))",
          foreground: "hsl(var(--aui-popover-foreground))",
        },
        //   card: {
        //     DEFAULT: "hsl(var(--aui-card))",
        //     foreground: "hsl(var(--aui-card-foreground))",
        //   },
      },
      borderRadius: {
        lg: "var(--aui-radius)",
        md: "calc(var(--aui-radius) - 2px)",
        sm: "calc(var(--aui-radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;

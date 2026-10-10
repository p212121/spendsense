---
name: SpendSense Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3e4947'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#005e3f'
  on-tertiary: '#ffffff'
  tertiary-container: '#007952'
  on-tertiary-container: '#99ffcd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-currency:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-currency-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  metric-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.02em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-sm: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system embodies a modern, calm, and privacy-first ethos tailored for personal finance and budgeting. The system minimizes financial cognitive fatigue through high-daylight readability, structured whitespace, and strict visual hierarchy.

### Personality & Tone
- **Composed & Reassuring:** Financial health without stressful sensory overload; teal and emerald tones cultivate calm discipline.
- **Utilitarian Clarity:** Numbers and status thresholds take priority. Every accent color functions strictly as critical financial telemetry rather than decorative flair.
- **Private & Trustworthy:** Bank-grade precision with tactile, confident physical affordances designed for mobile handling.

### Visual Aesthetic
A crisp, modern fintech direction balancing tactile elevated cards with structural border definition. Interfaces use ultra-clean surfaces, rounded contours (16px standard radii), soft ambient diffusion, and strict 48px ergonomic touch envelopes.

## Colors

The palette relies on deliberate status signaling and category identification over a pristine, low-strain neutral canvas.

### Core Canvas & Structure
- **App Canvas:** `#F8FAFC` (Slate 50) delivers clean daylight visibility without harsh pure-white glare.
- **Card Surface:** `#FFFFFF` (Pure White) elevated against the canvas.
- **Border / Divider:** `#E2E8F0` (Slate 200) for crisp, low-contrast structural outlines.
- **Text Primary:** `#0F172A` (Slate 900) for high-contrast legible balances and primary labels.
- **Text Secondary:** `#475569` (Slate 600) for supporting metadata and descriptions.
- **Text Muted:** `#94A3B8` (Slate 400) for timestamps and placeholder inputs.

### Brand & Financial State
- **Primary Teal:** `#0F766E` (Deep Emerald/Teal 700) for primary actions, active navigation, and key state nodes.
- **Secondary Teal:** `#0D9488` (Teal 600) for interactive focus states, active segment indicators, and secondary highlights.

### Budget Telemetry & Thresholds
- **Safe Zone (< 80% used):** `#10B981` (Emerald 500) | Background container `#ECFDF5`
- **Warning Zone (80% – 99% used):** `#D97706` (Amber 600) / `#F59E0B` (Amber 500) | Background container `#FEF3C7`
- **Exceeded Zone (≥ 100% used):** `#DC2626` (Red 600) / `#EF4444` (Red 500) | Background container `#FEE2E2`

### Category Accents
- **Food & Dining:** `#F97316` (Warm Coral / Orange 500)
- **Transport:** `#0EA5E9` (Sky Blue 500)
- **Bills & Utilities:** `#8B5CF6` (Violet 500)
- **Shopping:** `#EC4899` (Rose 500)
- **Entertainment:** `#F59E0B` (Amber 500)

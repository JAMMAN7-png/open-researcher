# Visual Design System Documentation

## Open Researcher - Complete Visual Design Reference

This document provides a comprehensive overview of the visual design system implemented in the Open Researcher application, covering color palettes, typography, component patterns, animations, and dark/light mode implementation.

---

## Table of Contents

1. [Color Palette and Theming](#1-color-palette-and-theming)
2. [Typography and Spacing](#2-typography-and-spacing)
3. [Component Visual Patterns](#3-component-visual-patterns)
4. [Animation and Transitions](#4-animation-and-transitions)
5. [Dark/Light Mode Implementation](#5-darklight-mode-implementation)
6. [Design System Coherence](#6-design-system-coherence)

---

## 1. Color Palette and Theming

### CSS Custom Properties (Design Tokens)

The design system uses HSL color values stored as CSS custom properties for maximum flexibility and theme switching capability.

#### Light Mode Palette

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `0 0% 100%` | Page background (white) |
| `--foreground` | `240 10% 3.9%` | Primary text color (near-black) |
| `--card` | `0 0% 100%` | Card backgrounds |
| `--card-foreground` | `240 10% 3.9%` | Card text |
| `--popover` | `0 0% 100%` | Popover/dropdown backgrounds |
| `--primary` | `240 5.9% 10%` | Primary actions/buttons |
| `--primary-foreground` | `0 0% 98%` | Text on primary elements |
| `--secondary` | `240 4.8% 95.9%` | Secondary backgrounds |
| `--secondary-foreground` | `240 5.9% 10%` | Secondary text |
| `--muted` | `240 4.8% 95.9%` | Muted/subtle backgrounds |
| `--muted-foreground` | `240 3.8% 46.1%` | Subdued text |
| `--accent` | `240 4.8% 95.9%` | Accent highlights |
| `--destructive` | `0 84.2% 60.2%` | Error/destructive actions |
| `--border` | `240 5.9% 90%` | Border colors |
| `--input` | `240 5.9% 90%` | Input field borders |
| `--ring` | `240 10% 3.9%` | Focus ring color |
| `--radius` | `0.5rem` | Base border radius |

#### Dark Mode Palette

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `240 10% 3.9%` | Page background (dark) |
| `--foreground` | `0 0% 98%` | Primary text (off-white) |
| `--card` | `240 10% 3.9%` | Card backgrounds |
| `--primary` | `0 0% 98%` | Primary actions (inverted) |
| `--primary-foreground` | `240 5.9% 10%` | Text on primary |
| `--secondary` | `240 3.7% 15.9%` | Secondary backgrounds |
| `--muted` | `240 3.7% 15.9%` | Muted backgrounds |
| `--muted-foreground` | `240 5% 64.9%` | Subdued text |
| `--destructive` | `0 62.8% 30.6%` | Destructive (darkened) |
| `--border` | `240 3.7% 15.9%` | Border colors |
| `--ring` | `240 4.9% 83.9%` | Focus ring |

#### Chart Colors

Predefined colors for data visualization:

**Light Mode:**
- `--chart-1`: `12 76% 61%` (warm orange)
- `--chart-2`: `173 58% 39%` (teal)
- `--chart-3`: `197 37% 24%` (dark blue)
- `--chart-4`: `43 74% 66%` (golden)
- `--chart-5`: `27 87% 67%` (peach)

**Dark Mode:**
- `--chart-1`: `220 70% 50%` (blue)
- `--chart-2`: `160 60% 45%` (green)
- `--chart-3`: `30 80% 55%` (orange)
- `--chart-4`: `280 65% 60%` (purple)
- `--chart-5`: `340 75% 55%` (pink)

### Brand Colors

The application uses **orange** as the primary brand accent:

```css
/* Brand Orange Spectrum */
orange-300: lighter orange for hover states
orange-400: focus rings in dark mode
orange-500: primary brand color (#fb923c)
orange-600: links and emphasis
orange-700: hover states for links
```

### Semantic Color Usage

| Context | Light Mode | Dark Mode |
|---------|------------|-----------|
| User message bubble | `bg-orange-500` | `bg-orange-500` |
| Assistant message | `bg-gray-100` | `bg-gray-800` |
| Search indicator | `text-blue-500` | `text-blue-500` |
| Scraping indicator | `text-orange-500` | `text-orange-500` |
| Success/Complete | `text-green-500` | `text-green-400` |
| Links | `text-orange-600` | `text-orange-400` |
| Visited links | `text-purple-700` | `text-purple-400` |

---

## 2. Typography and Spacing

### Font Families

The application uses the **Geist** font family from Vercel:

```typescript
// Primary sans-serif font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Monospace font for code
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

**Tailwind Configuration:**
```typescript
fontFamily: {
  sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
  mono: ["ui-monospace", "SFMono-Regular", "monospace"],
}
```

### Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Hero Title (Desktop) | `3.8rem` (lg:text-[3.8rem]) | `font-semibold` | `1.1` |
| Hero Title (Mobile) | `2.5rem` (text-[2.5rem]) | `font-semibold` | `1.1` |
| Dialog Title | `text-lg` (1.125rem) | `font-semibold` | `leading-none` |
| Card Title | `leading-none` | `font-semibold` | Default |
| Body Text | `text-base` (1rem) | `font-normal` | Default |
| Small Text | `text-sm` (0.875rem) | `font-normal` | Default |
| Labels/Captions | `text-xs` (0.75rem) | `font-medium` | Default |
| Button Text | `text-sm` | `font-medium` | Default |

### Spacing System

The design uses Tailwind's default spacing scale with specific patterns:

**Container Spacing:**
```typescript
container: {
  center: true,
  padding: "2rem",
  screens: {
    "2xl": "1400px",
  },
}
```

**Component Padding Patterns:**
- Cards: `py-6`, `px-6` (1.5rem)
- Buttons: `h-9 px-4` or `h-10 px-4 py-2` or `h-11 px-8`
- Inputs: `px-3 py-1` (h-9)
- Dialog Content: `p-6` (gap-4)
- Search Results: `px-6`, `py-4`

**Gap Patterns:**
- Card header grid: `gap-1.5`
- Dialog elements: `gap-2` to `gap-4`
- Message bubbles: `gap-2` to `gap-3`
- Icon groups: `gap-1` to `gap-2`

---

## 3. Component Visual Patterns

### Button Component

The button component uses `class-variance-authority` (CVA) for variant management:

**Base Styles:**
```typescript
"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
```

**Variants:**

| Variant | Visual Style |
|---------|--------------|
| `default` | Dark background, light text |
| `destructive` | Red background for dangerous actions |
| `outline` | Border only, transparent background |
| `secondary` | Muted background |
| `ghost` | No background until hover |
| `link` | Text only with underline on hover |
| `code` | Dark brown (#36322F), 3D inset shadow effect |
| `orange` | Orange-500 with shadow depth effect |

**Special Button Effects (code/orange variants):**
```css
/* 3D Press Effect */
[box-shadow:inset_0px_-2.108433723449707px_0px_0px_#171310,_0px_1.2048193216323853px_6.325301647186279px_0px_rgba(58,_33,_8,_58%)]
hover:translate-y-[1px] hover:scale-[0.98]
active:translate-y-[2px] active:scale-[0.97]
```

**Sizes:**
- `default`: h-10 px-4 py-2
- `sm`: h-9 rounded-md px-3
- `lg`: h-11 rounded-md px-8
- `icon`: h-10 w-10

### Card Component

```typescript
// Base card styles
"bg-card text-card-foreground flex flex-col rounded-xl border py-6 shadow-sm"

// Card sections
CardHeader: "grid auto-rows-min gap-1.5 px-6"
CardTitle: "leading-none font-semibold"
CardDescription: "text-muted-foreground text-sm"
CardContent: "px-6"
CardFooter: "flex items-center px-6"
```

### Input Component

```typescript
"flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none"

// Focus states
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-1"

// Error states
"aria-invalid:ring-destructive/20 aria-invalid:border-destructive"

// Dark mode
"dark:bg-input/30"
```

**Custom Search Input (pill style):**
```css
"h-12 rounded-full border border-zinc-200 bg-white pl-5 pr-14
focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2
dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-orange-400"
```

### Dialog Component

```typescript
// Overlay
"fixed inset-0 z-50 bg-black/50"

// Content
"bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg"

// Close button
"absolute top-4 right-4 rounded-xs opacity-70 hover:opacity-100"
```

### Tooltip Component

```typescript
"bg-primary text-primary-foreground z-50 rounded-md px-3 py-1.5 text-xs"
// With arrow
"fill-primary size-2.5 rotate-45 rounded-[2px]"
```

### Browser Window Simulation

The search results display mimics a browser window:

```typescript
// Browser chrome
"bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2"

// Traffic light buttons
"w-3 h-3 rounded-full bg-red-500"
"w-3 h-3 rounded-full bg-yellow-500"
"w-3 h-3 rounded-full bg-green-500"

// URL bar
"bg-white dark:bg-gray-700 rounded-md px-3 py-1"
```

### Message Bubbles

**User Message:**
```css
"max-w-[85%] lg:max-w-[80%] bg-orange-500 text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg shadow-sm text-sm"
```

**Assistant Message:**
```css
"bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg"
```

**Thinking Block:**
```css
"px-3 lg:px-4 py-2 lg:py-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
```

### Status Indicators

| Type | Visual |
|------|--------|
| Searching | Blue pulsing dot |
| Scraping | Orange pulsing dot |
| Thinking | Blue dot |
| Tool call (search) | Purple dot |
| Tool call (scrape) | Orange dot |
| Result received | Green dot |

---

## 4. Animation and Transitions

### Animation Timing Variables

```css
:root {
  /* Durations */
  --d-1: 150ms;
  --d-2: 300ms;
  --d-3: 500ms;
  --d-4: 700ms;
  --d-5: 1000ms;

  /* Delays */
  --t-1: 100ms;
  --t-2: 200ms;
  --t-3: 300ms;
  --t-4: 400ms;
  --t-5: 500ms;
}
```

### Custom Animations

#### Fade Up Animation
```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fade-up 500ms ease-out forwards; }
```

#### Fade In Animation
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in { animation: fade-in 500ms ease-out forwards; }
```

#### Slide In From Right
```css
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(100px); }
  to { opacity: 1; transform: translateX(0); }
}
.animate-slide-in-right { animation: slide-in-right 500ms ease-out forwards; }
```

#### Scale In Content
```css
@keyframes scale-in-content {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-scale-in-content { animation: scale-in-content 500ms ease-out forwards; }
```

#### Slide Up Animation
```css
@keyframes slide-up {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-up { animation: slide-up 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
```

### Scanner Effects

The application features unique scanner animations for page analysis visualization:

#### Vertical Scanner Line
```css
@keyframes scanner {
  0% { top: 0; }
  100% { top: 100%; }
}

.scanner-line {
  position: absolute;
  left: 0; right: 0;
  height: 3px;
  background: linear-gradient(to bottom, transparent, rgba(251, 146, 60, 0.8), transparent);
  box-shadow: 0 0 10px rgba(251, 146, 60, 0.8);
  animation: scanner 2s linear infinite;
}
```

#### Screenshot Scroll Animation
```css
@keyframes screenshot-scroll {
  0% { transform: translateY(0); }
  100% { transform: translateY(calc(-100% + 100vh)); }
}
.animate-screenshot-scroll { animation-duration: 40s; }
```

### Selection Pulse Animations

#### Orange Selection Pulse
```css
@keyframes selection-pulse {
  0%, 100% {
    border-color: rgba(251, 146, 60, 1);
    box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.4);
  }
  50% {
    border-color: rgba(251, 146, 60, 0.7);
    box-shadow: 0 0 0 8px rgba(251, 146, 60, 0);
  }
}
```

#### Green Selection Pulse
```css
@keyframes selection-pulse-green {
  0%, 100% {
    border-color: rgba(34, 197, 94, 1);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
    background-color: rgba(34, 197, 94, 0.05);
  }
  50% {
    border-color: rgba(34, 197, 94, 0.7);
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
    background-color: rgba(34, 197, 94, 0.1);
  }
}
```

### Button Press Animation
```css
@keyframes button-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.8); background-color: rgb(220 38 38); }
  100% { transform: scale(1); background-color: rgb(239 68 68); }
}
.animate-button-press {
  animation: button-press 0.3s ease-out;
  animation-delay: 1.5s;
}
```

### Grid Pulse Animation
```css
@keyframes grid-pulse {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.3; }
}
```

### Transition Utilities

```css
/* Number transitions (for counters) */
.number-transition {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Standard transitions used throughout */
transition-colors duration-200
transition-all duration-300
transition-all duration-500
transition-all duration-700 ease-out
transition-all duration-[1500ms] ease-out (cursor animation)
```

### Animated Cursor

A custom animated cursor component for UI interactions:

```typescript
// Orange cursor with click animation
<svg width="48" height="48" viewBox="0 0 24 24">
  <path
    d="M3 3L21 11.5L12.5 12.5L11.5 21L3 3Z"
    fill="#fb923c"
    stroke="white"
    strokeWidth="1.5"
  />
</svg>

// Click ripple effect
"w-16 h-16 rounded-full border-2 border-orange-400 animate-ping"
```

---

## 5. Dark/Light Mode Implementation

### Theme Toggle Mechanism

The application uses CSS class-based theming with the `.dark` class applied to the root element.

**CSS Implementation:**
```css
:root {
  /* Light mode variables */
}

.dark {
  /* Dark mode variable overrides */
}
```

### Component-Level Dark Mode Patterns

**Background Surfaces:**
```css
/* Light / Dark */
bg-white dark:bg-gray-900
bg-gray-50 dark:bg-gray-800
bg-gray-100 dark:bg-gray-800
```

**Text Colors:**
```css
text-gray-900 dark:text-white
text-gray-700 dark:text-gray-300
text-gray-600 dark:text-gray-400
text-gray-500 dark:text-gray-400
text-zinc-900 dark:text-zinc-100
```

**Borders:**
```css
border-gray-200 dark:border-gray-700
border-gray-300 dark:border-gray-600
border-zinc-200 dark:border-zinc-800
```

**Interactive States:**
```css
hover:bg-gray-100 dark:hover:bg-gray-800
hover:text-gray-700 dark:hover:text-gray-300
focus-visible:ring-orange-500 dark:focus-visible:ring-orange-400
```

### Scrollbar Theming

```css
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.dark .custom-scrollbar {
  scrollbar-color: #4b5563 #1f2937;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #1f2937;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4b5563;
}
```

### Brand Colors in Dark Mode

Orange brand colors maintain consistency but with adjusted hover states:

```css
/* Links */
text-orange-600 dark:text-orange-400
hover:text-orange-700 dark:hover:text-orange-300

/* Buttons */
dark:bg-orange-500 dark:hover:bg-orange-300 dark:text-white
```

---

## 6. Design System Coherence

### Border Radius System

```typescript
borderRadius: {
  lg: "var(--radius)",           // 0.5rem
  md: "calc(var(--radius) - 2px)", // 0.375rem
  sm: "calc(var(--radius) - 4px)", // 0.25rem
}

// Additional patterns
rounded-full    // Pills, circular buttons
rounded-lg      // Cards, dialogs
rounded-md      // Buttons, inputs
rounded-[10px]  // Special buttons (code, orange variants)
rounded-xl      // Cards
```

### Shadow System

| Level | Usage |
|-------|-------|
| `shadow-xs` | Input fields |
| `shadow-sm` | Cards, buttons |
| `shadow-md` | Hover states |
| `shadow-lg` | Dialogs, elevated cards |

### Focus States

All interactive elements use consistent focus indicators:

```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

### Disabled States

```css
disabled:pointer-events-none
disabled:cursor-not-allowed
disabled:opacity-50
```

### Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Base | 0 | Normal content |
| Overlay | 50 | Dialogs, tooltips, modals |
| Cursor | 50 | Animated cursor overlay |

### Grid Overlay Pattern

Used for scanning effect:

```css
background-image: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 40px,
  rgba(251, 146, 60, 0.03) 40px,
  rgba(251, 146, 60, 0.03) 41px
),
repeating-linear-gradient(
  90deg,
  transparent,
  transparent 40px,
  rgba(251, 146, 60, 0.03) 40px,
  rgba(251, 146, 60, 0.03) 41px
);
```

### Gradient Patterns

**Hero Title Gradient:**
```css
bg-gradient-to-tr from-red-600 to-yellow-500
```

**Event Card Alternating Backgrounds:**
```css
bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20
bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20
```

**Fade Gradients (screenshot scroll):**
```css
bg-gradient-to-b from-white dark:from-gray-900 to-transparent
bg-gradient-to-t from-white dark:from-gray-900 to-transparent
```

### Responsive Breakpoints

The application uses Tailwind's default breakpoints with mobile-first approach:

```typescript
// Container max-width
screens: {
  "2xl": "1400px",
}

// Common responsive patterns
"h-12 lg:h-12"                    // Same on all sizes
"max-w-[85%] lg:max-w-[80%]"     // Slightly wider on mobile
"p-2 lg:p-4"                      // Less padding on mobile
"gap-2 lg:gap-4"                  // Tighter gaps on mobile
"text-[2.5rem] lg:text-[3.8rem]" // Smaller hero on mobile
"h-[45vh] lg:h-full"             // Viewport-based on mobile
```

### Utility Classes

The design system includes custom utility classes:

```css
/* Hide scrollbar */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* Animation persistence */
[class*="animate-"] { animation-fill-mode: both; }
```

---

## Dependencies

The visual design system relies on:

- **Tailwind CSS v4** - Utility-first CSS framework
- **tailwindcss-animate** - Animation utilities
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Class deduplication
- **clsx** - Conditional class composition
- **@radix-ui/react-*** - Accessible component primitives
- **lucide-react** - Icon library

---

## File References

| File | Purpose |
|------|---------|
| `app/globals.css` | CSS custom properties, animations, utilities |
| `tailwind.config.ts` | Tailwind configuration, theme extension |
| `lib/utils.ts` | `cn()` utility for class merging |
| `components/ui/button.tsx` | Button variants and styles |
| `components/ui/card.tsx` | Card component family |
| `components/ui/dialog.tsx` | Modal/dialog components |
| `components/ui/input.tsx` | Input field component |
| `components/ui/tooltip.tsx` | Tooltip component |
| `components/thinking-chat.tsx` | Main chat interface styling |
| `components/search-results-display.tsx` | Browser simulation UI |
| `components/animated-cursor.tsx` | Custom cursor animation |
| `components/screenshot-preview.tsx` | Screenshot display with effects |
| `app/layout.tsx` | Font configuration |

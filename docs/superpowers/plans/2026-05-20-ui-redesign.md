# CTG Frontend UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the complete UI redesign from the HTML prototype (`/Documents/CTG/New ui ux/`) to the Next.js App Router frontend, replacing the current white/Inter design with the dark-green premium system.

**Architecture:** Each task builds on the previous one: foundation CSS → shared components → pages. The prototype uses class-based theming (`body.dark`) which we port via a `ThemeScript` injected into `<head>` to prevent flash of unstyled content. All component logic (handlers, API calls, state) stays untouched — only JSX structure and Tailwind classes change.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v3, next/font/google (Bricolage Grotesque + Manrope + JetBrains Mono)

**Prototype source:** `/Users/javiermontre/Documents/CTG/New ui ux/extracted/src/`

**Key design tokens from prototype:**
- `bg-[#0a1608]` — page background (dark)
- `bg-[#0f2211]` — card surface
- `bg-[#152b18]` — card elevated
- `bg-[#0d1e0b]` — header/nav bg
- `border-[#1e4020]` — borders
- `ctg-green: #8BC234` — sole accent
- `ctg-lime: #9ed944` — hover accent
- `ctg-text: #F0F7E8` — text (dark mode)
- Light mode bg: `#f4f7ee`

---

## File Map

| File | Action | Task |
|------|--------|------|
| `tailwind.config.ts` | Modify — add fonts, colors, animations | 1 |
| `app/globals.css` | Modify — add full CSS system from prototype | 1 |
| `app/layout.tsx` | Modify — swap fonts, add ThemeScript, tweak body | 1 |
| `components/Header.tsx` | Rewrite — flat nav + sub-nav + bottom tabs + bell | 2 |
| `components/Footer.tsx` | Rewrite — minimal dark, desktop-only | 2 |
| `components/Toast.tsx` | Rewrite — dark bg, border-left, dot icon | 2 |
| `hooks/useToast.ts` | Keep as-is (interface unchanged) | — |
| `app/page.tsx` | Rewrite — SVG court bg, hero, QuickChips | 3 |
| `components/Ladder.tsx` | Rewrite — CategoryBlock + PlayerCard desktop+mobile | 4 |
| `app/escalerilla/page.tsx` | Update — wire new Ladder, ChallengeZone, StatCards | 4 |
| `components/LoginModal.tsx` | Rewrite — LogoMark, dark bg, ModalShell | 5 |
| `components/PlayerModal.tsx` | Rewrite — category gradient header, dark stats | 5 |
| `components/ChallengeModal.tsx` | Rewrite — VS layout, rules box | 5 |
| `components/ResultModal.tsx` | Rewrite — table-based score input | 5 |
| `app/fixture/page.tsx` | Rewrite — segmented tabs, action banner, cards | 6 |
| `components/ChallengesList.tsx` | Rewrite — PendingCard, PlayCard, HistoryCard | 6 |
| `app/reservar/page.tsx` | Rewrite — StepIndicator, dark step panels | 7 |
| `app/fixture-publico/page.tsx` | Restyle — dark cards, filters | 8 |
| `app/fixture-reservas/page.tsx` | Restyle — day tabs, slot grid dark | 8 |
| `app/historial/page.tsx` | Restyle — dark table, stat cards | 8 |
| `app/mis-reservas/page.tsx` | Restyle — dark cards, action buttons | 8 |
| `app/perfil/page.tsx` | Restyle — dark form panels | 8 |
| `app/master/page.tsx` | Restyle — dark group tables, bracket | 8 |
| `components/NotificationsPanel.tsx` | Create new — bell dropdown panel | 9 |
| `app/admin/page.tsx` | Restyle — dark tabs, table, KPI cards | 10 |
| `app/admin-reservas/page.tsx` | Restyle — dark tabs, slot grid, stats | 10 |
| `components/admin/EditPlayerModal.tsx` | Restyle — dark drawer sections | 10 |
| `components/admin/ChallengeManagementModal.tsx` | Restyle — dark dispute layout | 10 |
| `components/admin/AddPlayerModal.tsx` | Restyle — dark form | 10 |
| `components/admin/EditUserModal.tsx` | Restyle — dark form | 10 |

---

## Task 1: Foundation — Tailwind + Fonts + CSS System

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

### 1.1 — Update tailwind.config.ts

Replace the entire file with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg:      '#0a1608',
          surface: '#0f2211',
          card:    '#152b18',
          border:  '#1e4020',
          muted:   '#243d26',
        },
        ctg: {
          green:  '#8BC234',
          dark:   '#2D5016',
          forest: '#1e4620',
          light:  '#d4e9b8',
          lime:   '#9ed944',
          text:   '#F0F7E8',
        },
        club: {
          primary:   '#1e5128',
          secondary: '#4e9f3d',
          accent:    '#95d5b2',
          dark:      '#081c15',
          bg:        '#d8f3dc',
        },
      },
      fontFamily: {
        sans:    ['Manrope', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        soft:  '0 2px 15px -3px rgba(139,194,52,.1), 0 10px 20px -2px rgba(139,194,52,.05)',
        card:  '0 4px 20px rgba(0,0,0,.08)',
        hover: '0 8px 30px rgba(139,194,52,.2)',
      },
      animation: {
        'fade-in':    'fadeIn .4s ease-out',
        'slide-up':   'slideUp .35s ease-out',
        'scale-in':   'scaleIn .25s ease-out',
        'glow-pulse': 'glowPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(139,194,52,.2)' },
          '50%':      { boxShadow: '0 0 25px rgba(139,194,52,.4)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

### 1.2 — Update app/layout.tsx

Replace fonts (Geist → Bricolage Grotesque + Manrope + JetBrains Mono) and add ThemeScript + body class update:

```tsx
import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Club de Tenis Graneros",
  description: "Plataforma oficial de escalerilla y reservas del Club de Tenis Graneros",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

// Prevents flash of unstyled content for dark mode
const themeScript = `
  (function(){
    try {
      var t = localStorage.getItem('ctg_theme');
      if (t === 'dark') document.documentElement.classList.add('dark-theme');
      document.body.classList.toggle('dark', t === 'dark');
    } catch(e){}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className={`${bricolage.variable} ${manrope.variable} ${jetbrainsMono.variable} antialiased`}
            style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
        <div className="flex flex-col min-h-screen">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
```

### 1.3 — Update app/globals.css

Replace with full CSS system ported from prototype's `<style>` block. Key sections:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Base */
html, body { background-color: #f4f7ee; }
body.dark, body.dark #root { background-color: #0a1608; }
body {
  color: #1a2410;
  font-family: 'Manrope', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
body.dark { background-color: #0a1608; color: #F0F7E8; }

/* Scrollbar hide utility */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { scrollbar-width: none; }

/* Grain texture overlay */
body::before {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  opacity: .35; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
body.dark::before {
  opacity: .22; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
body.no-grain::before { display: none; }
#root, main { position: relative; z-index: 1; }

/* Font utility */
.font-display { font-family: var(--font-display), 'Bricolage Grotesque', sans-serif; }
.font-mono { font-family: var(--font-mono), 'JetBrains Mono', monospace; }

/* ── Shared component classes ── */
.card {
  background: #ffffff;
  border: 1px solid #dde6cd;
  border-radius: 1rem;
}
.card-glow {
  background: #ffffff;
  border: 1px solid rgba(139,194,52,.35);
  border-radius: 1rem;
  box-shadow: 0 6px 30px rgba(34,80,16,.08), 0 0 20px rgba(139,194,52,.12);
}
body.dark .card      { background: #152b18; border-color: #1e4020; }
body.dark .card-glow { background: #152b18; border-color: rgba(139,194,52,.2); box-shadow: 0 0 24px rgba(139,194,52,.08); }

.btn-primary {
  background: #5d8b1f; color: #ffffff; font-weight: 700; border-radius: .75rem;
  padding: .65rem 1.1rem; transition: all .18s ease;
  box-shadow: 0 4px 14px rgba(93,139,31,.28), inset 0 1px 0 rgba(255,255,255,.15);
  display: inline-flex; align-items: center; gap: .5rem; justify-content: center;
  white-space: nowrap;
}
.btn-primary:hover { background: #4d7619; box-shadow: 0 6px 20px rgba(93,139,31,.4); }
.btn-primary:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }
body.dark .btn-primary { background: #8BC234; color: #0a1608; box-shadow: 0 0 18px rgba(139,194,52,.28); }
body.dark .btn-primary:hover { background: #9ed944; box-shadow: 0 0 26px rgba(139,194,52,.45); }

.btn-ghost {
  border: 1px solid rgba(93,139,31,.4); color: #5d8b1f; border-radius: .75rem;
  padding: .65rem 1.1rem; transition: all .18s ease; background: rgba(139,194,52,.04);
  display: inline-flex; align-items: center; gap: .5rem; justify-content: center; font-weight: 600;
  white-space: nowrap;
}
.btn-ghost:hover { background: rgba(139,194,52,.12); border-color: #5d8b1f; }
body.dark .btn-ghost { border-color: rgba(139,194,52,.5); color: #8BC234; background: transparent; }
body.dark .btn-ghost:hover { background: rgba(139,194,52,.08); border-color: #8BC234; }

.btn-danger {
  background: rgba(254,242,242,.7); border: 1px solid rgba(239,68,68,.35);
  color: #b91c1c; border-radius: .75rem; padding: .55rem .95rem;
  transition: all .18s ease; font-weight: 600;
  display: inline-flex; align-items: center; gap: .4rem; justify-content: center; white-space: nowrap;
}
.btn-danger:hover { background: rgba(254,202,202,.7); }
body.dark .btn-danger { background: rgba(127,29,29,.5); border-color: rgba(239,68,68,.3); color: #f87171; }
body.dark .btn-danger:hover { background: rgba(127,29,29,.7); }

.field {
  background: #ffffff; border: 1px solid #dde6cd; color: #1a2410;
  border-radius: .75rem; padding: .65rem 1rem; width: 100%;
  transition: all .18s ease; font-size: .95rem;
}
.field::placeholder { color: rgba(26,36,16,.4); }
.field:focus { outline: none; border-color: #5d8b1f; box-shadow: 0 0 0 3px rgba(139,194,52,.18); }
body.dark .field { background: #0f2211; border-color: #1e4020; color: #F0F7E8; }
body.dark .field::placeholder { color: rgba(240,247,232,.35); }
body.dark .field:focus { border-color: rgba(139,194,52,.6); box-shadow: 0 0 0 3px rgba(139,194,52,.18); }

.select {
  -webkit-appearance: none; appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%235d8b1f' d='M0 0l5 6 5-6z'/></svg>");
  background-repeat: no-repeat; background-position: right 1rem center; padding-right: 2.4rem;
}
body.dark .select {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%238BC234' d='M0 0l5 6 5-6z'/></svg>");
}

.label {
  font-size: .72rem; letter-spacing: .12em; text-transform: uppercase;
  color: rgba(26,36,16,.5); font-weight: 600;
}
body.dark .label { color: rgba(240,247,232,.45); }

.chip {
  display: inline-flex; align-items: center; gap: .35rem; padding: .15rem .55rem;
  border-radius: 9999px; font-size: .68rem; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
}
.chip-success { background: rgba(139,194,52,.15); color: #4d7619;  border-color: rgba(139,194,52,.4); }
.chip-warning { background: rgba(245,158,11,.12); color: #b45309;  border-color: rgba(245,158,11,.4); }
.chip-danger  { background: rgba(239,68,68,.1);   color: #b91c1c;  border-color: rgba(239,68,68,.35); }
.chip-info    { background: rgba(59,130,246,.1);  color: #1d4ed8;  border-color: rgba(59,130,246,.35); }
.chip-muted   { background: rgba(26,36,16,.05);   color: rgba(26,36,16,.55); border-color: rgba(26,36,16,.08); }
.chip-purple  { background: rgba(168,85,247,.1);  color: #6d28d9;  border-color: rgba(168,85,247,.35); }
body.dark .chip-success { background: rgba(139,194,52,.15); color: #b6e36a; border-color: rgba(139,194,52,.25); }
body.dark .chip-warning { background: rgba(245,158,11,.12); color: #fbbf24; border-color: rgba(245,158,11,.25); }
body.dark .chip-danger  { background: rgba(239,68,68,.12);  color: #f87171; border-color: rgba(239,68,68,.25); }
body.dark .chip-info    { background: rgba(59,130,246,.12); color: #93c5fd; border-color: rgba(59,130,246,.25); }
body.dark .chip-muted   { background: rgba(255,255,255,.04); color: rgba(255,255,255,.4); border-color: rgba(255,255,255,.06); }
body.dark .chip-purple  { background: rgba(168,85,247,.12); color: #c4b5fd; border-color: rgba(168,85,247,.25); }

/* Glow utilities */
.glow-green { text-shadow: 0 0 18px rgba(139,194,52,.35); }
.glow-soft  { text-shadow: 0 0 12px rgba(139,194,52,.28); }
body.dark .glow-green { text-shadow: 0 0 18px rgba(139,194,52,.55); }
body.dark .glow-soft  { text-shadow: 0 0 10px rgba(139,194,52,.35); }

/* Category letter colors (for colored gradient headers) */
.cat-letter-A { color: #FCD34D; text-shadow: 0 0 18px rgba(252,211,77,.4); }
.cat-letter-B { color: #D1D5DB; text-shadow: 0 0 18px rgba(209,213,219,.3); }
.cat-letter-C { color: #FBA76F; text-shadow: 0 0 18px rgba(251,167,111,.4); }
.cat-letter-D { color: #8BC234; text-shadow: 0 0 18px rgba(139,194,52,.4); }

/* Category number colors — context aware */
body:not(.dark) .cat-num-A { color: #B45309; }
body:not(.dark) .cat-num-B { color: #4B5563; }
body:not(.dark) .cat-num-C { color: #C2410C; }
body:not(.dark) .cat-num-D { color: #5d8b1f; }
body.dark .cat-num-A { color: #FCD34D; text-shadow: 0 0 16px rgba(252,211,77,.5); }
body.dark .cat-num-B { color: #D1D5DB; text-shadow: 0 0 16px rgba(209,213,219,.4); }
body.dark .cat-num-C { color: #FBA76F; text-shadow: 0 0 16px rgba(251,167,111,.5); }
body.dark .cat-num-D { color: #8BC234; text-shadow: 0 0 16px rgba(139,194,52,.5); }

/* Category watermarks */
.cat-watermark-A, .cat-watermark-B, .cat-watermark-C, .cat-watermark-D { text-shadow: none !important; }
body:not(.dark) .cat-watermark-A { color: #D97706; opacity: .15; }
body:not(.dark) .cat-watermark-B { color: #6B7280; opacity: .15; }
body:not(.dark) .cat-watermark-C { color: #EA580C; opacity: .13; }
body:not(.dark) .cat-watermark-D { color: #5d8b1f; opacity: .15; }
body.dark .cat-watermark-A { color: #FCD34D; opacity: .09; }
body.dark .cat-watermark-B { color: #D1D5DB; opacity: .08; }
body.dark .cat-watermark-C { color: #FBA76F; opacity: .09; }
body.dark .cat-watermark-D { color: #8BC234; opacity: .09; }

/* Category dividers */
body:not(.dark) .cat-divider-A { background: linear-gradient(to bottom, transparent, rgba(180,83,9,.3), transparent); }
body:not(.dark) .cat-divider-B { background: linear-gradient(to bottom, transparent, rgba(75,85,99,.25), transparent); }
body:not(.dark) .cat-divider-C { background: linear-gradient(to bottom, transparent, rgba(194,65,12,.3), transparent); }
body:not(.dark) .cat-divider-D { background: linear-gradient(to bottom, transparent, rgba(93,139,31,.35), transparent); }
body.dark .cat-divider-A { background: linear-gradient(to bottom, transparent, rgba(252,211,77,.3), transparent); }
body.dark .cat-divider-B { background: linear-gradient(to bottom, transparent, rgba(209,213,219,.25), transparent); }
body.dark .cat-divider-C { background: linear-gradient(to bottom, transparent, rgba(251,167,111,.3), transparent); }
body.dark .cat-divider-D { background: linear-gradient(to bottom, transparent, rgba(139,194,52,.3), transparent); }

/* Landing backgrounds */
.landing-bg {
  background:
    radial-gradient(80% 60% at 30% 35%, #e8efd9 0%, #f4f7ee 45%, #e0e8d0 85%),
    repeating-linear-gradient(0deg, transparent 0 38px, rgba(93,139,31,.07) 38px 39px),
    repeating-linear-gradient(90deg, transparent 0 60px, rgba(93,139,31,.07) 60px 61px);
}
.landing-vignette-1 { background: linear-gradient(to top, #f4f7ee 6%, rgba(244,247,238,.7) 50%, transparent 100%); }
.landing-vignette-2 { background: linear-gradient(to right, rgba(244,247,238,.6) 0%, transparent 55%, rgba(244,247,238,.4) 100%); }
body.dark .landing-bg {
  background:
    radial-gradient(80% 60% at 30% 35%, #1a3a1f 0%, #0f2211 45%, #0a1608 85%),
    repeating-linear-gradient(0deg, transparent 0 38px, rgba(139,194,52,.04) 38px 39px),
    repeating-linear-gradient(90deg, transparent 0 60px, rgba(139,194,52,.04) 60px 61px);
}
body.dark .landing-vignette-1 { background: linear-gradient(to top, #0a1608 6%, rgba(10,22,8,.75) 50%, transparent 100%); }
body.dark .landing-vignette-2 { background: linear-gradient(to right, rgba(10,22,8,.7) 0%, transparent 55%, rgba(10,22,8,.5) 100%); }
```

- [ ] **Step 1.1** — Replace `tailwind.config.ts` with content above
- [ ] **Step 1.2** — Replace `app/layout.tsx` with content above
- [ ] **Step 1.3** — Replace `app/globals.css` with content above
- [ ] **Step 1.4** — Run `npm run build` and fix any TypeScript errors. Expected: build succeeds (visual changes need browser verification)
- [ ] **Step 1.5** — Commit: `git commit -m "feat: port new design system — tailwind, fonts, CSS classes, theming"`

---

## Task 2: Shell Components — Header + Footer + Toast

**Files:**
- Rewrite: `components/Header.tsx`
- Rewrite: `components/Footer.tsx`
- Rewrite: `components/Toast.tsx`

### 2.1 — Header.tsx

The new header has:
- `sticky top-0 z-40 bg-[#0a1608]/88 backdrop-blur-md border-b border-ctg-green/10`
- LogoMark SVG component (tennis ball SVG) + LogoHorizontal
- Desktop nav: 5 pill buttons (Inicio, Escalerilla, Desafíos, Reservas, Master), no dropdowns
- Contextual sub-nav (second row) when in Desafíos or Reservas sections
- Right cluster: "Reservar" quick button (desktop only), bell icon, avatar dropdown
- Avatar dropdown: user info, role-based admin links, theme toggle (light/dark segmented), logout
- Mobile bottom tab bar: fixed at bottom, 5 tabs with icons + active state glow
- Notification bell: shows red badge with count, opens `NotificationsPanel`

Active section detection uses `usePathname()` from `next/navigation`.

Key path → section mapping:
```ts
const SECTION_MAP: Record<string, string> = {
  '/': 'inicio', '/home': 'inicio',
  '/escalerilla': 'escalerilla',
  '/fixture': 'desafios', '/fixture-publico': 'desafios', '/historial': 'desafios',
  '/reservar': 'reservas', '/mis-reservas': 'reservas', '/fixture-reservas': 'reservas',
  '/master': 'master',
};
```

Sub-navs:
```ts
const SUBNAVS = {
  desafios: [
    { label: 'Mis desafíos',    href: '/fixture' },
    { label: 'Ver partidos',    href: '/fixture-publico' },
    { label: 'Historial',       href: '/historial' },
  ],
  reservas: [
    { label: 'Nueva reserva',   href: '/reservar' },
    { label: 'Mis reservas',    href: '/mis-reservas' },
    { label: 'Fixture canchas', href: '/fixture-reservas' },
  ],
};
```

LogoMark SVG:
```tsx
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, filter: 'drop-shadow(0 0 8px rgba(139,194,52,.55))' }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <circle cx="20" cy="20" r="18" fill="#8BC234" />
        <path d="M3 20 Q20 6 37 20" stroke="#0a1608" strokeWidth="1.8" fill="none" />
        <path d="M3 20 Q20 34 37 20" stroke="#0a1608" strokeWidth="1.8" fill="none" />
      </svg>
    </div>
  );
}
```

Avatar initials from `user.name`:
```ts
const initials = (user.name || '??').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
```

Theme toggle — adds/removes `body.dark` class and persists in localStorage:
```ts
function applyTheme(dark: boolean) {
  document.body.classList.toggle('dark', dark);
  try { localStorage.setItem('ctg_theme', dark ? 'dark' : 'light'); } catch(e) {}
}
```

- [ ] **Step 2.1** — Rewrite `components/Header.tsx` with design from `src/ui.jsx` (Header, NavPill, MobileTab, ThemeToggleRow, AccountItem, LogoMark, LogoHorizontal) — adapted for Next.js (usePathname, Link, useRouter)
- [ ] **Step 2.2** — Rewrite `components/Footer.tsx` with dark minimal footer: `hidden md:block bg-[#0a1608] border-t border-ctg-green/10 mt-20`, small logo + links + "MatchLab Chile"
- [ ] **Step 2.3** — Rewrite `components/Toast.tsx` with new design: `bg-[#0f2211]/95 backdrop-blur-md border-l-4 border-y border-r border-[#1e4020]`, colored dot, close button
- [ ] **Step 2.4** — Verify `app/layout.tsx` no longer passes `bg-club-bg` (was on body class). Body class is now empty by default; dark mode adds `body.dark`.
- [ ] **Step 2.5** — Commit: `git commit -m "feat: redesign Header, Footer, Toast components"`

---

## Task 3: Landing Page

**File:** `app/page.tsx`

New landing features:
- Full-viewport relative container
- `absolute inset-0 landing-bg` background layer
- SVG tennis court lines overlay (use the SVG from `src/pages/landing.jsx`)
- Vignette layers: `landing-vignette-1`, `landing-vignette-2`
- Hero text: `font-display font-extrabold` at `clamp(2.5rem,7vw,5.5rem)`, "Club de Tenis" + green "Graneros"
- Two CTA buttons: `btn-primary` (Reservar cancha) + `btn-ghost` (Ver escalerilla)
- If logged in: welcome line with position/category
- Bottom-anchored QuickChips (3 info pills + sync indicator)
- `setShowLogin` still triggers `<LoginModal>` (existing pattern preserved)

QuickChip component:
```tsx
function QuickChip({ label, sub, dot, onClick }: { label: string; sub: string; dot?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group bg-[#0a1608]/80 backdrop-blur-md border border-ctg-green/20 hover:border-ctg-green/55 rounded-full pl-3 pr-5 py-2.5 flex items-center gap-3 transition text-left">
      <span className={'w-2 h-2 rounded-full ' + (dot ? 'bg-ctg-green animate-pulse' : 'bg-ctg-green/40')} />
      <div className="leading-tight">
        <div className="text-ctg-text/85 group-hover:text-ctg-green transition text-sm font-semibold">{label}</div>
        <div className="text-ctg-text/40 text-[10px] uppercase tracking-widest">{sub}</div>
      </div>
    </button>
  );
}
```

- [ ] **Step 3.1** — Rewrite `app/page.tsx` with new landing design. Preserve existing `useAuth()`, `showLogin` state, `<LoginModal>` usage. Replace all JSX.
- [ ] **Step 3.2** — Commit: `git commit -m "feat: redesign landing page"`

---

## Task 4: Escalerilla / Ladder

**Files:**
- Rewrite: `components/Ladder.tsx`
- Update: `app/escalerilla/page.tsx`

### Ladder.tsx new structure:

**CategoryBlock** — dark panel with gradient header:
```tsx
// Meta per category
const CAT_META = {
  A: { label: 'Oro (1–12)',   gradient: 'from-yellow-700 to-yellow-600',    border: 'border-yellow-600/30' },
  B: { label: 'Plata (13–24)', gradient: 'from-gray-600 to-gray-500',       border: 'border-gray-500/30' },
  C: { label: 'Bronce (25–36)', gradient: 'from-orange-700 to-orange-600',  border: 'border-orange-600/30' },
  D: { label: 'Verde (37–48)', gradient: 'from-ctg-dark to-ctg-forest',     border: 'border-ctg-green/20' },
};
```

**Pyramid row structure** (unchanged logic, new card components):
```ts
const PYRAMID_ROWS = {
  A: [[1], [2,3,4], [5,6,7,8], [9,10,11,12]],
  B: [[13,14,15], [16,17,18,19], [20,21,22,23,24]],
  C: [[25,26,27], [28,29,30,31], [32,33,34,35,36]],
  D: [[37,38,39], [40,41,42,43], [44,45,46,47,48]],
};
```

**PlayerCardDesktop** (horizontal) and **PlayerCardMobile** (vertical compact):
- Position number: `.cat-num-A/B/C/D` class, `font-display font-black` at large size
- Avatar: green gradient circle with initials
- W/L in JetBrains Mono: `text-ctg-green/85` / `text-red-400/70`
- Status chips: `chip chip-info` (inmune), `chip chip-warning` (vulnerable), etc.
- "TÚ" badge: `absolute -bottom-2 bg-ctg-green text-[#0a1608] text-[9px] font-black`
- Hover: `hover:border-ctg-green/45 hover:shadow-[0_0_18px_rgba(139,194,52,.08)]`
- Me highlight: `bg-ctg-green/15 border-2 border-ctg-green/65 shadow-[0_0_25px_rgba(139,194,52,.18)]`

**ChallengeZone** — "Tu zona de desafío" widget (only if logged in, has challengeable players):
- `bg-[#0f2211] border border-ctg-green/25 rounded-2xl p-5`
- Radial glow in top-right corner (decorative)
- Grid of 2–5 target player mini-cards

- [ ] **Step 4.1** — Rewrite `components/Ladder.tsx` with CategoryBlock, PyramidRow, PlayerCardDesktop, PlayerCardMobile, ChallengeZone, CAT_META
- [ ] **Step 4.2** — Update `app/escalerilla/page.tsx`: add PageTitle eyebrow, StatCards grid (wins/losses/matches/effectiveness), dark wrapper `bg-[#0a1608]`. Preserve all existing state/handlers.
- [ ] **Step 4.3** — Commit: `git commit -m "feat: redesign Ladder component and escalerilla page"`

---

## Task 5: Modals — Login, Player, Challenge, Result

**Files:**
- Rewrite: `components/LoginModal.tsx`
- Rewrite: `components/PlayerModal.tsx`
- Rewrite: `components/ChallengeModal.tsx`
- Update: `components/ResultModal.tsx` (or wherever result modal lives)

**ModalShell** (shared base — add as internal component or put in `components/ModalShell.tsx`):
```tsx
function ModalShell({ children, onClose, width = 'max-w-md' }: { children: React.ReactNode; onClose: () => void; width?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className={'relative w-full ' + width + ' animate-scale-in'}>
        {children}
      </div>
    </div>
  );
}
```

**LoginModal**: `bg-[#0f2211] border border-ctg-green/15 rounded-2xl`, centered LogoMark SVG, green radial glow in top-right, `.field` inputs, `.btn-primary w-full`, forgot password view toggle.

**PlayerModal**: category gradient header (`bg-gradient-to-br from-yellow-700...` etc.), large avatar + name + position, chip status badges, `.chip` W/L/stats grid, progress bar for effectiveness, `.btn-primary` or disabled state for challenge.

**ChallengeModal**: header with `bg-[#152b18] border-b border-[#1e4020]`, VS layout with two avatars (challenger vs challenged), amber rules box, ghost + primary buttons.

**ResultModal**: table layout with set score inputs (3 sets), W.O. checkbox, blue tip box.

- [ ] **Step 5.1** — Add `ModalShell` as a shared internal export (add to `components/LoginModal.tsx` or create `components/ModalShell.tsx`)
- [ ] **Step 5.2** — Rewrite `components/LoginModal.tsx`
- [ ] **Step 5.3** — Rewrite `components/PlayerModal.tsx`
- [ ] **Step 5.4** — Rewrite `components/ChallengeModal.tsx` (currently this component may not exist separately — check `app/escalerilla/page.tsx`)
- [ ] **Step 5.5** — Update `components/ResultModal.tsx` with table-based score input
- [ ] **Step 5.6** — Commit: `git commit -m "feat: redesign Login, Player, Challenge, Result modals"`

---

## Task 6: Challenges Page (Mis Desafíos)

**Files:**
- Rewrite: `app/fixture/page.tsx`
- Rewrite: `components/ChallengesList.tsx`

New page structure:
- `PageTitle` eyebrow "Tu actividad", title "Mis Desafíos"
- `ActionBanner` — amber gradient panel when there are pending/urgent items (appears at top)
- Segmented tabs: `Por jugar · Pendientes · Historial` with count badges
- Search input + sort menu
- List of grouped challenge cards

**PendingCard**: amber `border-l-4 border-l-amber-500`, Avatar + VS + Avatar, expiry countdown, Accept/Reject buttons (if received) or "Pendiente" chip (if sent)

**PlayCard**: colored `border-l-4` (green/red/blue based on state), compact matchup, "Fijar fecha" or "Ingresar resultado" button, date chip if scheduled

**HistoryCard**: `border-l-4` green/red/amber by result, opponent avatar + name, ScoreBoxes component (existing), result chip

**ScoreBoxes** — port from `src/score-boxes.jsx` to `components/ScoreBoxes.tsx`:
- Small squares per set: `w-7 h-7 rounded-md font-mono` 
- Won sets: `bg-ctg-green/15 text-ctg-green`, lost: `bg-[#152b18] text-ctg-text/60`

- [ ] **Step 6.1** — Create `components/ScoreBoxes.tsx` with win/loss set boxes
- [ ] **Step 6.2** — Rewrite `components/ChallengesList.tsx` with PendingCard, PlayCard, HistoryCard
- [ ] **Step 6.3** — Rewrite `app/fixture/page.tsx` with segmented tabs, ActionBanner, search, grouped list. Preserve all API calls and state management.
- [ ] **Step 6.4** — Commit: `git commit -m "feat: redesign Mis Desafíos page and challenge cards"`

---

## Task 7: Reservar Page

**File:** `app/reservar/page.tsx`

New design features:
- `StepIndicator` — 3 numbered circles connected by lines, active circle glows green
- **Step 1**: `bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6`, 2-column court grid, each court card with large "C1"/"C2" icon, dashed "sin preferencia" option
- **Step 2**: Calendar section + time slots grid (3 cols), slots colored by availability/high-demand/selected
- **Step 3**: Summary box `bg-[#152b18]`, partner type radio (`Socio del club / Invitado`), dropdown or input
- Success state: glow-pulse circle + checkmark, reservation summary box, two action buttons

StepIndicator:
```tsx
// step: 1|2|3
// status per step: 'done' | 'active' | 'future'
// done → bg-ctg-green/25 text-ctg-green + check icon
// active → bg-ctg-green text-[#0a1608] + glow
// future → bg-[#152b18] border border-[#1e4020] text-ctg-text/30
```

- [ ] **Step 7.1** — Rewrite `app/reservar/page.tsx` with new step design. Preserve all calendar logic, slot availability checks, API calls.
- [ ] **Step 7.2** — Commit: `git commit -m "feat: redesign reservar page with new step flow"`

---

## Task 8: Remaining Auth + Public Pages

**Files:** `app/fixture-publico/page.tsx`, `app/fixture-reservas/page.tsx`, `app/historial/page.tsx`, `app/mis-reservas/page.tsx`, `app/perfil/page.tsx`, `app/master/page.tsx`

Common pattern to apply to all:
- Page wrapper: remove white bg, let `body.dark` propagate
- `PageTitle` component with eyebrow + title + accent
- Cards: `.card` or `bg-[#0f2211] border border-[#1e4020] rounded-2xl` 
- Tables: header `bg-[#152b18]`, rows alternate `bg-[#0f2211]`/`bg-[#0a1608]`, `border-[#1e4020]`
- Inputs/selects: `.field` + `.select`
- Buttons: `.btn-primary` / `.btn-ghost` / `.btn-danger`
- Empty states: large ghost icon `text-ctg-green/15 text-8xl`, muted title + subtitle

Specific per page:

**fixture-publico**: Filter bar (search + status/period/sort dropdowns), list of challenge cards using HistoryCard pattern but without "me" context

**fixture-reservas**: 7-day tab row `bg-[#0f2211]`, slot grid per court, occupied slots `bg-ctg-green/10`, blocked slots `bg-red-500/10 text-red-400`

**historial**: Win/Loss stat cards at top (font-display black numbers), filter chips, table rows with ScoreBoxes

**mis-reservas**: Active reservations in `bg-[#0f2211]` cards with court/time/partner info; cancel button `btn-danger`; history section with smaller cards

**perfil**: Dark panels for each section (avatar upload, personal info, password change, stats); avatar circle with gradient bg and initials

**master**: Group standings in dark tables, match result boxes (ScoreBoxes), bracket tree for semis/finals

- [ ] **Step 8.1** — Update `app/fixture-publico/page.tsx`
- [ ] **Step 8.2** — Update `app/fixture-reservas/page.tsx`
- [ ] **Step 8.3** — Update `app/historial/page.tsx`
- [ ] **Step 8.4** — Update `app/mis-reservas/page.tsx`
- [ ] **Step 8.5** — Update `app/perfil/page.tsx`
- [ ] **Step 8.6** — Update `app/master/page.tsx`
- [ ] **Step 8.7** — Commit: `git commit -m "feat: restyle remaining auth and public pages"`

---

## Task 9: Notifications Panel (New Feature)

**Files:**
- Create: `components/NotificationsPanel.tsx`
- Modify: `components/Header.tsx` (wire bell → panel)

The notification bell in the Header is already designed in Task 2 but the panel component is a separate file.

NotificationsPanel renders as a dropdown from the bell:
- Position: `fixed md:absolute top-[72px] md:top-full md:right-0 w-full md:w-[420px]`
- 3 filter tabs: Todas / Sin leer / Acción
- Scrollable list of NotificationItem components
- Each item: colored icon square + title + body + time + action button
- "Marcar todas" button in header
- For real data: connect to `GET /api/notifications` endpoint (the hook is `useNotifications`)

The panel integrates with the existing API pattern. Since the backend notification endpoint may not exist yet, create a `hooks/useNotifications.ts` that returns empty array by default but is ready to be wired:

```ts
// hooks/useNotifications.ts
import { useState, useEffect } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // TODO: wire to GET /notifications endpoint
  // For now, returns empty to avoid mock data in production
  
  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id: string) => setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);
  
  return { notifications, unreadCount, markAllRead, markRead };
}
```

- [ ] **Step 9.1** — Create `hooks/useNotifications.ts`
- [ ] **Step 9.2** — Create `components/NotificationsPanel.tsx` with full panel UI
- [ ] **Step 9.3** — Update `components/Header.tsx` to import and use `NotificationsPanel` and `useNotifications`
- [ ] **Step 9.4** — Commit: `git commit -m "feat: add notifications panel component"`

---

## Task 10: Admin Pages

**Files:** `app/admin/page.tsx`, `app/admin-reservas/page.tsx`, all `components/admin/*.tsx`

Apply the dark admin design system described in the admin design prompt. Key patterns:

- Tab nav: dark background, active tab `border-b-2 border-ctg-green bg-ctg-green/8 text-ctg-green`
- KPI cards: `bg-[#111f0e] border border-ctg-green/20 rounded-xl p-6`, value in `font-display font-black text-5xl text-ctg-green`
- Tables: `bg-[#0d1e0b]` base, `bg-[#0a1608]` header, alternating `bg-[#111f0e]`/`bg-[#0d1e0b]` rows
- All modals: `bg-[#111f0e] border border-ctg-green/20 rounded-2xl`
- Dispute cards: `border-red-500 bg-red-500/5 ring-1 ring-red-500/30 animate-pulse`
- Slot grid (bloqueos/luz): 5×2 grid, `bg-red-500/20 border-red-500/40` for blocked, `bg-ctg-green/10` for reserved

- [ ] **Step 10.1** — Restyle `app/admin/page.tsx` (4 tabs: Dashboard, Jugadores, Desafíos, Master)
- [ ] **Step 10.2** — Restyle `app/admin-reservas/page.tsx` (3 tabs: Reservas, Usuarios, Estadísticas)
- [ ] **Step 10.3** — Restyle all 4 admin modals
- [ ] **Step 10.4** — Commit: `git commit -m "feat: restyle admin panels"`

---

## Self-Review

**Spec coverage:**
- ✅ Foundation (fonts, colors, CSS classes, theme toggle)
- ✅ Header (flat nav, sub-nav, mobile tabs, bell, avatar dropdown)
- ✅ Footer (minimal dark)
- ✅ Toast (dark design)
- ✅ Landing (court SVG, hero, chips, NextUpWidget placeholder)
- ✅ Ladder (CategoryBlock, PlayerCard desktop+mobile, ChallengeZone)
- ✅ All 4 modals
- ✅ Challenges page (segmented tabs, ActionBanner, 3 card types)
- ✅ Reservar (StepIndicator, dark panels)
- ✅ All remaining public + auth pages
- ✅ Notifications panel
- ✅ Admin panels

**Gaps identified:**
- `reset-password/page.tsx` not listed — apply same dark field/button pattern in Task 8 alongside other pages
- `components/PlayerCard.tsx` (escalerilla compact) — update alongside Ladder.tsx in Task 4
- `components/ScheduleDateModal.tsx` — update in Task 5 alongside other modals
- `components/ModifyReservationModal.tsx` — update in Task 5

**Type consistency:** All component APIs remain unchanged (props, handlers). Only JSX/className changes. TypeScript should compile cleanly.

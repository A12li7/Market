# Design Brief

## Direction

Night Desk — a dark-first Arabic RTL financial terminal for AI chart analysis.

## Tone

Industrial/utilitarian precision with an editorial edge — data-dense like a trading terminal, but calm and legible like Linear.

## Differentiation

An unexpected **amber-gold primary** replaces finance's predictable blue, so the "حلّل الشارت" action glows like a signal on a deep navy desk; cyan-teal marks everything AI.

## Color Palette

| Token      | OKLCH        | Role                                          |
| ---------- | ------------ | --------------------------------------------- |
| background | 0.16 0.018 255 | Deep navy-slate app canvas                  |
| foreground | 0.94 0.008 255 | Primary text, AA+ on background             |
| card       | 0.20 0.020 255 | Chart panels, AI card, history cards        |
| primary    | 0.78 0.15 78   | Amber-gold CTA + active nav + focus ring    |
| accent     | 0.72 0.13 195  | Cyan-teal AI/intelligence accent            |
| muted      | 0.24 0.020 255 | Inset wells, secondary surfaces, dividers   |
| up         | 0.70 0.17 150  | Bullish candles, positive change            |
| down       | 0.62 0.20 22   | Bearish candles, negative change            |
| chart-3/4  | 0.78 0.15 78 / 0.72 0.13 195 | SMA20 (amber) / SMA50 (teal)  |

## Typography

- Display: Space Grotesk — headings, app title, large price figures
- Body: DM Sans — UI labels, Arabic copy, body text
- Arabic: Noto Sans Arabic / IBM Plex Sans Arabic / Cairo stack (system fallback) via `font-arabic`
- Mono: JetBrains Mono — prices, change %, indicator readouts (tabular numerals)
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm md:text-base`

## Elevation & Depth

Three flat layers (background → card → popover) separated by hairline borders and `shadow-subtle`; only modals and the AI card use `shadow-elevated`. No neon glow.

## Structural Zones

| Zone    | Background       | Border            | Notes                                          |
| ------- | ---------------- | ----------------- | ---------------------------------------------- |
| Header  | bg-card          | border-b          | Sticky; logo + nav on the right (RTL), search left |
| Content | bg-background    | —                 | Chart panel + AI card on `bg-card`; alt sections `bg-muted/30` |
| Footer  | bg-muted/40      | border-t          | Muted, low-contrast legal + links              |

## Spacing & Rhythm

Sections `py-8 md:py-12`, cards `p-4 md:p-6`, gaps `gap-4 md:gap-6`; micro-spacing `space-y-2` inside data rows; dense but never cramped.

## Component Patterns

- Buttons: `rounded-md`, primary = amber gradient + `shadow-glow-primary`, hover brightens; secondary = `bg-secondary`; ghost for icon-only
- Cards: `rounded-lg bg-card border border-border shadow-subtle`, hover lifts to `shadow-elevated`
- Badges: pill `rounded-full`, tinted `bg-up/10 text-up` or `bg-down/10 text-down` for movement; `bg-accent/10 text-accent` for AI tags

## Motion

- Entrance: `animate-fade-in-up` staggered on cards (0.4s ease-out)
- Hover: `transition-smooth` 0.3s on cards, buttons, nav
- Decorative: `animate-pulse-live` on the live price dot; `animate-shimmer` for AI loading skeleton

## Constraints

- Fully RTL Arabic: `dir="rtl"`, logical properties, mirrored chart axis
- Dark-only aesthetic; `.dark` mirrors `:root` for safe class toggling
- Never raw hex/rgb in components — semantic tokens only
- Numerals use tabular mono for price alignment
- Do NOT build: email price alerts, multi-asset chart comparison

## Signature Detail

The amber-gold "signal" CTA with a soft glow ring — the single warm element on a cold navy desk, making the analyze action unmistakable.

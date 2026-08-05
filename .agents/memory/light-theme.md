---
name: Light theme conversion
description: All pages converted from dark editorial to warm cream light theme. CSS variables are the single source of truth.
---

## Rule
All pages use the **light cream theme** — `#FAF7F2` bg, `#1A1612` text, `#B4690E` gold. The dark editorial theme has been removed.

## How it works
`src/index.css` `:root` block defines all CSS variables. The key switch was flipping:
- `--bg: #0D0A08` → `#FAF7F2`
- `--bg-card: #1A1208` → `#FFFFFF`
- `--bg-pill: #2A1A0B` → `#EEE9E0`
- `--border: rgba(255,255,255,0.07)` → `#E5DDD4`
- `--text: #F5EFE4` → `#1A1612`
- `--text-muted: rgba(245,239,228,0.42)` → `#9C8C7E`
- Also added `--accent: #B4690E` and `--accent-light: #FEF3C7` which were missing from index.css.

## Hardcoded values to watch for
Pages also had many hardcoded hex values that needed manual sed replacement:
- `#0D0B08`, `#0D0A08` → `#FAF7F2` (dark page/section bgs)
- `#F5EFE4` → `#1A1612` (light text on dark → dark text on light)
- `#161410`, `#1C1814`, `#1E1A15` → `#FFFFFF` or `#F5EEE6` (dark card/input bgs)
- `rgba(255,255,255,0.05)` → `rgba(26,22,18,0.03)` (input bg)
- `rgba(245,240,230,0.10)` → `#E5DDD4` (border on dark → border on light)
- `rgba(245,239,228,0.XX)` muted text → `#9C8C7E` or `rgba(26,22,18,0.XX)`

## Navbar
Fully rewritten to light. Nav bg: `rgba(250,247,242,0.96)`. Dropdowns: `#FFFFFF` bg, `#E5DDD4` border. All text flipped to dark.

## style-calendar
Has a local `<style>` block with CSS class definitions (not CSS vars). Manually updated all dark colors there. Also has `const BG` and `const BORDER` constants that must stay light.

**Why:** Client requested full light theme for all pages (August 2026).

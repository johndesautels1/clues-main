# CLUES Intelligence — Development Rules

## WCAG 2.1 AA Compliance (MANDATORY — Dark Mode)

These rules are **non-negotiable**. Every developer and every AI session must follow them at all times. No exceptions.

### Contrast Ratios (against `--bg-primary: #0a0e1a`)
- **Normal text (< 18.66px bold or < 24px regular):** minimum **4.5:1** contrast ratio
- **Large text (≥ 18.66px bold or ≥ 24px regular):** minimum **3:1** contrast ratio
- **UI components and graphical objects:** minimum **3:1** contrast ratio against adjacent colors
- **Focus indicators:** minimum **3:1** contrast ratio against the background

### Minimum Font Sizes
- **Body text:** never below `0.75rem` (12px)
- **UI labels, badges, captions:** never below `0.6875rem` (11px)
- **Nothing in the app** may ever be set below `0.6875rem`

### Approved Dark-Mode Text Colors (pre-verified)
| Token                  | Hex       | Ratio vs #0a0e1a | Use for                        |
|------------------------|-----------|-------------------|--------------------------------|
| `--text-primary`       | `#f9fafb` | 18.3:1            | Headings, primary body text    |
| `--text-secondary`     | `#9ca3af` | 6.3:1             | Subtitles, descriptions        |
| `--text-muted`         | `#8b95a5` | 5.2:1             | Hints, captions, timestamps    |
| `--text-accent`        | `#60a5fa` | 5.1:1             | Links, interactive highlights  |
| `--clues-sapphire-light` | `#3b82f6` | 3.6:1           | Large text/headings only       |
| `--clues-orange`       | `#f97316` | 7.0:1             | Accent, badges                 |
| `--clues-gold`         | `#f59e0b` | 7.9:1             | Accent, badges                 |
| `--score-green`        | `#22c55e` | 6.4:1             | Success indicators             |

### Disabled / Locked State Rules
- **Never** use `opacity` below `0.6` on any element containing text
- Disabled elements must maintain at least **3:1** contrast
- Use desaturation (`filter: grayscale()`) + muted colors, not transparency

### Interactive Element Rules
- All focusable elements must have a visible `:focus-visible` outline (2px solid, 3:1 ratio)
- Touch targets must be at least 44×44 CSS pixels (WCAG 2.5.5 AAA, but we target it)
- Hover states must not be the only way to convey information

### Placeholder Text
- Placeholder color must meet **4.5:1** against the input background
- Use `--text-muted` (the corrected value) for placeholders

### Color-Only Communication
- Never use color as the **sole** indicator of state (always pair with icon, text, or shape)
- Status badges already use text labels — maintain this pattern

### Before Submitting ANY CSS
1. Verify every text color against its actual rendered background (not just `--bg-primary` — check overlays, cards, badges)
2. Verify font sizes meet minimums above
3. Verify disabled states maintain 3:1
4. Verify focus outlines exist on all interactive elements

---

## Build Rules
- **MANDATORY FIRST READ**: Read ALL THREE of these files before starting ANY work:
  1. `CLUES_MAIN_BUILD_REFERENCE.md` — overall system architecture and build state
  2. `PARAGRAPHICAL_ARCHITECTURE.md` — Paragraphical pipeline, Gemini prompt, metrics, Smart Scores, Cristiano judge, report structure. **This file supersedes any conflicting Paragraphical info in the build reference.**
  3. This file (`CLAUDE.md`) — WCAG rules, dev rules
- Commit after each component
- Update the build reference checklist after each commit
- Supabase is the heart of the backend — `supabase` export is always a valid `SupabaseClient`, never null
- No guessing — verify actual errors before proposing fixes

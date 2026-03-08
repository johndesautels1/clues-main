# CLUES Intelligence — Development Rules

## WCAG 2.1 AA Compliance (MANDATORY — Dark Mode AND Light Mode)

These rules are **non-negotiable**. Every developer and every AI session must follow them at all times. No exceptions. **All UI must meet WCAG 2.1 AA in BOTH dark mode and light mode.**

### Contrast Ratios
- **Normal text (< 18.66px bold or < 24px regular):** minimum **4.5:1** contrast ratio
- **Large text (≥ 18.66px bold or ≥ 24px regular):** minimum **3:1** contrast ratio
- **UI components and graphical objects:** minimum **3:1** contrast ratio against adjacent colors
- **Focus indicators:** minimum **3:1** contrast ratio against the background
- **These ratios apply in BOTH dark and light mode** — verify against the actual rendered background in each mode

### Minimum Font Sizes
- **Body text:** never below `0.75rem` (12px)
- **UI labels, badges, captions:** never below `0.6875rem` (11px)
- **Nothing in the app** may ever be set below `0.6875rem`

### Approved Dark-Mode Text Colors (pre-verified against `--bg-primary: #0a0e1a`)
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

### Light-Mode Compliance
- Light mode background: `#ffffff` (or near-white)
- All text colors used in light mode must meet the same 4.5:1 / 3:1 ratios against the light background
- Dark-mode-only colors (e.g., `#f9fafb` text) will NOT pass on white — use CSS custom properties that swap per `prefers-color-scheme` or a theme class
- Glassmorphic overlays in light mode must ensure text on glass cards still meets contrast minimums
- The 100-page report (PDF/print) must also meet WCAG contrast ratios for light backgrounds

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
1. Verify every text color against its actual rendered background in **both dark and light mode** (not just `--bg-primary` — check overlays, cards, badges)
2. Verify font sizes meet minimums above
3. Verify disabled states maintain 3:1 in both modes
4. Verify focus outlines exist on all interactive elements
5. If adding new colors, verify contrast ratios against both `#0a0e1a` (dark) and `#ffffff` (light)

---

## Build Rules
- **MANDATORY FIRST READ**: Read ALL FOUR of these files before starting ANY work:
  1. `CLUES_MISSION.md` — company mission, architecture vision, WHY everything exists. **Read this first to understand the product.**
  2. `CLUES_MAIN_BUILD_REFERENCE.md` — overall system architecture and build state
  3. `PARAGRAPHICAL_ARCHITECTURE.md` — Paragraphical pipeline, Gemini prompt, metrics, Smart Scores, Cristiano judge, report structure. **This file supersedes any conflicting Paragraphical info in the build reference.**
  4. This file (`CLAUDE.md`) — WCAG rules, dev rules
- Commit after each component
- Update the build reference checklist after each commit
- Supabase is the heart of the backend — `supabase` export is always a valid `SupabaseClient`, never null
- No guessing — verify actual errors before proposing fixes

## Data Integrity Rules (ZERO TOLERANCE)
- **READ the actual codebase before writing ANY code or documentation.** Do not assume structure from memory, blueprints, or prior context. The source files are the ONLY source of truth.
- **Never label anything "legacy" or "backward compatible" to avoid fixing it.** If something is wrong, fix it. If something is stale, remove it. There is no "legacy" excuse.
- **Never claim work is complete without a full grep verification.** Every change must be followed by a codebase-wide search confirming zero remaining stale references.
- **The Gemini model is `gemini-3.1-pro-preview`.** Not `gemini-3.1-pro`. Not `Gemini 3.1`. The full name is always "Gemini 3.1 Pro Preview". There is exactly ONE Gemini model ID in this codebase and it is `gemini-3.1-pro-preview`. Any deviation is a bug.
- **The Paragraphical has 30 paragraphs (P1-P30) in 6 phases.** Not 27. Not 24. See `src/data/paragraphs.ts` for the canonical structure. Any deviation is a bug.
- **Gemini is the REASONING ENGINE, not an extractor.** It extracts, recommends, AND scores. Opus/Cristiano judges afterward. Any documentation saying otherwise is wrong and must be corrected immediately.
- **Audit failures are treated as lies.** If an AI agent marks something as correct when it is not, or labels stale data as "legacy" to avoid fixing it, that is a trust violation. The project owner runs independent auditors behind every AI session.

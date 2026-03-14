# AGENT AUDIT — 2026-03-14

> **PURPOSE**: This document exists to prevent future AI agents from repeating mistakes,
> lying about completed work, or making unauthorized changes. Read this BEFORE touching code.

---

## CRITICAL WARNINGS

### 1. Conv 23-24 (Stripe Integration) is NOT BUILT

A previous agent **falsely claimed** Conv 23-24 was complete. It is **100% unbuilt**.

**What exists:**
- `supabase/schema.sql` has a `subscriptions` table definition (schema only, orphaned)
- `PrivacyPolicyModal.tsx` and `CookiePolicyModal.tsx` mention Stripe in boilerplate policy text

**What does NOT exist (must be built from scratch):**
- `api/stripe-checkout.ts` — does not exist
- `api/stripe-webhook.ts` — does not exist
- `src/components/Subscription/PricingPage.tsx` — does not exist
- `src/components/Subscription/TierGate.tsx` — does not exist
- `src/lib/stripeClient.ts` — does not exist
- No `stripe` npm package in `package.json`
- No Stripe environment variables
- No tier-gating logic anywhere in the codebase
- No checkout flow, no webhook handler, no subscription management

**Verified 2026-03-14 via full codebase grep.**

---

### 2. Test Persona is INCOMPLETE

The inject system (`src/data/testPersona.ts`) has gaps:

| Data Source | Expected | Actual | Gap |
|-------------|----------|--------|-----|
| Paragraphs P1-P30 | 30 full paragraphs | 30 present | OK (but extraction is mocked, not real Gemini) |
| Demographics | 34 questions | ~24 answers | ~10 questions missing |
| DNW | 33 questions | 10 entries | 23 questions missing |
| MH | 33 questions | 10 entries | 23 questions missing |
| General | 50 questions | 16 entries | 34 questions missing |
| Tradeoffs | 50 questions | 8 entries | 42 questions missing |
| Mini Modules | 23 modules x 100 Qs | 12 modules x 50 Qs | 11 modules missing, each module only has 50/100 |

**No pipeline results exist in the persona** — no `smartScoreOutput`, no `judgeReport`, no evaluation data.
After injection, user must navigate to `/results` and click "Run Evaluation" (requires live API keys + costs real money).

---

### 3. UI Design is INCONSISTENT

Three different card designs on the Dashboard that don't match:

1. **ParagraphicalButton** — Premium glassmorphic hero card (`glass-heavy`, 40px blur, gradient overlay, gradient title text, animated glow)
2. **MainModuleExpander** — Basic functional dropdown (`glass`, plain text, flat sub-section cards, no gradients or glow effects)
3. **ModuleButton** (23 mini modules) — Rich illuminated cards (`glass`, status dots with glow, animated borders, score meters, recommendation badges)

The Main Module section looks significantly less polished than the sections above and below it.

---

### 4. No User Onboarding

There is NO guided walkthrough for new users. Only:
- Globe: "Zoom in to Your Dream Region" (one line)
- Post-globe: "Now click on the Paragraphical below" (one line)
- No explanation of the 3-stage journey
- No explanation of how long it takes
- No explanation of WHY each stage matters
- No progress indicator showing overall journey stage
- No tutorial or first-time-user experience

---

### 5. Bayesian/Adaptive Logic is ONLY in Mini Modules

| Stage | Has Bayesian/Adaptive? | Reality |
|-------|----------------------|---------|
| Paragraphical (P1-P30) | NO | Strictly sequential, no skip, no reorder |
| Main Module (200 Qs) | NO | Sequential with static skip rules only (no children -> skip child Qs) |
| Mini Modules (23 x 100 Qs) | YES | Full CAT with EIG, MOE tracking, cross-module skip logic |

Cross-stage data flow exists (Paragraphical -> relevance weights -> Mini Module recommendations) but the Paragraphical and Main Module themselves do not use adaptive question selection.

---

## RULES FOR ALL FUTURE AGENTS

1. **NEVER claim work is done without grep verification.** Search the actual codebase.
2. **NEVER delete code without explicit owner permission.** Not stubs, not "unused" exports, nothing.
3. **NEVER create new branches without owner permission.** Use only the designated branch.
4. **NEVER revert commits or roll back code.**
5. **NEVER touch the D: drive.** All code lives in the GitHub repository only.
6. **NEVER change code architecture without permission for each individual change.**
7. **Commit after each component fix** — small, verifiable commits.
8. **Run `tsc --noEmit` after every change** to verify zero TypeScript errors.
9. **Read this file, CLAUDE.md, BUILD_SCHEDULE.md, CLUES_MISSION.md, and PARAGRAPHICAL_ARCHITECTURE.md before starting ANY work.**
10. **Update BUILD_SCHEDULE.md Section 8 before ending any conversation.**

---

## CURRENT BUILD STATE (2026-03-14)

- **Phases 1-3 (Conv 1-22)**: COMPLETE and audited
- **Conv 23-24 (Stripe)**: NOT STARTED
- **Conv 25-26 (Light Mode)**: NOT STARTED
- **Conv 27-28 (Production Hardening)**: NOT STARTED
- **Build status**: `tsc --noEmit` passes with 0 errors
- **Total commits**: 312

## WORK IN PROGRESS (This Session)

1. Writing this audit document (AGENT_AUDIT.md)
2. Completing test persona with ALL questions
3. Unifying Dashboard UI to high-end corporate design
4. Adding onboarding instructions for every stage
5. Adding Bayesian/adaptive logic to Paragraphical and Main Module
6. Wiring Stripe integration (Conv 23-24)
7. Cleaning up stale READMEs

# CLUES Intelligence — Full Codebase Audit Table

**Purpose:** This document provides an exhaustive, checkpoint-by-checkpoint audit table for an external agent to verify the entire 20-to-23 module / 27-to-30 paragraph migration. Every row is a verifiable assertion with the exact file, line range, and expected value. If ANY row fails verification, it is a bug.

**Context:** The codebase was migrated from:
- 20 category modules -> 23 category modules (6-tier funnel order)
- 27 paragraphs -> 30 paragraphs (P1-P30)
- Old short module IDs (e.g., `climate`, `safety`, `healthcare`) -> Canonical snake_case IDs (e.g., `climate_weather`, `safety_security`, `health_wellness`)
- Old category label "Human Existence Flow" -> "Funnel Flow" (Survival > Foundation > Infrastructure > Lifestyle > Connection > Identity)

---

## SECTION 1: LLM MODEL NAME VERIFICATION

The canonical model ID is `gemini-3.1-pro-preview`. The human-readable name is "Gemini 3.1 Pro Preview". Any other variant (e.g., `gemini-3.1-pro`, `gemini-pro`, `gemini-2.0`) is a bug.

| # | File | Line(s) | What to Verify | Expected Value |
|---|------|---------|----------------|----------------|
| 1.1 | `CLAUDE.md` | ~79 | Canonical model rule | `gemini-3.1-pro-preview` stated as the ONLY model ID |
| 1.2 | `api/paragraphical.ts` | 443 | REST API endpoint URL | `models/gemini-3.1-pro-preview:generateContent` |
| 1.3 | `api/paragraphical.ts` | 552, 565 | Cost tracking + response metadata model field | `'gemini-3.1-pro-preview'` |
| 1.4 | `src/lib/oliviaTutor.ts` | 86 | Olivia Flash model reference | `'gemini-3.1-pro-preview'` |
| 1.5 | `src/lib/costTracking.ts` | 27 | Cost rate table key | `'gemini-3.1-pro-preview'` with rates input: 1.25, output: 10.00 |
| 1.6 | `src/lib/costTracking.ts` | 48 | Provider group entry | `providers: ['gemini-3.1-pro-preview']` |
| 1.7 | `src/types/index.ts` | 222 | LLM model union type | `'gemini-3.1-pro-preview'` is a member |
| 1.8 | `src/lib/tierEngine.ts` | 218, 226, 234, 242, 250, 258 | Every tier's llmModels array | First entry is always `'gemini-3.1-pro-preview'` |
| 1.9 | `CLUES_MAIN_BUILD_REFERENCE.md` | ~461, ~464, ~766 | Build ref model mentions | All say `gemini-3.1-pro-preview` |
| 1.10 | `PARAGRAPHICAL_ARCHITECTURE.md` | ~448 | Architecture doc model field | `model: 'gemini-3.1-pro-preview'` |
| 1.11 | ALL FILES | grep | No stale model IDs anywhere | `grep -r "gemini-2\|gemini-pro\b\|gemini-3.1-pro[^-]" --include="*.ts" --include="*.tsx" --include="*.md"` returns ZERO results |

---

## SECTION 2: PARAGRAPH COUNT & NUMBERING (27 -> 30)

The system has exactly 30 paragraphs: P1-P30. Any reference to 27 paragraphs or P1-P27 ranges is stale.

| # | File | Line(s) | What to Verify | Expected Value |
|---|------|---------|----------------|----------------|
| 2.1 | `src/data/paragraphs.ts` | entire file | PARAGRAPH_DEFS array length | Exactly 30 entries with ids 1-30 |
| 2.2 | `src/data/paragraphs.ts` | bottom | PARAGRAPH_COUNT export | `PARAGRAPH_DEFS.length` = 30 |
| 2.3 | `src/data/paragraphs.ts` | top section | PARAGRAPH_SECTIONS ids | Must cover all ids 1-30 with no gaps: `[1,2], [3], [4], [5], [6,7,8], [9,10,11,12], [13,14,15,16], [17,18,19,20], [21,22,23], [24,25,26,27,28], [29,30]` |
| 2.4 | `src/data/paragraphTargets.ts` | entire file | PARAGRAPH_TARGETS array length | Exactly 30 entries with paragraphIds 1-30 |
| 2.5 | `src/components/Discovery/discoveryData.ts` | entire file | SECTIONS array length | Exactly 30 entries with ids `p1` through `p30` |
| 2.6 | `api/paragraphical.ts` | ~185 | Prompt text paragraph count | "user's 30 biographical paragraphs" |
| 2.7 | `api/paragraphical.ts` | ~197-203 | Prompt pipeline description | P1-P2 profile, P3 DNW, P4 MH, P5 Trade-offs, P6-P28 modules, P29-P30 vision |
| 2.8 | `api/paragraphical.ts` | ~285 | source_paragraph range in JSON schema | `<1-30>` |
| 2.9 | `api/paragraphical.ts` | ~338 | paragraph_summaries id range | `<1-30>` |
| 2.10 | `api/paragraphical.ts` | ~48 | GeminiMetricObject source_paragraph comment | "Which paragraph (1-30)" |
| 2.11 | `src/types/index.ts` | ParagraphDef id | Comment says 1-30 | Not "1-27" |
| 2.12 | `src/types/index.ts` | GeminiMetricObject source_paragraph | Comment says 1-30 | Not "1-27" |
| 2.13 | `supabase/schema.sql` | ~29 | paragraphs_completed range | `0-30` (not 0-27) |
| 2.14 | `supabase/schema.sql` | ~149 | Migration comment | "30-paragraph" (not "27-paragraph") |
| 2.15 | `CLAUDE.md` | ~80 | Canonical paragraph count rule | "30 paragraphs (P1-P30). Not 27. Not 24." |
| 2.16 | `CLUES_MAIN_BUILD_REFERENCE.md` | Section 5 | Section header | "THE 30-PARAGRAPH PARAGRAPHICAL" |
| 2.17 | `PARAGRAPHICAL_ARCHITECTURE.md` | all occurrences | All "(1-27)" references | Must be "(1-30)" |
| 2.18 | `PARAGRAPHICAL_ARCHITECTURE.md` | all occurrences | All "P1-P27" references | Must be "P1-P30" |
| 2.19 | `PARAGRAPHICAL_ARCHITECTURE.md` | all occurrences | "27 paragraphs" text | Must be "30 paragraphs" |
| 2.20 | `src/lib/tierEngine.ts` | ~description + questionCount | Description and count | "30 paragraphs", questionCount: 30 |
| 2.21 | `src/App.tsx` | comment | Paragraph count comment | "30-paragraph" |
| 2.22 | `src/components/Paragraphical/ParagraphicalFlow.tsx` | comment | Paragraph count comment | "30-paragraph" |
| 2.23 | `src/components/Paragraphical/ParagraphicalFlow.css` | comment | Paragraph count comment | "30-paragraph" |
| 2.24 | `src/components/Results/FileUpload.tsx` | comments | Paragraph count | "30 paragraphs" |
| 2.25 | `src/components/Results/ReactiveJustification.tsx` | comments | P range | "P1-P30" |
| 2.26 | `src/components/Shared/EmiliaBubble.tsx` | UI text | User-facing text | "30 paragraphs" |
| 2.27 | `src/components/Dashboard/ParagraphicalButton.tsx` | UI text | User-facing text | "30 paragraphs" |
| 2.28 | ALL FILES | grep | No stale "27" paragraph refs remain | `grep -rn "27.paragraph\|P1-P27\|1-27\b" --include="*.ts" --include="*.tsx" --include="*.sql"` returns ZERO results |

---

## SECTION 3: MODULE COUNT & IDS (20 -> 23)

The system has exactly 23 category modules. The canonical module IDs are listed below. Any reference to "20 modules" or "20 categories" or old short IDs is stale.

### 3A. The 23 Canonical Module IDs (in funnel order)

```
TIER 1 - SURVIVAL (P6-P8):    safety_security, health_wellness, climate_weather
TIER 2 - FOUNDATION (P9-P12): legal_immigration, financial_banking, housing_property, professional_career
TIER 3 - INFRASTRUCTURE (P13-P16): technology_connectivity, transportation_mobility, education_learning, social_values_governance
TIER 4 - LIFESTYLE (P17-P20): food_dining, shopping_services, outdoor_recreation, entertainment_nightlife
TIER 5 - CONNECTION (P21-P23): family_children, neighborhood_urban_design, environment_community_appearance
TIER 6 - IDENTITY (P24-P28): religion_spirituality, sexual_beliefs_practices_laws, arts_culture, cultural_heritage_traditions, pets_animals
```

### 3B. Module Definition Audit

| # | File | Line(s) | What to Verify | Expected Value |
|---|------|---------|----------------|----------------|
| 3.1 | `src/data/modules.ts` | entire file | MODULES array length | Exactly 23 entries |
| 3.2 | `src/data/modules.ts` | entire file | Module IDs match canonical list | All 23 IDs above, in funnel order |
| 3.3 | `src/data/modules.ts` | each entry | questionCount | 100 for every module |
| 3.4 | `src/data/modules.ts` | bottom | MODULES_MAP export | Record with 23 keys |
| 3.5 | `src/data/paragraphs.ts` | P6-P28 entries | moduleId field | Each P6-P28 paragraph has a moduleId matching one of the 23 canonical IDs |
| 3.6 | `src/data/paragraphs.ts` | P6-P28 | moduleId ordering | Matches funnel order: P6=safety_security, P7=health_wellness, P8=climate_weather, P9=legal_immigration... P28=pets_animals |
| 3.7 | `src/data/paragraphs.ts` | P1-P5, P29-P30 | moduleId field | No moduleId (undefined) |

### 3C. Module References Across Codebase

| # | File | Line(s) | What to Verify | Expected Value |
|---|------|---------|----------------|----------------|
| 3.8 | `src/components/Results/SideBySideMetricView.tsx` | CATEGORY_LABELS | Category label map | Exactly 23 entries with canonical moduleId keys |
| 3.9 | `src/components/Dashboard/ModuleGrid.tsx` | comment | Module count comment | "23 module buttons" (not "20") |
| 3.10 | `src/components/Dashboard/Dashboard.tsx` | comment line 3 | Layout comment | Should say "23 Module Grid" not "20 Module Grid" |
| 3.11 | `src/components/Dashboard/Dashboard.tsx` | ~142 | Grid comment | Should say "23 Module Grid" not "20 Module Grid" |
| 3.12 | `src/lib/tierEngine.ts` | ~29 | miniModuleCap comment | Should say "all 23 mini modules" not "all 20 mini modules" |
| 3.13 | `CLUES_MAIN_BUILD_REFERENCE.md` | Section 4 | Section header | "THE 23 CATEGORY MODULES" |
| 3.14 | `PARAGRAPHICAL_ARCHITECTURE.md` | all occurrences | "20 categories" text | Must be "23 categories" |
| 3.15 | `PARAGRAPHICAL_ARCHITECTURE.md` | all occurrences | "20 Human Existence Flow categories" | Must be "23 category modules (funnel order)" |
| 3.16 | `PARAGRAPHICAL_ARCHITECTURE.md` | ~16 | "20 Mini Modules" reference | Should say "23 Mini Modules" |
| 3.17 | `PARAGRAPHICAL_ARCHITECTURE.md` | ~330 | "20 Mini Modules" reference | Should say "23 Mini Modules" |
| 3.18 | ALL FILES | grep | No stale "20 module" or "20 categor" refs | `grep -rn "20 module\|20 categor\|20 Mini" --include="*.ts" --include="*.tsx" --include="*.md"` — review every hit |

### 3D. Old Module ID Verification (must NOT exist)

| # | Old ID | Replaced By | Grep Command |
|---|--------|-------------|--------------|
| 3.19 | `climate` (standalone) | `climate_weather` | No `moduleId: 'climate'` or `category: 'climate'` in .ts/.tsx files |
| 3.20 | `safety` (standalone) | `safety_security` | No `moduleId: 'safety'` in .ts/.tsx files |
| 3.21 | `healthcare` | `health_wellness` | `grep -rn "healthcare" --include="*.ts" --include="*.tsx"` — zero in data/prompt files |
| 3.22 | `housing` (standalone) | `housing_property` | No `moduleId: 'housing'` in .ts/.tsx files |
| 3.23 | `financial` (standalone) | `financial_banking` | No `moduleId: 'financial'` in .ts/.tsx files |
| 3.24 | `technology` (standalone) | `technology_connectivity` | No `moduleId: 'technology'` in .ts/.tsx files |
| 3.25 | `transportation` (standalone) | `transportation_mobility` | No `moduleId: 'transportation'` in .ts/.tsx files |
| 3.26 | `education` (standalone) | `education_learning` | No `moduleId: 'education'` in .ts/.tsx files |
| 3.27 | `lifescore` | `social_values_governance` | `grep -rn "lifescore" --include="*.ts" --include="*.tsx"` — zero results |
| 3.28 | `business` | `professional_career` | `grep -rn "'business'" --include="*.ts" --include="*.tsx"` — zero in module contexts |
| 3.29 | `dating_social` | (absorbed/redistributed) | `grep -rn "dating_social" --include="*.ts" --include="*.tsx"` — zero results |
| 3.30 | `food_cuisine` | `food_dining` | `grep -rn "food_cuisine" --include="*.ts" --include="*.tsx"` — zero results |
| 3.31 | `sports_fitness` | `outdoor_recreation` | `grep -rn "sports_fitness" --include="*.ts" --include="*.tsx"` — zero results |

---

## SECTION 4: PARAGRAPH-TO-MODULE MAPPING

Every paragraph P6-P28 must map to exactly one module in funnel order. This is the critical structural integrity check.

| # | Paragraph | Expected moduleId | Expected Section Name | Expected Tier |
|---|-----------|-------------------|----------------------|---------------|
| 4.1 | P1 | (none) | Your Profile | Profile |
| 4.2 | P2 | (none) | Your Profile | Profile |
| 4.3 | P3 | (none) | Do Not Wants | DNW |
| 4.4 | P4 | (none) | Must Haves | MH |
| 4.5 | P5 | (none) | Trade-offs | Trade-offs |
| 4.6 | P6 | safety_security | Survival | Tier 1 |
| 4.7 | P7 | health_wellness | Survival | Tier 1 |
| 4.8 | P8 | climate_weather | Survival | Tier 1 |
| 4.9 | P9 | legal_immigration | Foundation | Tier 2 |
| 4.10 | P10 | financial_banking | Foundation | Tier 2 |
| 4.11 | P11 | housing_property | Foundation | Tier 2 |
| 4.12 | P12 | professional_career | Foundation | Tier 2 |
| 4.13 | P13 | technology_connectivity | Infrastructure | Tier 3 |
| 4.14 | P14 | transportation_mobility | Infrastructure | Tier 3 |
| 4.15 | P15 | education_learning | Infrastructure | Tier 3 |
| 4.16 | P16 | social_values_governance | Infrastructure | Tier 3 |
| 4.17 | P17 | food_dining | Lifestyle | Tier 4 |
| 4.18 | P18 | shopping_services | Lifestyle | Tier 4 |
| 4.19 | P19 | outdoor_recreation | Lifestyle | Tier 4 |
| 4.20 | P20 | entertainment_nightlife | Lifestyle | Tier 4 |
| 4.21 | P21 | family_children | Connection | Tier 5 |
| 4.22 | P22 | neighborhood_urban_design | Connection | Tier 5 |
| 4.23 | P23 | environment_community_appearance | Connection | Tier 5 |
| 4.24 | P24 | religion_spirituality | Identity | Tier 6 |
| 4.25 | P25 | sexual_beliefs_practices_laws | Identity | Tier 6 |
| 4.26 | P26 | arts_culture | Identity | Tier 6 |
| 4.27 | P27 | cultural_heritage_traditions | Identity | Tier 6 |
| 4.28 | P28 | pets_animals | Identity | Tier 6 |
| 4.29 | P29 | (none) | Your Vision | Vision |
| 4.30 | P30 | (none) | Your Vision | Vision |

**Verify in these files:**
- `src/data/paragraphs.ts` — PARAGRAPH_DEFS array (canonical source)
- `src/data/paragraphTargets.ts` — paragraphId + heading alignment
- `src/components/Discovery/discoveryData.ts` — SECTIONS array id/title alignment
- `api/paragraphical.ts` — prompt pipeline description (lines ~197-203)

---

## SECTION 5: SECTION NAMING & GROUPING

The 30 paragraphs are organized into 11 sections for sidebar navigation.

| # | Section Name | Paragraph IDs | Verify In |
|---|-------------|---------------|-----------|
| 5.1 | Your Profile | 1, 2 | `src/data/paragraphs.ts` PARAGRAPH_SECTIONS |
| 5.2 | Do Not Wants | 3 | same |
| 5.3 | Must Haves | 4 | same |
| 5.4 | Trade-offs | 5 | same |
| 5.5 | Survival | 6, 7, 8 | same |
| 5.6 | Foundation | 9, 10, 11, 12 | same |
| 5.7 | Infrastructure | 13, 14, 15, 16 | same |
| 5.8 | Lifestyle | 17, 18, 19, 20 | same |
| 5.9 | Connection | 21, 22, 23 | same |
| 5.10 | Identity | 24, 25, 26, 27, 28 | same |
| 5.11 | Your Vision | 29, 30 | same |

**Cross-verify:** `src/components/Discovery/discoveryData.ts` — the `cat` field on each SECTIONS entry must match the section name, and `CAT_COLORS` must have entries for all 11 section names (or their display variants).

---

## SECTION 6: GEMINI PROMPT DESIGN & LAYOUT

The Gemini prompt is built in `api/paragraphical.ts` function `buildExtractionPrompt()` (lines ~171-383).

| # | Prompt Element | Line(s) | What to Verify | Expected Value |
|---|---------------|---------|----------------|----------------|
| 6.1 | Paragraph count in intro | ~185 | Total paragraph count | "30 biographical paragraphs" |
| 6.2 | Pipeline description | ~197-203 | Paragraph ranges | P1-P2 profile, P3 DNW, P4 MH, P5 trade-offs, P6-P28 modules, P29-P30 vision |
| 6.3 | STEP 1 category list | ~218 | All 23 module IDs listed | Exact list: safety_security, health_wellness, climate_weather, legal_immigration, financial_banking, housing_property, professional_career, technology_connectivity, transportation_mobility, education_learning, social_values_governance, food_dining, shopping_services, outdoor_recreation, entertainment_nightlife, family_children, neighborhood_urban_design, environment_community_appearance, religion_spirituality, sexual_beliefs_practices_laws, arts_culture, cultural_heritage_traditions, pets_animals |
| 6.4 | STEP 1 paragraph source range | ~219 | source_paragraph range | "P1-P30" |
| 6.5 | STEP 5 module count | ~255 | Module count text | "23 category modules (funnel order...)" |
| 6.6 | STEP 5 funnel text | ~255 | Funnel names | "survival > foundation > infrastructure > lifestyle > connection > identity" |
| 6.7 | JSON schema: source_paragraph | ~285 | Range | `<1-30>` |
| 6.8 | JSON schema: paragraph_summaries.id | ~338 | Range | `<1-30>` |
| 6.9 | JSON schema: module_relevance keys | ~347-371 | All 23 module IDs | Every one of the 23 canonical IDs, each scored `<0.0-1.0>` |
| 6.10 | JSON schema: module_relevance count | ~347-371 | Key count | Exactly 23 keys (not 20, not 22) |
| 6.11 | Prompt rules section | ~375-383 | Minimum metrics rule | "MINIMUM 100 metrics" |
| 6.12 | Prompt rules section | ~377 | Paragraph justification rule | "referencing a specific paragraph" |
| 6.13 | No old category IDs in prompt | entire function | Old IDs like `climate`, `safety`, `healthcare` standalone | Must NOT appear as category values |

---

## SECTION 7: PROMPT RETURN DATA RULES & DATA TYPES

The prompt instructs Gemini to return specific JSON structure. Verify the JSON schema in the prompt matches the TypeScript interfaces.

| # | Audit Point | File / Lines | What to Verify |
|---|------------|-------------|----------------|
| 7.1 | GeminiMetricObject fields | `api/paragraphical.ts` :43-60 AND prompt :279-297 | TypeScript interface matches JSON schema in prompt |
| 7.2 | data_type enum | `api/paragraphical.ts` :53 AND prompt :290 | Both say `'numeric' \| 'boolean' \| 'ranking' \| 'index'` |
| 7.3 | threshold.operator enum | `api/paragraphical.ts` :56 AND prompt :293 | Both say `'gt' \| 'lt' \| 'eq' \| 'gte' \| 'lte' \| 'between'` |
| 7.4 | LocationMetrics fields | `api/paragraphical.ts` :62-69 AND prompt :307-334 | TypeScript matches JSON schema — location, country, location_type, parent, overall_score, metrics |
| 7.5 | location_type enum | `api/paragraphical.ts` :65 AND prompt | `'city' \| 'town' \| 'neighborhood'` |
| 7.6 | GeminiExtraction fields | `api/paragraphical.ts` :77-129 | All fields present: demographic_signals, personality_profile, detected_currency, budget_range, metrics, recommended_countries/cities/towns/neighborhoods, paragraph_summaries, dnw_signals, mh_signals, tradeoff_signals, module_relevance, globe_region_preference, thinking_details |
| 7.7 | metrics minimum count | prompt :376 | "MINIMUM 100 metrics" |
| 7.8 | metrics maximum count | prompt :215 | "maximum 250" |
| 7.9 | Metric scoring approach | prompt :244-248 | Each metric scored per location with user_justification + data_justification + source |
| 7.10 | Score range | prompt :245 | "0-100, relative to other recommended locations" |
| 7.11 | Defensive defaults | `api/paragraphical.ts` :526-540 | Every GeminiExtraction field has a fallback default |

**Cross-verify with `src/types/index.ts`:** The interfaces GeminiMetricObject, LocationMetrics, ThinkingStep defined there must match the duplicated types in `api/paragraphical.ts`.

---

## SECTION 8: REPORT LENGTH, LAYOUT & AESTHETIC

| # | Audit Point | File | What to Verify |
|---|------------|------|----------------|
| 8.1 | Report page target | `README.md` :128-129 | "100 pages MAX" for Gamma report |
| 8.2 | Report page reference | `CLUES_MAIN_BUILD_REFERENCE.md` :351 | "50-100 pages" Validated tier |
| 8.3 | Report structure | `PARAGRAPHICAL_ARCHITECTURE.md` :752 | Gamma report structure section exists |
| 8.4 | Visual element inventory | `README.md` :669 | "Visual Element Inventory (Across 100 Pages)" section exists |
| 8.5 | WCAG compliance for reports | `CLAUDE.md` :36 | "100-page report (PDF/print) must also meet WCAG contrast ratios" |
| 8.6 | Dark mode text colors | `CLAUDE.md` :21-33 | All approved color tokens with verified contrast ratios |
| 8.7 | Light mode compliance | `CLAUDE.md` :35-38 | Light mode rules stated |
| 8.8 | Minimum font sizes | `CLAUDE.md` :16-18 | Body >= 0.75rem, UI labels >= 0.6875rem |
| 8.9 | Focus indicators | `CLAUDE.md` :42 | 2px solid, 3:1 ratio |
| 8.10 | Touch targets | `CLAUDE.md` :43 | 44x44 CSS pixels minimum |

---

## SECTION 9: SUPABASE SCHEMA & MIGRATIONS

| # | Audit Point | File | Line(s) | What to Verify |
|---|------------|------|---------|----------------|
| 9.1 | sessions table exists | `supabase/schema.sql` | 12-44 | `create table public.sessions` with all columns |
| 9.2 | paragraphs_completed range | `supabase/schema.sql` | 29 | `smallint not null default 0` — no CHECK constraint restricting to 27 |
| 9.3 | tier column | `supabase/schema.sql` | 27 | `text not null default 'discovery'` |
| 9.4 | globe columns | `supabase/schema.sql` | 21-24 | globe_region (text), globe_lat (double), globe_lng (double), globe_zoom (smallint 1-3) |
| 9.5 | session_data JSONB | `supabase/schema.sql` | 35-39 | Contains GeminiExtraction with 100-250 metrics reference in comment |
| 9.6 | detected_currency | `supabase/schema.sql` | 31 | `detected_currency text` column exists |
| 9.7 | cost_tracking table | `supabase/schema.sql` | 110-120 | model, endpoint, input_tokens, output_tokens, cost_usd, duration_ms |
| 9.8 | RLS policies | `supabase/schema.sql` | 76-101 | sessions has RLS enabled with user-owns-own-data + anon policies |
| 9.9 | cost_tracking RLS | `supabase/schema.sql` | 125-139 | Users can read own costs |
| 9.10 | Migration comment | `supabase/schema.sql` | 149 | "30-paragraph" in migration helper comment |
| 9.11 | No stale 27 refs in schema | `supabase/schema.sql` | entire file | `grep "27" supabase/schema.sql` returns zero paragraph-related hits |

---

## SECTION 10: CODE STRUCTURE vs FUNNEL

The funnel order (Survival > Foundation > Infrastructure > Lifestyle > Connection > Identity) must be consistent everywhere modules are listed.

| # | Audit Point | File | What to Verify |
|---|------------|------|----------------|
| 10.1 | Module array order | `src/data/modules.ts` | MODULES array is in funnel order (safety_security first, pets_animals last) |
| 10.2 | Paragraph order | `src/data/paragraphs.ts` | PARAGRAPH_DEFS[5] through [27] (P6-P28) match funnel order |
| 10.3 | discoveryData order | `src/components/Discovery/discoveryData.ts` | SECTIONS entries for p6-p28 match funnel order |
| 10.4 | paragraphTargets order | `src/data/paragraphTargets.ts` | Entries for paragraphId 6-28 match funnel order |
| 10.5 | Prompt category list order | `api/paragraphical.ts` :218 | Category list in STEP 1 is in funnel order |
| 10.6 | Prompt module_relevance order | `api/paragraphical.ts` :347-371 | JSON keys in funnel order |
| 10.7 | SideBySideMetricView order | `src/components/Results/SideBySideMetricView.tsx` | CATEGORY_LABELS keys match canonical IDs (order matters less here since it's a Record) |
| 10.8 | Build reference funnel | `CLUES_MAIN_BUILD_REFERENCE.md` Section 4 | 6 tiers listed in order with correct modules per tier |
| 10.9 | Build reference fire points | `CLUES_MAIN_BUILD_REFERENCE.md` or `README.md` | Phase boundary fire points: 5, 12, 16, 20, 23, 28, 30 |

---

## SECTION 11: QUESTION FILE LOCATIONS

The codebase references question counts but question content lives in freestanding module apps (external). Verify references are correct.

| # | Audit Point | File | What to Verify |
|---|------------|------|----------------|
| 11.1 | Module questionCount | `src/data/modules.ts` | Every module has `questionCount: 100` |
| 11.2 | Total question math | Documentation | 23 modules x 100 = 2,300 module questions |
| 11.3 | Main Module questions | `src/data/questions/main_module.ts` | 100 Main Module questions (34 Demographics + 33 DNW + 33 Must Haves) |
| 11.4 | Question data files in src/data/questions/ | `src/data/questions/` | 26 question data files (23 mini modules + main_module + general_questions + tradeoff_questions) |
| 11.5 | Module url field | `src/data/modules.ts` | `url?: string` field exists for linking to freestanding apps |
| 11.6 | paragraphTargets coverageTargets | `src/data/paragraphTargets.ts` | Each of 30 entries has `coverageTargets` array (keyword arrays for Olivia) |

---

## SECTION 12: GLOBE-TO-LLM GEOGRAPHIC NARROWING

The globe zoom level determines how Gemini narrows its search area.

| # | Audit Point | File | Line(s) | What to Verify |
|---|------------|------|---------|----------------|
| 12.1 | Globe zoom levels | `src/components/Dashboard/GlobeExplorer.tsx` | 43-47 | 3 levels: Region (0.8), Country (0.25), City (0.07) |
| 12.2 | Region definitions | `src/components/Dashboard/GlobeExplorer.tsx` | 21-39 | 18 predefined regions with lat/lng/radius |
| 12.3 | Region name calculation | `src/components/Dashboard/GlobeExplorer.tsx` | 49-60 | `getClosestRegion()` function using Euclidean distance |
| 12.4 | Globe data saved to session | `supabase/schema.sql` | 21-24 | globe_region, globe_lat, globe_lng, globe_zoom columns |
| 12.5 | Globe region sent to API | `api/paragraphical.ts` | 420-423 | `body.globeRegion` is required (400 error if missing) |
| 12.6 | Globe region in prompt | `api/paragraphical.ts` | 194-195 | `"The user selected globe region: "${globeRegion}"` with note it's a preference not hard constraint |
| 12.7 | Globe region in extraction | `api/paragraphical.ts` | 125 | `globe_region_preference` field in GeminiExtraction |
| 12.8 | Globe region in JSON schema | `api/paragraphical.ts` | 372 | `"globe_region_preference"` in return schema |
| 12.9 | MapOverlay component | `src/components/Dashboard/MapOverlay.tsx` | exists | Displays zoom level/region overlay on globe |
| 12.10 | Dashboard globe integration | `src/components/Dashboard/Dashboard.tsx` | imports | Imports and renders GlobeExplorer component |

---

## SECTION 13: KNOWN STALE REFERENCES FOUND (BUGS TO FIX)

These were identified during this audit and have NOT been fixed yet. The auditing agent should verify these and fix them.

| # | File | Line | Stale Content | Should Be |
|---|------|------|---------------|-----------|
| 13.1 | `README.md` | 5 | "across 20 life categories" | "across 23 life categories" |
| 13.2 | `README.md` | 22 | "## The 20 Category System (Human Existence Flow)" | "## The 23 Category System (Funnel Flow)" |
| 13.3 | `README.md` | 24-67 | Old category list (5 groups of 4) | Should list 23 categories in 6-tier funnel structure |
| 13.4 | `PARAGRAPHICAL_ARCHITECTURE.md` | 16 | "20 Mini Modules" | "23 Mini Modules" |
| 13.5 | `PARAGRAPHICAL_ARCHITECTURE.md` | 330 | "20 Mini Modules" | "23 Mini Modules" |
| 13.6 | `src/components/Dashboard/Dashboard.tsx` | 3 | "20 Module Grid" | "23 Module Grid" |
| 13.7 | `src/components/Dashboard/Dashboard.tsx` | 142 | "20 Module Grid" comment | "23 Module Grid" |
| 13.8 | `src/lib/tierEngine.ts` | 29 | "all 20 mini modules" | "all 23 mini modules" |
| 13.9 | `CLUES_MAIN_BUILD_REFERENCE.md` | 555 | "Human Existence Flow (Survival -> Soul)" | "Funnel Flow (Survival -> Identity)" |

---

## HOW TO USE THIS AUDIT TABLE

1. **Start at Section 1** and work through sequentially. Each section is independent but builds on the same codebase understanding.

2. **For each row**, open the specified file at the specified line(s) and verify the "Expected Value" matches reality. If it doesn't, it's a bug.

3. **Section 13** lists KNOWN bugs that were found but not yet fixed. Fix these first.

4. **Run the grep commands** in Sections 2.28, 3.18, and 9.11 as comprehensive sweeps — they catch anything the row-by-row checks might miss.

5. **Critical files to read in full** before starting:
   - `src/data/modules.ts` (23 module definitions — canonical source)
   - `src/data/paragraphs.ts` (30 paragraph definitions — canonical source)
   - `api/paragraphical.ts` (the entire Gemini prompt and API handler)
   - `supabase/schema.sql` (database schema)
   - `CLAUDE.md` (development rules including model name)

6. **The canonical sources of truth** (in priority order):
   1. `src/data/modules.ts` — module IDs, names, order
   2. `src/data/paragraphs.ts` — paragraph IDs, sections, moduleId mapping
   3. `api/paragraphical.ts` — prompt structure, JSON schema, module_relevance keys
   4. `supabase/schema.sql` — database schema
   5. Everything else must match these four files.

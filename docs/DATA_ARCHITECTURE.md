# CLUES Data Architecture — Complete Flowchart

> **For future AI agents:** This document is the verified, source-code-traced map of every data path in CLUES. Every question ID, logic jump, Olivia context key, and downstream effect is documented here. Read this before touching any questionnaire, persistence, or scoring code.

---

## Table of Contents

1. [High-Level Data Flow](#high-level-data-flow)
2. [The Paragraphical (P1-P30)](#the-paragraphical-p1-p30)
3. [Main Module — All 200 Questions](#main-module--all-200-questions)
4. [Logic Jump Rules (7 Conditional Skips)](#logic-jump-rules-7-conditional-skips)
5. [Olivia Context Builder (19 Key Answers)](#olivia-context-builder-19-key-answers)
6. [GQ Signal → Module Relevance Engine](#gq-signal--module-relevance-engine)
7. [3-Layer Persistence Architecture](#3-layer-persistence-architecture)
8. [Tier & Confidence Engine](#tier--confidence-engine)
9. [Olivia Tutor — Coverage Target Monitoring](#olivia-tutor--coverage-target-monitoring)
10. [Complete Data Flow Diagram](#complete-data-flow-diagram)

---

## High-Level Data Flow

```
USER
 ├── Paragraphical (30 free-text paragraphs, P1-P30)
 │    ├── Olivia Tutor (keyword detection, coverage gap prompts)
 │    ├── Gemini 3.1 Pro Preview (extraction → metrics + scores)
 │    └── 152 coverage targets across all paragraphs
 │
 └── Main Module (200 structured questions, 5 sections)
      ├── Demographics (Q1-Q34)   → 7 logic jump triggers
      ├── Do Not Wants (Q35-Q67)  → Dealbreaker severity 1-5
      ├── Must Haves (Q68-Q100)   → Importance Likert 1-5
      ├── Trade-offs (TQ1-TQ50)   → Slider priority weights
      └── General Questions (GQ1-GQ50) → 9 signals → 23 module relevance
           │
           ├── Olivia receives 19 key answers as context
           ├── 3-layer persistence: useState → localStorage → Supabase
           └── Tier Engine calculates confidence 0-100%

DOWNSTREAM
 ├── Tier Calculation (discovery → exploratory → filtered → evaluated → validated → precision)
 ├── Module Relevance (GQ answers determine which of 23 modules matter)
 ├── Report Generation (Gemini extracts, 5 LLMs score, Cristiano judges)
 └── Olivia Chat (GPT-4o with 19-answer context + position/progress)
```

---

## The Paragraphical (P1-P30)

**Source:** `src/data/paragraphs.ts` (canonical), `src/data/paragraphTargets.ts` (coverage targets)

30 free-text paragraphs organized in 6 phases. The user writes naturally; Gemini extracts structured metrics.

### Phase 1: Your Profile (P1-P2)

| # | Title | Coverage Targets | Metric Yield |
|---|-------|-----------------|--------------|
| P1 | Who You Are | age, gender, nationality, household, partner_details, languages, employment_type | 8-12 |
| P2 | Your Life Right Now | current_location, monthly_income, push_factors, timeline, pain_points | 10-15 |

### Phase 2: Do Not Wants (P3)

| # | Title | Coverage Targets | Metric Yield |
|---|-------|-----------------|--------------|
| P3 | Your Dealbreakers | climate_dnw, safety_dnw, legal_dnw, healthcare_dnw, region_dnw, cultural_dnw | 10-20 |

### Phase 3: Must Haves (P4)

| # | Title | Coverage Targets | Metric Yield |
|---|-------|-----------------|--------------|
| P4 | Your Non-Negotiables | internet_speed, medical_access, airport_proximity, language_requirement, visa_type, safety_minimum, housing_type, family_proximity, legal_rights | 10-15 |

### Phase 4: Trade-offs (P5)

| # | Title | Coverage Targets | Metric Yield |
|---|-------|-----------------|--------------|
| P5 | Your Trade-offs | cost_vs_quality, urban_vs_nature, convenience_vs_charm, language_tolerance, weather_vs_priorities | 5-10 signals |

### Phase 5: Module Deep Dives (P6-P28)

One paragraph per module, mapping 1:1 to the 23 category modules:

| # | Title | Module ID | Tier | Metrics |
|---|-------|-----------|------|---------|
| P6 | Safety & Security | safety_security | T1 Survival | 10-12 |
| P7 | Health & Wellness | health_wellness | T1 Survival | 10-15 |
| P8 | Climate & Weather | climate_weather | T1 Survival | 10-12 |
| P9 | Legal & Immigration | legal_immigration | T2 Foundation | 10-15 |
| P10 | Financial & Banking | financial_banking | T2 Foundation | 12-18 |
| P11 | Housing & Real Estate | housing_real_estate | T2 Foundation | 12-15 |
| P12 | Professional & Career | professional_career | T2 Foundation | 12-15 |
| P13 | Technology & Connectivity | technology_connectivity | T3 Infrastructure | 10-12 |
| P14 | Transportation & Mobility | transportation_mobility | T3 Infrastructure | 10-15 |
| P15 | Education & Learning | education_learning | T3 Infrastructure | 8-12 |
| P16 | Social Values & Governance | social_values_governance | T3 Infrastructure | 8-12 |
| P17 | Food & Dining | food_dining | T4 Lifestyle | 10-12 |
| P18 | Shopping & Services | shopping_services | T4 Lifestyle | 8-10 |
| P19 | Outdoor & Recreation | outdoor_recreation | T4 Lifestyle | 10-15 |
| P20 | Entertainment & Nightlife | entertainment_nightlife | T4 Lifestyle | 8-10 |
| P21 | Family & Children | family_children | T5 Connection | 10-15 |
| P22 | Neighborhood & Urban Design | neighborhood_urban_design | T5 Connection | 8-10 |
| P23 | Environment & Community Appearance | environment_community_appearance | T5 Connection | 8-10 |
| P24 | Religion & Spirituality | religion_spirituality | T6 Identity | 6-8 |
| P25 | Sexual Beliefs, Practices & Laws | sexual_beliefs_practices_laws | T6 Identity | 6-8 |
| P26 | Arts & Culture | arts_culture | T6 Identity | 8-10 |
| P27 | Cultural Heritage & Traditions | cultural_heritage_traditions | T6 Identity | 8-10 |
| P28 | Pets & Animals | pets_animals | T6 Identity | 8-10 |

### Phase 6: Your Vision (P29-P30)

| # | Title | Coverage Targets | Metric Yield |
|---|-------|-----------------|--------------|
| P29 | Your Dream Day | morning_routine, afternoon_signals, evening_signals, walkability_narrative, weather_narrative | 5-8 |
| P30 | Anything Else | uncovered_dealbreakers, niche_requirements, emotional_needs, past_experiences, partner_requirements, future_plans | 5-15 |

**Total metric yield:** 100-300 depending on user detail level.

---

## Main Module — All 200 Questions

**Sources:**
- `src/data/questions/main_module.ts` — Q1-Q100
- `src/data/questions/tradeoff_questions.ts` — TQ1-TQ50
- `src/data/questions/general_questions.ts` — GQ1-GQ50

### Section 1: Demographics (Q1-Q34) — 34 Questions

| ID | Question | Type | Options/Notes |
|----|----------|------|---------------|
| Q1 | Nationality/primary citizenship | single-select | 20+ countries |
| Q2 | Dual/multiple citizenships | multi-select | Country list |
| Q3 | Current country of residence | single-select | Country list |
| Q4 | Age range | single-select | 18-24, 25-34, 35-44, 45-54, 55-64, 65-74, 75+ |
| Q5 | Relationship status | single-select | single, in a relationship, married, domestic partnership, divorced, widowed |
| Q6 | Partner relocate with you? | Yes/No | **Skipped if Q5=single** |
| Q7 | Partner need work authorization? | Yes/No | **Skipped if Q5=single OR Q6=false** |
| Q8 | Have children? | Yes/No | Triggers skip of 6 questions if false |
| Q9 | Children's age ranges | multi-select | infant 0-2, toddler 3-5, elementary 6-10, middle 11-13, high school 14-17, adult 18+ |
| Q10 | All children relocate? | Yes/No | **Skipped if Q8=false** |
| Q11 | Children special needs? | Yes/No | **Skipped if Q8=false** |
| Q12 | Highest education | single-select | high school through professional degree |
| Q13 | Skilled trade involvement | multi-select | 12 trades + N/A |
| Q14 | Military status | Yes/No | |
| Q15 | Need military/veteran services? | Yes/No | **Skipped if Q14=false** |
| Q16 | Current employment status | multi-select | 7 options |
| Q17 | Employment plan post-relocation | multi-select | 6 options |
| Q18 | Primary industry | single-select | 21 industries |
| Q19 | Preferred work arrangement | single-select | fully remote, hybrid, in-office, freelance, retired |
| Q20 | Annual household income | single-select | 10 ranges ($25k brackets to $500k+) |
| Q21 | Income maintenance if international | single-select | 0-25% through 100%+, unsure |
| Q22 | Current housing situation | single-select | own, rent, live with family, other |
| Q23 | Current monthly housing cost | single-select | 9 ranges ($500 to $10k+) |
| Q24 | Bedrooms needed | single-select | studio, 1-5+ |
| Q25 | Current area type | single-select | urban core, suburban, small town, rural |
| Q26 | Population of current city | single-select | 8 ranges (under 10k to 5M+) |
| Q27 | Chronic health conditions? | Yes/No | |
| Q28 | Specific medical conditions | multi-select | **Skipped if Q27=false.** 50+ specialties |
| Q29 | Daily transportation modes | multi-select | 15 modes |
| Q30 | Have pets relocating? | Yes/No | Triggers skip of 4 questions if false |
| Q31 | Pet types | multi-select | **Skipped if Q30=false.** 8 types |
| Q32 | Breed import restrictions concern? | Yes/No | **Skipped if Q30=false** |
| Q33 | Languages spoken fluently | multi-select | Language list |
| Q34 | Relocation timeline | single-select | immediate, 6 months, 1-2 years, 2+ years, exploring |

### Section 2: Do Not Wants — Dealbreakers (Q35-Q67) — 33 Questions

All are **Dealbreaker Slider** type (severity scale 1-5). Severity 5 = hard elimination wall.

| ID | Dealbreaker Topic |
|----|-------------------|
| Q35 | Extreme heat (regularly >35C/95F) |
| Q36 | Extreme cold (regularly <-10C/14F) |
| Q37 | High humidity / tropical climate |
| Q38 | Natural disaster risk |
| Q39 | Severe air pollution |
| Q40 | Water quality / shortage |
| Q41 | Language barrier |
| Q42 | Restrictive social / religious laws |
| Q43 | Lack of diversity |
| Q44 | Hostility toward foreigners |
| Q45 | Gender-based / LGBTQ+ discrimination |
| Q46 | Religious intolerance |
| Q47 | Poor healthcare system |
| Q48 | Unreliable infrastructure |
| Q49 | Poor internet / telecommunications |
| Q50 | High taxes without services |
| Q51 | High cost of living without quality of life |
| Q52 | Unstable economy / volatile currency |
| Q53 | Authoritarian / non-democratic government |
| Q54 | Systemic corruption / unreliable legal system |
| Q55 | Political instability / civil unrest |
| Q56 | High crime / personal safety |
| Q57 | Lack of personal safety for women / minorities |
| Q58 | Complex visa / residency process |
| Q59 | Car-dependent lifestyle |
| Q60 | Poor public transportation |
| Q61 | Lack of career opportunities |
| Q62 | Lack of access to foods / dietary needs |
| Q63 | Isolation from family / friends |
| Q64 | Limited education for children — **Skipped if Q8=false** |
| Q65 | Limited airport / travel connectivity |
| Q66 | Noise pollution / overcrowding |
| Q67 | Lack of outdoor recreation / green spaces |

### Section 3: Must Haves — Non-Negotiables (Q68-Q100) — 33 Questions

All are **Likert-Importance** type (1-5 scale: 1=not important, 5=essential).

| ID | Must Have Topic |
|----|----------------|
| Q68 | English (or primary language) widely spoken |
| Q69 | Welcoming attitude toward newcomers |
| Q70 | Job opportunities in professional field |
| Q71 | Ability to legally work |
| Q72 | Reasonable / affordable cost of living |
| Q73 | Affordable housing availability |
| Q74 | Stable economy / reliable currency |
| Q75 | Strong legal protection for foreigners / property rights |
| Q76 | Quality healthcare / medical facilities |
| Q77 | Low crime rate / strong personal safety |
| Q78 | Political stability / democratic governance |
| Q79 | Clean environment (air, water, streets) |
| Q80 | Good air quality |
| Q81 | Reliable high-speed internet / telecommunications |
| Q82 | Reliable utilities (electricity, water, gas) |
| Q83 | Good public transportation |
| Q84 | Walkable neighborhoods |
| Q85 | Proximity to international airport |
| Q86 | Outdoor recreation / nature / green spaces |
| Q87 | Vibrant food scene / diverse dining |
| Q88 | Cultural activities (museums, theater, arts) |
| Q89 | Fitness facilities / sports infrastructure |
| Q90 | Nightlife / entertainment options |
| Q91 | Good education system (you OR children) — **NOT skipped when no children** (intentional: says "for you OR your children") |
| Q92 | Professional networking / career development |
| Q93 | Family-friendly with child resources — **Skipped if Q8=false** |
| Q94 | Expat / international community |
| Q95 | Religious / spiritual community access |
| Q96 | Pet-friendly environment — **Skipped if Q30=false** |
| Q97 | Climate / weather matching lifestyle |
| Q98 | Overall happiness / life satisfaction of residents |
| Q99 | Community embracing diversity / inclusion |
| Q100 | Proximity to family / friends / support network |

### Section 4: Trade-offs (TQ1-TQ50) — 50 Questions

All are **Slider** type with left/right anchors (except TQ50 which is text).

#### Safety vs. Lifestyle (TQ1-TQ6)
| ID | Trade-off |
|----|-----------|
| TQ1 | Higher cost of living for better safety |
| TQ2 | Less exciting city for family safety |
| TQ3 | Stricter laws / less freedom for low crime / political stability |
| TQ4 | Moderate safety concerns for world-class healthcare |
| TQ5 | Safe isolated town vs. vibrant risky city |
| TQ6 | Mild political instability for better weather / cost |

#### Cost vs. Quality (TQ7-TQ12)
| ID | Trade-off |
|----|-----------|
| TQ7 | Pay 30-50% more for excellent infrastructure / healthcare |
| TQ8 | Smaller home for walkable neighborhood |
| TQ9 | Cheaper city average food vs. expensive excellent food scene |
| TQ10 | Sacrifice international shopping for lower cost |
| TQ11 | Accept higher taxes for excellent public services |
| TQ12 | Live farther from center for larger home / longer commute |

#### Climate vs. Opportunity (TQ13-TQ18)
| ID | Trade-off |
|----|-----------|
| TQ13 | Tolerate disliked climate for career opportunities |
| TQ14 | Fewer sunshine days for stronger professional network |
| TQ15 | Perfect weather rural vs. imperfect thriving metropolis |
| TQ16 | Harsh winters for best education options — **Skipped if Q8=false** |
| TQ17 | Sacrifice beach / mountain access for better infrastructure |
| TQ18 | Natural disaster risk for city excelling in everything else |

#### Career & Financial vs. Lifestyle (TQ19-TQ24)
| ID | Trade-off |
|----|-----------|
| TQ19 | Significant pay cut for dramatically better quality of life |
| TQ20 | Give up career advancement for lifestyle values match |
| TQ21 | Accept less favorable tax situation |
| TQ22 | Work in different time zone for dream location |
| TQ23 | Fewer professional opportunities for stronger community |
| TQ24 | Sacrifice financial growth for immediate quality of life |

#### Social & Cultural vs. Practical (TQ25-TQ30)
| ID | Trade-off |
|----|-----------|
| TQ25 | Live without speaking language for everything else perfect |
| TQ26 | Culturally unfamiliar environment over comfortable expat bubble |
| TQ27 | Sacrifice proximity to family / friends |
| TQ28 | Less diverse community for perfect safety / cost / climate |
| TQ29 | Limited nightlife for exceptional daytime lifestyle |
| TQ30 | Visible minority in otherwise perfect city |

#### Healthcare & Wellness vs. Other (TQ31-TQ36)
| ID | Trade-off |
|----|-----------|
| TQ31 | Longer commute to hospitals for better daily quality |
| TQ32 | Excellent public healthcare but less personal freedom |
| TQ33 | Sacrifice cutting-edge medical tech for better air quality / less stress |
| TQ34 | Higher out-of-pocket healthcare for better weather / outdoor activity |
| TQ35 | Fewer wellness amenities for stronger community health outcomes |
| TQ36 | Farther from nature for closer to top-tier medical facilities |

#### Housing & Neighborhood vs. Location (TQ37-TQ42)
| ID | Trade-off |
|----|-----------|
| TQ37 | Less desirable home for perfect neighborhood |
| TQ38 | Rent instead of own to live in beloved city |
| TQ39 | Sacrifice modern design for historic charming neighborhood |
| TQ40 | Noisier busier neighborhood for walkability / proximity |
| TQ41 | Less green space for better public transit |
| TQ42 | Less aesthetically pleasing for exceptional community / culture |

#### Freedom & Values vs. Convenience (TQ43-TQ50)
| ID | Trade-off |
|----|-----------|
| TQ43 | More bureaucracy for stronger civil liberties |
| TQ44 | Religiously conservative area for best family environment / lowest cost |
| TQ45 | Sacrifice access to substances for safer family-friendly environment |
| TQ46 | Internet censorship for location excelling in other areas |
| TQ47 | Weaker environmental regulations for stronger economic opportunities |
| TQ48 | Limited pet-friendliness for otherwise perfect city — **Skipped if Q30=false** |
| TQ49 | Limited cultural heritage / traditions for modern efficient comfort |
| TQ50 | **TEXT:** "If you could ONLY optimize for THREE things... what would your three be?" |

### Section 5: General Questions (GQ1-GQ50) — 50 Questions

#### Household & Decision Dynamics (GQ1-GQ5)
| ID | Question | Type |
|----|----------|------|
| GQ1 | Primary decision-maker | single-select (5 options) |
| GQ2 | Partner/household alignment — **Skipped if Q5=single** | slider |
| GQ3 | Regions/countries/cities most drawn to | text |
| GQ4 | Family obligations affect relocation? | Yes/No |
| GQ5 | Types of obligations and travel frequency — **Skipped if GQ4=false** | text |

#### Personality & Psychology (GQ6-GQ12)
| ID | Question | Type |
|----|----------|------|
| GQ6 | Risk approach | single-select (5 options) |
| GQ7 | Handling uncertainty/change | single-select (5 options) |
| GQ8 | PRIMARY reason for relocation | single-select (16 options) |
| GQ9 | Overall risk tolerance | slider |
| GQ10 | Openness to lifestyle experimentation | slider |
| GQ11 | Pace of life preference | single-select (5 options) |
| GQ12 | Preferred social style | single-select (5 options) |

#### Readiness & Key Priorities (GQ13-GQ17)
| ID | Question | Type |
|----|----------|------|
| GQ13 | International living experience | single-select (5 options) |
| GQ14 | Religious/spiritual practice importance | **Likert 1-5** (module signal) |
| GQ15 | Budget allocation percentages | text |
| GQ16 | Biggest relocation fears | multi-select (10 options) |
| GQ17 | Familiar vs. adventurous preference | slider |

#### Cultural Adaptation & Integration (GQ18-GQ23)
| ID | Question | Type |
|----|----------|------|
| GQ18 | Tolerance for cultural differences | slider |
| GQ19 | Comfort with language barriers | slider |
| GQ20 | Expat community vs. local integration | slider |
| GQ21 | Timeline for social integration | single-select (5 options) |
| GQ22 | Interest in cultural bridge-building | slider |
| GQ23 | Willingness to adapt to social norms | slider |

#### Social Identity & Community (GQ24-GQ30)
| ID | Question | Type |
|----|----------|------|
| GQ24 | Ideal social environment | single-select (5 options) |
| GQ25 | Large events vs. intimate gatherings | slider |
| GQ26 | NEEDED communities/hobbies/subcultures | text |
| GQ27 | Neighborhood with similar life stage | **Likert 1-5** |
| GQ28 | Privacy vs. openness in community | slider |
| GQ29 | Social support systems needed | multi-select (8 options) |
| GQ30 | Local roots vs. transient lifestyle | **Likert 1-5** |

#### Lifestyle Philosophy (GQ31-GQ36)
| ID | Question | Type |
|----|----------|------|
| GQ31 | Work-life balance stance | slider |
| GQ32 | Weekend preference | single-select (6 options) |
| GQ33 | Ideal noise level | slider |
| GQ34 | Ideal community size | single-select (5 options) |
| GQ35 | Seasonal changes impact on mood | **Likert 1-5** |
| GQ36 | Environmental sustainability importance | **Likert 1-5** |

#### Vision, Planning & Living Preferences (GQ37-GQ44)
| ID | Question | Type |
|----|----------|------|
| GQ37 | Long-term settlement plans | single-select (5 options) |
| GQ38 | Permanent or temporary intentions | single-select (5 options) |
| GQ39 | Importance of exit strategy | **Likert 1-5** |
| GQ40 | Retirement timeline consideration | single-select (5 options) |
| GQ41 | Food culture importance | **Likert 1-5** (module signal) |
| GQ42 | Settling period tolerance | single-select (5 options) |
| GQ43 | Backup plan approach | single-select (5 options) |
| GQ44 | Dwelling type preference | single-select (6 options, module signal) |

#### Lifestyle & Values Preferences (GQ45-GQ50)
| ID | Question | Type |
|----|----------|------|
| GQ45 | Living setting preference | single-select (5 options, module signal) |
| GQ46 | Firearm/weapon laws alignment | **Likert 1-5** (module signal) |
| GQ47 | Live music/performing arts importance | **Likert 1-5** (module signal) |
| GQ48 | Sports/fitness/outdoor recreation importance | **Likert 1-5** (module signal) |
| GQ49 | LGBTQ+ acceptance importance | **Likert 1-5** (module signal) |
| GQ50 | Political/social values alignment | **Likert 1-5** (module signal) |

---

## Logic Jump Rules (7 Conditional Skips)

**Source:** `src/components/Questionnaire/questionnaireData.ts` — `LOGIC_JUMPS` array, `getSkippedQuestions()` function

These rules cross section boundaries. A single Demographics answer can skip questions in DNW, MH, Trade-offs, AND General Questions.

| # | Trigger | Condition | Questions Skipped | Sections Affected |
|---|---------|-----------|-------------------|-------------------|
| 1 | Q5 (Relationship) | = `'single'` | Q6, Q7, GQ2 | Demographics, General |
| 2 | Q6 (Partner relocate) | = `'false'` | Q7 | Demographics |
| 3 | Q8 (Children) | = `'false'` | Q9, Q10, Q11, Q64, Q93, TQ16 | Demographics, DNW, MH, Trade-offs |
| 4 | Q14 (Military) | = `'false'` | Q15 | Demographics |
| 5 | Q27 (Health conditions) | = `'false'` | Q28 | Demographics |
| 6 | Q30 (Pets) | = `'false'` | Q31, Q32, Q96, TQ48 | Demographics, MH, Trade-offs |
| 7 | GQ4 (Family obligations) | = `'false'` | GQ5 | General |

### Cross-Section Impact Summary

```
Q8=false (no children) skips across 4 sections:
  Demographics: Q9, Q10, Q11
  DNW:          Q64 (limited education for children)
  Must Haves:   Q93 (family-friendly with child resources)
  Trade-offs:   TQ16 (harsh winters for best education)

Q30=false (no pets) skips across 3 sections:
  Demographics: Q31, Q32
  Must Haves:   Q96 (pet-friendly environment)
  Trade-offs:   TQ48 (limited pet-friendliness)

Q5=single skips across 2 sections:
  Demographics: Q6, Q7
  General:      GQ2 (partner alignment)
```

### Important Design Note

**Q91 (Good education system) is intentionally NOT skipped when Q8=false.** The question text reads "for you OR your children" — education matters for adult learners too.

---

## Olivia Context Builder (19 Key Answers)

**Source:** `src/components/Questionnaire/MainQuestionnaire.tsx` (lines 148-197)

Olivia receives a structured context object every time the user navigates to a new question. This context includes:

### 7 Demographic Context Keys

| Key | Question | What It Tells Olivia |
|-----|----------|---------------------|
| `q1` | Country of residence | User's current location context |
| `q4` | Age range | Life stage, visa eligibility, healthcare needs |
| `q5` | Relationship status | Solo vs. partner relocation dynamics |
| `q8` | Has children | Family-specific guidance needed |
| `q16` | Employment status | Career vs. retirement vs. student context |
| `q20` | Household income | Budget sensitivity for recommendations |
| `q30` | Has pets | Pet-specific logistics relevant |

### 9 General Questions Lifestyle/Values Signals

| Key | Question | Downstream Module Relevance |
|-----|----------|-----------------------------|
| `gq14` | Religion importance | religion_spirituality, cultural_heritage |
| `gq41` | Food culture importance | food_dining, shopping_services |
| `gq44` | Dwelling type preference | housing_property, neighborhood |
| `gq45` | Setting preference (urban/rural) | neighborhood, transportation, housing |
| `gq46` | Gun law importance | safety_security, social_values |
| `gq47` | Entertainment importance | entertainment_nightlife, arts_culture |
| `gq48` | Sports/fitness importance | outdoor_recreation, health_wellness |
| `gq49` | LGBTQ+ acceptance importance | sexual_beliefs, social_values, safety |
| `gq50` | Values alignment importance | social_values_governance, legal_immigration |

### 3 Positional Context Fields

| Field | Example Value | Purpose |
|-------|---------------|---------|
| `positionLabel` | "Question 5 of 34 in Demographics" | Olivia knows where user is |
| `progressLabel` | "12 of 200 total questions answered (6%)" | Olivia knows overall progress |
| `skippedInfo` | "5 questions auto-skipped: no children..." | Olivia knows why questions were removed |

### Context Flow

```
User navigates to question
    ↓
MainQuestionnaire.tsx extracts 19 keys from answer state
    ↓
Builds OliviaContext object {positionLabel, progressLabel, relevantAnswers, skippedInfo}
    ↓
Passes to discoveryData.buildOliviaPrompt()
    ↓
Olivia system prompt includes all 19 answers + position + progress + skip reasons
    ↓
GPT-4o responds with contextually-aware guidance
```

---

## GQ Signal → Module Relevance Engine

**Source:** `src/lib/tierEngine.ts` — `deriveModuleRelevanceFromGQ()`

9 General Questions act as **module relevance signals**. Their Likert answers (1-5) determine which of the 23 downstream deep-dive modules are most important for this user.

### Signal Mapping

| GQ Signal | Likert Value | Modules Affected | Relevance Score |
|-----------|-------------|------------------|-----------------|
| GQ14 (Religion) | 1-5 | religion_spirituality, cultural_heritage_traditions | likert × 0.2 |
| GQ41 (Food) | 1-5 | food_dining, shopping_services | likert × 0.2 |
| GQ44 (Dwelling) | select | housing_property, neighborhood_urban_design | 0.7 baseline |
| GQ45 (Setting) | select | neighborhood_urban_design, transportation_mobility, housing_property | 0.7 baseline |
| GQ46 (Gun laws) | 1-5 | safety_security, social_values_governance, legal_immigration | likert × 0.2 |
| GQ47 (Entertainment) | 1-5 | entertainment_nightlife, arts_culture | likert × 0.2 |
| GQ48 (Sports) | 1-5 | outdoor_recreation, health_wellness | likert × 0.2 |
| GQ49 (LGBTQ+) | 1-5 | sexual_beliefs_practices_laws, social_values_governance, safety_security | likert × 0.2 |
| GQ50 (Values) | 1-5 | social_values_governance, legal_immigration | likert × 0.2 |

### Conversion Formula

```
Likert answers:  score = likert_value × 0.2
  1 (not important)  → 0.2 relevance
  2 (slightly)       → 0.4 relevance
  3 (moderately)     → 0.6 relevance
  4 (very)           → 0.8 relevance
  5 (extremely)      → 1.0 relevance

Select answers:  score = 0.7 baseline (presence implies relevance)

Merge rule: max(paragraphical_score, gq_score) per module
  → If Paragraphical already scored a module at 0.9 and GQ gives 0.6, keep 0.9
  → If Paragraphical scored 0.3 and GQ gives 0.8, upgrade to 0.8

Filter: Only modules with relevance ≥ 0.5 are shown to the user as recommended
```

### Example

```
User answers GQ48 (Sports/fitness) = 5 (extremely important)
  → outdoor_recreation relevance = 5 × 0.2 = 1.0
  → health_wellness relevance = 5 × 0.2 = 1.0
  → Both modules flagged as HIGH PRIORITY for this user

User answers GQ14 (Religion) = 1 (not important)
  → religion_spirituality relevance = 1 × 0.2 = 0.2
  → cultural_heritage relevance = 1 × 0.2 = 0.2
  → Both modules below 0.5 threshold → NOT recommended (user can still opt in)
```

---

## 3-Layer Persistence Architecture

**Source:** `src/hooks/useQuestionnaireState.ts`

### Storage Keys

```
Demographics:     q1, q2, q3, ... q34
Do Not Wants:     q35, q36, q37, ... q67
Must Haves:       q68, q69, q70, ... q100
Trade-offs:       tq1, tq2, tq3, ... tq50
General:          gq1, gq2, gq3, ... gq50
```

### Three Layers

| Layer | Mechanism | Speed | Durability | Trigger |
|-------|-----------|-------|------------|---------|
| 1. In-memory | `useState` | Instant | Session only | Every keystroke/selection |
| 2. localStorage | `window.localStorage` | Instant | Survives refresh | Every answer change |
| 3. Supabase | `UserContext.dispatch()` | Debounced 1500ms | Permanent (authenticated) | 1.5s after last change |

### Answer Type Conversions

```
Demographics (Q1-Q34):  Record<string, string|number|boolean> in UserContext
Do Not Wants (Q35-Q67): Converted to DNWAnswer[] → { questionId, value, severity: 1-5 }
Must Haves (Q68-Q100):  Converted to MHAnswer[] → { questionId, value, importance: 1-5 }
Trade-offs (TQ1-TQ50):  Record<string, number> with "tq" prefix
General (GQ1-GQ50):     Record<string, string|number> with "gq" prefix
```

### Navigation Functions

| Function | Behavior |
|----------|----------|
| `goNext()` | Move to next visible (non-skipped) question; auto-mark section complete if at end; unlock next section |
| `goPrev()` | Move to previous visible question |
| `goToSection(index)` | Jump to start of section (if unlocked) |
| Resume on load | Find first unanswered visible question, resume from there |

### Section Unlock Sequence

```
Demographics → DNW → Must Haves → Trade-offs → General Questions
(sequential unlock — must complete each to unlock next)
```

---

## Tier & Confidence Engine

**Source:** `src/lib/tierEngine.ts`

### Tier Progression

| Tier | Name | Requirements | Cumulative Confidence |
|------|------|-------------|----------------------|
| 1 | discovery | No data | 0% |
| 2 | exploratory | Demographics filled | 10% |
| 3 | filtered | + DNW completed | 25% (10+15) |
| 4 | evaluated | + MH completed | 35% (10+15+10) |
| 5 | validated | + General Questions | 55% (10+15+10+20) |
| 6 | precision | + Mini modules | Up to 100% |

### Confidence Calculation (Additive)

```
Component                        Gain
────────────────────────────────────────
Paragraphical (P1-P30)          +35%
Demographics (Q1-Q34)           +10%
Do Not Wants (Q35-Q67)          +15%
Must Haves (Q68-Q100)           +10%
General Questions (GQ1-GQ50)    +20%
Mini Modules (23 × 0.5% each)  +0.5% per module (capped at +10%)
────────────────────────────────────────
Maximum                          100%
```

### Next Steps Engine

`recalculateTier()` returns an ordered list of recommended actions:

```
Priority  Action                      Confidence Gain  Est. Time
────────────────────────────────────────────────────────────────
1         Complete Paragraphical       +35%             30-60 min
2         Complete General Questions   +20%             ~30 min
3         Complete Do Not Wants        +15%             ~10 min
4         Complete Demographics        +10%             ~5 min
5         Complete Must Haves          +10%             ~10 min
6         Complete Mini Modules        +0.5% each       ~5-10 min each

Sorting: Incomplete items first, then by confidence gain descending
```

---

## Olivia Tutor — Coverage Target Monitoring

**Source:** `src/hooks/useOliviaTutor.ts`, `src/data/paragraphTargets.ts`

### Trigger Rules

| Rule | Value |
|------|-------|
| Debounce | 3 seconds pause OR every 150 words |
| Minimum words before first interjection | 80 |
| Maximum interjections per paragraph | 2 |
| Dismissed interjections | Never repeat (per-paragraph memory) |

### How It Works

```
User writes in paragraph text area
    ↓
useOliviaTutor hook monitors text changes (debounced 3s)
    ↓
checkKeywordCoverage() scans text against paragraph's coverage targets
    ↓
Each target has keyword groups (e.g., "age" → ['age', 'years old', 'born in', '20s', '30s'])
    ↓
Keywords found → target marked as COVERED
Keywords missing after 80+ words → MISSING target identified
    ↓
Template interjection for most important missing target is surfaced
    ↓
Olivia bubble displays: "Have you thought about [missing topic]?"
    ↓
User dismisses → target marked as dismissed, won't repeat
User continues writing → coverage re-evaluated on next trigger
```

### Output Interface

```typescript
{
  interjection: string | null,    // Current Olivia suggestion (null = nothing to say)
  pendingCount: number,           // Number of missing coverage targets
  coveredTargets: string[],       // Target IDs that user addressed
  missingTargets: string[],       // Target IDs still missing
}
```

### 152 Coverage Targets

Distributed across all 30 paragraphs. Each target has:
- `id`: Unique identifier (e.g., `"age"`, `"climate_dnw"`, `"internet_speed"`)
- `label`: Human-readable name
- `keywords[]`: Array of strings to match against user text
- Template interjection: Pre-written Olivia prompt for this target

---

## Complete Data Flow Diagram

```
╔══════════════════════════════════════════════════════════════════════╗
║                        USER INPUT LAYER                             ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ┌─────────────────────┐    ┌──────────────────────────────────┐    ║
║  │   PARAGRAPHICAL     │    │        MAIN MODULE               │    ║
║  │   30 Paragraphs     │    │        200 Questions             │    ║
║  │   P1-P30            │    │                                  │    ║
║  │   Free-text input   │    │  ┌──────────┐ ┌──────────────┐  │    ║
║  │                     │    │  │Demo Q1-34│ │ DNW Q35-67   │  │    ║
║  │   Olivia Tutor:     │    │  │(7 jumps) │ │ (severity)   │  │    ║
║  │   - 152 targets     │    │  └──────────┘ └──────────────┘  │    ║
║  │   - keyword detect  │    │  ┌──────────┐ ┌──────────────┐  │    ║
║  │   - 3s debounce     │    │  │MH Q68-100│ │ TQ tq1-50   │  │    ║
║  │   - max 2 prompts   │    │  │(likert)  │ │ (sliders)   │  │    ║
║  │                     │    │  └──────────┘ └──────────────┘  │    ║
║  │                     │    │  ┌──────────────────────────┐   │    ║
║  │                     │    │  │ GQ gq1-50 (9 signals)   │   │    ║
║  │                     │    │  └──────────────────────────┘   │    ║
║  └─────────┬───────────┘    └──────────────┬─────────────────┘    ║
║            │                                │                       ║
╠════════════╪════════════════════════════════╪═══════════════════════╣
║            │         PERSISTENCE LAYER      │                       ║
║            │    ┌───────────────────────────┐│                       ║
║            │    │ 1. useState (instant)     ││                       ║
║            │    │ 2. localStorage (instant) ││                       ║
║            │    │ 3. Supabase (1500ms)     ││                       ║
║            │    └───────────────────────────┘│                       ║
╠════════════╪════════════════════════════════╪═══════════════════════╣
║            │       PROCESSING LAYER         │                       ║
║            ▼                                ▼                       ║
║  ┌─────────────────────┐    ┌──────────────────────────────────┐   ║
║  │ Gemini 3.1 Pro      │    │       OLIVIA (GPT-4o)            │   ║
║  │ Preview             │    │                                  │   ║
║  │ - Extract metrics   │    │  Receives:                       │   ║
║  │ - Score locations   │    │  - 7 demographic keys            │   ║
║  │ - Recommend cities  │    │  - 9 GQ lifestyle signals        │   ║
║  │ - Source data       │    │  - Position label                │   ║
║  └─────────┬───────────┘    │  - Progress label                │   ║
║            │                │  - Skip reasons                  │   ║
║            │                └──────────────┬─────────────────────┘  ║
║            │                               │                        ║
║            ▼                               │                        ║
║  ┌──────────────────────────────────┐      │                        ║
║  │        TIER ENGINE               │◄─────┘                       ║
║  │                                  │                               ║
║  │  Confidence: 0-100%              │                               ║
║  │  Tier: discovery → precision     │                               ║
║  │                                  │                               ║
║  │  GQ Signal → Module Relevance:   │                               ║
║  │  9 signals → 23 modules          │                               ║
║  │  Formula: likert × 0.2           │                               ║
║  │  Merge: max(para, gq)           │                               ║
║  │  Threshold: ≥ 0.5 shown         │                               ║
║  └─────────┬────────────────────────┘                               ║
║            │                                                         ║
║            ▼                                                         ║
║  ┌──────────────────────────────────┐                               ║
║  │     5-LLM SCORING PANEL         │                               ║
║  │  Sonnet 4.6 | GPT-4o | Gemini   │                               ║
║  │  Grok 4.1 | Sonar Reasoning Pro │                               ║
║  │            ↓                     │                               ║
║  │  CRISTIANO JUDGE (Opus 4.5)     │                               ║
║  │  Consensus on stdDev > 15       │                               ║
║  └─────────┬────────────────────────┘                               ║
║            │                                                         ║
║            ▼                                                         ║
║  ┌──────────────────────────────────┐                               ║
║  │     FINAL REPORT                 │                               ║
║  │  35-100 pages (by tier)          │                               ║
║  │  Top 3 Cities / Towns / Hoods    │                               ║
║  │  Confidence score                │                               ║
║  │  Next steps recommendations      │                               ║
║  └──────────────────────────────────┘                               ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Proof: Every Question Is Evaluated

### Paragraphical Questions (P1-P30)

Every paragraph's text is:
1. **Monitored in real-time** by `useOliviaTutor` (keyword detection against 152 coverage targets)
2. **Prompted by Olivia** when targets are missed (max 2 interjections per paragraph)
3. **Extracted by Gemini 3.1 Pro Preview** into numbered metrics
4. **Scored by 5 LLMs** against candidate locations
5. **Judged by Cristiano** (Opus 4.5) for consensus

### Main Module Questions (Q1-Q100, TQ1-TQ50, GQ1-GQ50)

Every answer is:
1. **Persisted** through 3 layers (state → localStorage → Supabase)
2. **Skip-filtered** by 7 logic jump rules (only irrelevant questions removed)
3. **Fed to Olivia** via 19 context keys (7 demo + 9 GQ + 3 positional)
4. **Used in tier calculation** (each section adds to confidence %)
5. **9 GQ signals map to 23 modules** via the relevance engine
6. **DNW answers create elimination walls** (severity 5 = instant city rejection)
7. **MH answers create requirement scores** (importance 5 = essential feature)
8. **Trade-off answers weight competing priorities** (slider position = priority direction)

**Zero questions are orphaned. Every answer flows downstream to scoring, Olivia context, tier calculation, or module relevance.**

---

## Key Source Files

| File | Purpose |
|------|---------|
| `src/data/questions/main_module.ts` | Q1-Q100 definitions |
| `src/data/questions/tradeoff_questions.ts` | TQ1-TQ50 definitions |
| `src/data/questions/general_questions.ts` | GQ1-GQ50 definitions |
| `src/components/Questionnaire/questionnaireData.ts` | LOGIC_JUMPS, getSkippedQuestions(), section config |
| `src/hooks/useQuestionnaireState.ts` | Navigation, persistence, skip filtering |
| `src/components/Questionnaire/MainQuestionnaire.tsx` | Olivia context builder (lines 148-197) |
| `src/components/Discovery/discoveryData.ts` | buildOliviaPrompt() function |
| `src/data/paragraphs.ts` | P1-P30 canonical definitions |
| `src/data/paragraphTargets.ts` | 152 coverage targets with keywords |
| `src/hooks/useOliviaTutor.ts` | Layer 2 keyword detection engine |
| `src/lib/tierEngine.ts` | Tier calculation, confidence, GQ→module relevance |
| `api/paragraphical.ts` | Gemini extraction endpoint |

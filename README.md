# CLUES Intelligence — Main Platform

## Overview

CLUES Intelligence is a relocation and lifestyle intelligence platform that helps users find their **Best City, Best Town, and Best Neighborhood** anywhere in the world. The system uses AI-powered analysis across 23 life categories to deliver personalized, data-driven recommendations.

This is **not** a law-based app (unlike LifeScore, which focuses on legal freedom metrics). CLUES Main is a **quality-of-life fit** platform — scoring how well a location matches a specific user's lifestyle, priorities, and needs.

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **AI:** Google Gemini 3.1 Pro Preview (reasoning engine with thinking_level: high + Google Search grounding), Cristiano Judge system (Opus)
- **Research:** Tavily (search + research APIs)
- **Reports:** Gamma (100-page visual report), HeyGen (video), InVideo (cinematic)
- **Styling:** Dark-mode-first, WCAG 2.1 AA compliant in both dark and light mode (see CLAUDE.md)

---

## The 23 Category System (Funnel Flow)

### TIER 1: SURVIVAL (3 categories)
1. **Safety & Security** — crime rates, political stability, emergency services, personal safety
2. **Health & Wellness** — healthcare system quality, medical access, wellness infrastructure
3. **Climate & Weather** — temperature, humidity, sunshine, natural disasters, air quality

### TIER 2: FOUNDATION (4 categories)
4. **Legal & Immigration** — visa types, residency paths, bureaucracy, rights
5. **Financial & Banking** — cost of living, taxes, banking access, currency, investment
6. **Housing & Real Estate** — cost, availability, quality, rental vs ownership, neighborhoods
7. **Professional & Career** — career opportunities, remote work, business climate

### TIER 3: INFRASTRUCTURE (4 categories)
8. **Technology & Connectivity** — internet speed, 5G, tech infrastructure, digital services
9. **Transportation & Mobility** — public transit, walkability, bike infrastructure, airports
10. **Education & Learning** — schools, universities, language courses, professional development
11. **Social Values & Governance** — civic engagement, governance quality, social norms

### TIER 4: LIFESTYLE (4 categories)
12. **Food & Dining** — restaurants, grocery, local cuisine, dietary options, cost
13. **Shopping & Services** — retail access, services, consumer infrastructure
14. **Outdoor & Recreation** — parks, hiking, beaches, mountains, green spaces, wildlife
15. **Entertainment & Nightlife** — bars, clubs, live music, events, festivals, cinema

### TIER 5: CONNECTION (3 categories)
16. **Family & Children** — childcare, schools, family activities, safety, healthcare for kids
17. **Neighborhood & Urban Design** — walkability, aesthetics, community feel, urban planning
18. **Environment & Community Appearance** — cleanliness, green space, infrastructure quality

### TIER 6: IDENTITY (5 categories)
19. **Religion & Spirituality** — places of worship, communities, meditation, retreats
20. **Sexual Beliefs, Practices & Laws** — LGBTQ+ rights, reproductive rights, personal freedom
21. **Arts & Culture** — museums, galleries, music, theater, cultural events, history
22. **Cultural Heritage & Traditions** — local customs, heritage preservation, cultural identity
23. **Pets & Animals** — pet-friendly housing, vet access, parks, import regulations

**Distribution:** 3-4-4-4-3-5 across 6 tiers (Survival > Foundation > Infrastructure > Lifestyle > Connection > Identity). Survival is the baseline — non-negotiable for any relocation.

---

## The User Funnel

CLUES is designed as a progressive intelligence funnel. Users enter at any point, and the system gets smarter as they engage deeper.

### Entry Points (Not Sequential — User Chooses)

1. **Paragraphical (Optional)** — User writes freely about their life, priorities, dreams, dealbreakers. AI extracts metrics, weights, and preferences. Generates an initial report with top 3 Cities, 3 Towns, 3 Neighborhoods. Fast, intuitive, surprisingly powerful.

2. **Main Module (Optional)** — Structured questionnaire covering all 23 categories. More systematic data collection. Same output format: top 3/3/3.

3. **Both (Best Results)** — Paragraphical + Main Module together yields the richest data and lowest margin of error. The system cross-references free-form narrative with structured answers.

### The Intelligence Engine

After entry point(s) are complete, the system has initial data. Here's what happens next:

- **Margin of Error Calculation** — The system analyzes ALL raw data (metrics, weights, judge reports) and calculates a confidence/margin of error for the current recommendations
- **Holistic User Analysis** — Looks at the specific user's profile, priorities, and data gaps to determine which category modules would most reduce uncertainty
- **Module Recommendations** — Tells the user: "Complete Climate & Weather, Health & Wellness, and Cultural Heritage & Traditions modules to improve your confidence from 65% to 92%." The system doesn't guess which modules matter — it KNOWS based on what data is missing for THIS user
- **Dynamic Weighting** — No fixed weights per category. A retiree doesn't need Education weighted heavily. A family with kids does. Weights emerge from the user's own data

### Module Completion Loop

1. User completes recommended module(s)
2. System re-judges the full report with new data
3. New margin of error calculated (before vs after comparison)
4. Rankings refined — top 3/3/3 may shift
5. New module recommendations generated if confidence still insufficient
6. Repeat until user is satisfied or confidence is high enough

### Final Output

High-confidence report identifying:
- **Best City** (from top 3 candidates)
- **Best Town** (from top 3 candidates)
- **Best Neighborhood** (from top 3 candidates)

---

## Modules as Standalone Products

Each of the 23 category modules is ALSO a **freestanding web app**. This serves three purposes:

1. **Brand Awareness** — Someone discovers CLUES through the Climate & Weather module or Food & Dining module, has fun with it, discovers the full platform
2. **Revenue** — Individual modules have value on their own and can be monetized independently
3. **Data Collection** — Every standalone module interaction feeds back into the intelligence engine if the user later joins the full platform

Many modules are inherently fun and educational on their own — you don't need to be relocating to enjoy exploring Climate data or comparing Food scenes across cities.

---

## LifeScore Integration

LifeScore's freedom metrics are now integrated into the Social Values & Governance category module. It is unique:
- It has its own 100-metric system already built
- It focuses specifically on legal freedom and personal liberty
- **No dual legal/enforcement scoring in CLUES Main** — that's a LifeScore-specific concept for law-based analysis
- In the CLUES Main report, LifeScore gets represented **proportionally to how much reliable data we have** — just like every other module
- Its weight for a given user is determined dynamically after Paragraphical/Main Module completion and judge analysis — not predetermined

---

## Paragraphical Metrics Extraction Strategy

### The Two-Layer Data Model

**Layer 1: Field IDs (250-300)** — The raw data layer. These are the discrete, researchable data points stored in Supabase and scored by the LLM pipeline. This is the engine. No token limits apply here because it's structured data, not prose.

**Layer 2: The Report (100 pages MAX)** — The presentation layer. Gamma takes the field ID scores and renders them into a narrative, visual, educational document. 100 pages is the hard ceiling due to:
- LLM-Gamma token limits and timeout risk above 100 pages
- User fatigue — nobody reads 150 pages cover to cover
- Quality over quantity — 100 dense, beautiful pages beats 200 filler pages

### Per-Paragraph Metric Targets

Each of the 30 paragraphs has a **minimum metric yield** and **coverage targets** — the key topics Gemini MUST extract from, even if the user only hints at them. If the user is detailed, more metrics emerge naturally. If they're sparse, Gemini extrapolates baseline needs from context.

See `src/data/paragraphs.ts` for the canonical paragraph definitions (6 phases, 30 paragraphs).

```
PARAGRAPH → CATEGORY MAPPING → MIN METRICS → COVERAGE TARGETS
═══════════════════════════════════════════════════════════════

═══ PHASE 1: YOUR PROFILE (Demographics) ═══

P1: "Who You Are" → Demographics (cross-category) → 8-12 metrics
  Coverage targets:
  - Age (exact or range)
  - Gender
  - Nationality / passport(s)
  - Current citizenship(s)
  - Household composition (single, married, kids, partner, family size)
  - Languages spoken (fluency levels)
  - Employment type (remote, local, hybrid, retired, student, entrepreneur)
  Example metrics:
    M1: Age bracket [Demographics]
    M2: Passport strength index (Henley ranking) [Legal]
    M3: Household size for housing calculations [Housing]
    M4: Remote work requirement → timezone compatibility [Business]

P2: "Your Life Right Now" → Demographics + Financial → 10-15 metrics
  Coverage targets:
  - Current city/country
  - Monthly income (DETECT CURRENCY — never default to USD)
  - Push factors (why leaving: cost, safety, weather, politics, career, etc.)
  - Timeline (urgent vs planning vs exploring)
  - Current pain points that drive the search
  Example metrics:
    M5: Monthly income in detected currency [Financial]
    M6: Timeline urgency (months vs years) [Planning]
    M7: Push factor: cost of living dissatisfaction [Financial]
    M8: Push factor: climate dissatisfaction [Climate]

═══ PHASE 2: DO NOT WANTS (Dealbreakers) ═══

P3: "Your Dealbreakers" → Cross-category elimination → 10-20 metrics
  Coverage targets:
  - Climate extremes that are absolutely unacceptable (humidity, heat, cold)
  - Safety/crime levels that are deal-breaking
  - Political instability or authoritarian regimes
  - Lack of healthcare or specific medical access
  - Internet too slow for work requirements
  - No visa pathway for user's nationality
  - Religious or cultural intolerance
  - Specific countries or regions refused
  - Languages user cannot function in
  NOTE: These are HARD WALLS. Severity-5 dealbreakers eliminate cities instantly
  regardless of other scores. Maps directly to DNW severity tiers in Main Module.
  Example metrics:
    M9: ELIMINATE IF humidity > 80% [Climate DNW]
    M10: ELIMINATE IF violent crime rate > [X] per 100k [Safety DNW]
    M11: ELIMINATE IF no residency pathway for [nationality] [Legal DNW]
    M12: ELIMINATE IF internet avg < [X] Mbps [Technology DNW]
    M13: ELIMINATE IF political instability index > [X] [Safety DNW]

═══ PHASE 3: MUST HAVES (Non-Negotiables) ═══

P4: "Your Non-Negotiables" → Cross-category requirements → 10-15 metrics
  Coverage targets:
  - Minimum internet speed for work
  - Specific medical facilities or specialists needed
  - Airport proximity requirement (within X hours)
  - English widely spoken requirement
  - Specific visa type that must be available
  - Minimum safety rating
  - Housing type that must exist
  - Proximity to family
  - Specific legal rights required
  NOTE: Unlike DNWs (what you reject), these are what you REQUIRE to be present.
  Cities that lack these requirements are penalized heavily or eliminated.
  Example metrics:
    M14: REQUIRE broadband speed ≥ 100 Mbps [Technology MH]
    M15: REQUIRE international airport within 2 hours [Transport MH]
    M16: REQUIRE English widely spoken [Social MH]
    M17: REQUIRE [specific specialist] access within 30min [Healthcare MH]

═══ PHASE 4: TRADE-OFFS (Priority Weighting) ═══

P5: "Your Trade-offs" → Priority weighting signals → 5-10 signals
  Coverage targets:
  - Cost vs quality willingness (pay more for safety? more for location?)
  - Urban vs nature preference when forced to choose
  - Convenience vs charm (modern infrastructure vs historic character)
  - Language barrier tolerance (willing to learn? or English-only?)
  - Weather vs other priorities (sacrifice weather for lower cost?)
  NOTE: This paragraph does NOT produce scored metrics. It produces WEIGHTING
  SIGNALS that tell Gemini how to rank competing metrics when cities score
  differently. E.g., "I'd pay 20% more rent for safety" → weight safety > cost.
  Example signals:
    W1: Safety > Cost of Living (willing to pay premium) [Weight]
    W2: Nature > Nightlife (sacrifice entertainment for outdoors) [Weight]
    W3: Language learning acceptable (open to non-English) [Weight]

═══ PHASE 5: MODULE DEEP DIVES (23 paragraphs, 1:1 with category modules in funnel order) ═══

NOTE: Paragraph numbering follows the funnel order (Survival → Foundation → Infrastructure → Lifestyle → Connection → Identity).
P6-P28 map 1:1 to the 23 category modules. See src/data/paragraphs.ts for the canonical source.

--- TIER 1: SURVIVAL (P6-P8) ---

P6: "Safety & Security" → moduleId: safety_security → 10-12 metrics
  Coverage targets:
  - Violent crime tolerance (rate per 100k)
  - Property crime tolerance
  - Political stability and ideology (progressive, moderate, conservative)
  - Corruption level tolerance
  - Police reliability and emergency services quality
  - Gun laws and gun culture
  - Personal safety (walking at night, women, LGBTQ+, minorities)
  - Neighborhood safety expectations
  Example metrics:
    M18: Violent crime rate below [X] per 100k [Safety]
    M19: Political stability index above [X] [Safety]
    M20: Safe for solo [gender] at night [Safety]
    M21: Corruption Perceptions Index above [X] [Safety]
    M22: Emergency response time under [X] minutes [Safety]

P7: "Health & Wellness" → moduleId: health_wellness → 10-15 metrics
  Coverage targets:
  - Chronic conditions (specific)
  - Regular medications (exact names if mentioned)
  - Specialist access needs (cardiologist, therapist, dentist)
  - Mental health services need
  - Public vs private healthcare preference
  - Health insurance for expats
  - Hospital quality / international accreditation
  - Wellness infrastructure (gyms, spas, yoga studios)
  Example metrics:
    M23: [Specific specialist] availability within 30min [Healthcare]
    M24: [Specific medication] legally available and affordable [Healthcare]
    M25: English-speaking medical professionals [Healthcare]
    M26: Private health insurance under EUR 300/month [Healthcare]
    M27: JCI-accredited hospital within 30 minutes [Healthcare]

P8: "Climate & Weather" → moduleId: climate_weather → 10-12 metrics
  Coverage targets:
  - Temperature range (summer max, winter min — in user's unit C/F)
  - Humidity tolerance (exact threshold if possible)
  - Seasonal preference (4 seasons, 2 seasons, year-round warmth)
  - Sunshine days per year
  - Natural disaster tolerance
  - Air quality sensitivity
  - Rain/snow tolerance
  Example metrics:
    M28: Average summer temperature below [X]C [Climate]
    M29: Average winter temperature above [X]C [Climate]
    M30: Annual humidity below [X]% [Climate]
    M31: Sunshine days above [X] per year [Climate]
    M32: Natural disaster risk index below [X] [Climate]
    M33: Air quality index (PM2.5) below [X] [Climate]

--- TIER 2: FOUNDATION (P9-P12) ---

P9: "Legal & Immigration" → moduleId: legal_immigration → 10-15 metrics
  Coverage targets:
  - Current passport(s) and their strength
  - Visa type interest (digital nomad, retirement, investment, work)
  - Residency pathway length tolerance
  - Bureaucracy tolerance
  - Tax treaty awareness
  - Rule of law / judicial independence
  Example metrics:
    M34: Digital nomad visa available for [nationality] [Legal]
    M35: Residency achievable within 12 months [Legal]
    M36: Tax treaty with [home country] [Legal]
    M37: Bureaucracy efficiency index [Legal]

P10: "Financial & Banking" → moduleId: financial_banking → 12-18 metrics
  Coverage targets:
  - Monthly income (DETECT CURRENCY — never default to USD)
  - Monthly budget tolerance
  - Income source type (remote salary, investments, pension, business)
  - Tax sensitivity (income tax, capital gains, property tax)
  - Banking needs (international transfers, crypto, investment access)
  - Cost of living expectations (specific: rent, food, transport, healthcare)
  Example metrics:
    M38: Monthly cost of living below EUR 3,000 [Financial]
    M39: No income tax on foreign-sourced income [Financial]
    M40: International banking with EUR/USD accounts [Financial]
    M41: Grocery cost for family of [X] below EUR 600/month [Financial]
    M42: Favorable capital gains tax rate (below 20%) [Financial]

P11: "Housing & Real Estate" → moduleId: housing_real_estate → 12-15 metrics
  Coverage targets:
  - Property type (apartment, house, villa, loft)
  - Size requirements (bedrooms, sqm/sqft)
  - Rent vs buy preference
  - Budget range for housing specifically
  - Neighborhood character (urban buzz vs quiet residential)
  - Foreign ownership rules
  Example metrics:
    M43: 2BR apartment rental under EUR 1,500/month [Housing]
    M44: Foreigner property ownership permitted [Housing]
    M45: Walkable neighborhood with shops within 500m [Housing]
    M46: Building quality / construction standards [Housing]

P12: "Professional & Career" → moduleId: professional_career → 12-15 metrics
  Coverage targets:
  - Remote vs local employment
  - Startup ecosystem need
  - Coworking space availability
  - Business registration ease
  - Networking / professional community
  - Time zone compatibility with clients/team
  Example metrics:
    M47: Coworking spaces with 24/7 access [Professional]
    M48: Startup incorporation under 30 days [Professional]
    M49: Time zone within +/- 3 hours of [client zone] [Professional]
    M50: Active [industry] professional community [Professional]

--- TIER 3: INFRASTRUCTURE (P13-P16) ---

P13: "Technology & Connectivity" → moduleId: technology_connectivity → 10-12 metrics
  Coverage targets:
  - Internet speed requirements (specific Mbps)
  - 5G / mobile data coverage
  - Remote work infrastructure
  - Power grid reliability
  - Digital nomad community / ecosystem
  Example metrics:
    M51: Average broadband speed above 100 Mbps [Technology]
    M52: 5G coverage in city center [Technology]
    M53: Fiber optic availability in residential areas [Technology]
    M54: Reliable power grid (outages < 5 hours/year) [Technology]

P14: "Transportation & Mobility" → moduleId: transportation_mobility → 10-15 metrics
  Coverage targets:
  - Car ownership intention (yes/no/maybe)
  - Public transit quality expectations
  - Walkability importance
  - Bike infrastructure
  - Airport proximity for international travel
  - Ride-sharing availability
  Example metrics:
    M55: Public transit coverage reaching 90%+ of city [Transport]
    M56: Walk Score above 80 [Transport]
    M57: International airport within 45 minutes [Transport]
    M58: Bike lane network throughout city center [Transport]

P15: "Education & Learning" → moduleId: education_learning → 8-12 metrics
  Coverage targets:
  - Children's education needs (international schools, curricula)
  - Personal education goals (language, degree, skills)
  - University quality / ranking
  - Library and language school access
  Example metrics:
    M59: International schools with IB curriculum [Education]
    M60: Language schools for [target language] [Education]
    M61: University ranked in global top 500 [Education]

P16: "Social Values & Governance" → moduleId: social_values_governance → 8-12 metrics
  Coverage targets:
  - Personal freedoms that matter (speech, press, religion, lifestyle)
  - Substances (alcohol, cannabis, legal status)
  - Government transparency and civic participation
  - Internet censorship tolerance
  - Privacy laws / government surveillance
  - LGBTQ+ rights (if applicable)
  Example metrics:
    M62: Press Freedom Index in top 30 countries [Governance]
    M63: Cannabis legal or decriminalized [Governance]
    M64: No internet censorship / VPN not required [Governance]
    M65: LGBTQ+ legal protections in place [Governance]

--- TIER 4: LIFESTYLE (P17-P20) ---

P17: "Food & Dining" → moduleId: food_dining → 10-12 metrics
  Coverage targets:
  - Dietary restrictions (vegan, halal, kosher, gluten-free, allergies)
  - Cuisine preferences (specific cuisines loved)
  - Grocery budget expectations
  - Restaurant culture importance
  - Food delivery infrastructure
  - Local cuisine quality / variety
  - Farmers markets / organic access
  Example metrics:
    M66: Vegan restaurant density above 5 per 10k people [Food]
    M67: International grocery stores with [cuisine] ingredients [Food]
    M68: Average restaurant meal under EUR 15 [Food]
    M69: Food delivery apps with 30-min delivery [Food]

P18: "Shopping & Services" → moduleId: shopping_services → 8-10 metrics
  Coverage targets:
  - International product availability
  - Amazon or equivalent delivery services
  - Home delivery speed and reliability
  - Personal care services (barbers, salons)
  - Modern retail infrastructure vs local market charm
  Example metrics:
    M70: Amazon or equivalent with fast delivery [Shopping]
    M71: International brands availability [Shopping]
    M72: Home delivery services reliable [Shopping]

P19: "Outdoor & Recreation" → moduleId: outdoor_recreation → 10-15 metrics
  Coverage targets:
  - Mountain vs beach preference (or both)
  - Hiking trail accessibility
  - Water sports access (surfing, diving, sailing)
  - Green space within city
  - National parks / nature reserves proximity
  - Gym/fitness center access and cost
  - Specific sports (tennis, yoga, CrossFit, martial arts)
  Example metrics:
    M73: Beach within 30-minute drive [Outdoor]
    M74: Hiking trails accessible without car [Outdoor]
    M75: City green space above 20 sqm per capita [Outdoor]
    M76: Gym membership under EUR 50/month [Outdoor]

P20: "Entertainment & Nightlife" → moduleId: entertainment_nightlife → 8-10 metrics
  Coverage targets:
  - Nightlife style (clubs, bars, lounges, none)
  - Festival / event calendar
  - Cinema / theater
  - Weekend activity variety
  - Comedy / stand-up scene
  Example metrics:
    M77: Nightlife district with diverse venue types [Entertainment]
    M78: Annual festivals exceeding 20 events [Entertainment]
    M79: Cinema showing English-language films [Entertainment]
    M80: Weekend activities variety score [Entertainment]

--- TIER 5: CONNECTION (P21-P23) ---

P21: "Family & Children" → moduleId: family_children → 10-15 metrics
  Coverage targets:
  - Who is relocating (partner, kids ages, parents)
  - Partner's career needs
  - Children's age-specific needs (daycare, primary, secondary)
  - Elderly care (if parents coming)
  - Family-friendly neighborhoods
  - Proximity to family back home (flight frequency)
  Example metrics:
    M81: Daycare availability under EUR 500/month [Family]
    M82: Parks and playgrounds within 10-minute walk [Family]
    M83: English-medium schooling K-12 [Family]
    M84: Family-oriented neighborhood culture [Family]

P22: "Neighborhood & Urban Design" → moduleId: neighborhood_urban_design → 8-10 metrics
  Coverage targets:
  - Walkability and pedestrian infrastructure
  - Bike lanes and public spaces
  - Mixed-use vs residential-only zoning
  - Noise levels and street lighting
  - Urban density preferences
  - Community feeling and neighborhood vibe
  Example metrics:
    M85: Walk Score above 80 [Neighborhood]
    M86: Mixed-use zoning with shops within 500m [Neighborhood]
    M87: Street lighting and sidewalk quality [Neighborhood]
    M88: Community-oriented neighborhood culture [Neighborhood]

P23: "Environment & Community Appearance" → moduleId: environment_community_appearance → 8-10 metrics
  Coverage targets:
  - Street cleanliness and maintenance
  - Air quality and noise pollution
  - Green spaces and tree coverage
  - Waste management and recycling infrastructure
  - Architectural consistency and building maintenance
  - Environmental sustainability initiatives
  Example metrics:
    M89: Air quality index (PM2.5) below [X] [Environment]
    M90: Green space per capita above [X] sqm [Environment]
    M91: Active recycling infrastructure [Environment]
    M92: Street cleanliness rating [Environment]

--- TIER 6: IDENTITY (P24-P28) ---

P24: "Religion & Spirituality" → moduleId: religion_spirituality → 6-8 metrics
  Coverage targets:
  - Specific religion / denomination
  - Place of worship proximity
  - Religious tolerance / interfaith
  - Spiritual community (meditation, yoga, retreats)
  - Religious dietary accommodation
  - Secular-friendly (if non-religious)
  Example metrics:
    M93: [Specific] places of worship within 20 minutes [Spiritual]
    M94: Religious tolerance index above 70/100 [Spiritual]
    M95: Meditation / retreat centers accessible [Spiritual]

P25: "Sexual Beliefs, Practices & Laws" → moduleId: sexual_beliefs_practices_laws → 6-8 metrics
  Coverage targets:
  - LGBTQ+ legal rights and social acceptance
  - Same-sex marriage recognition
  - Anti-discrimination protections
  - Dating culture openness
  - Reproductive healthcare access
  - Attitudes toward alternative relationships
  Example metrics:
    M96: LGBTQ+ anti-discrimination protections [Sexual Rights]
    M97: Same-sex marriage or civil union legal [Sexual Rights]
    M98: Reproductive healthcare accessible [Sexual Rights]

P26: "Arts & Culture" → moduleId: arts_culture → 8-10 metrics
  Coverage targets:
  - Museum / gallery importance
  - Music scene (live music, genres, festivals)
  - Theater / performing arts
  - Historical / architectural richness
  - Cultural events calendar density
  - Art community / creative scene
  Example metrics:
    M99: Museums per capita in top quartile [Culture]
    M100: Live music venues with weekly events [Culture]
    M101: Cultural heritage UNESCO sites nearby [Culture]
    M102: Active creative/artist community [Culture]

P27: "Cultural Heritage & Traditions" → moduleId: cultural_heritage_traditions → 8-10 metrics
  Coverage targets:
  - Local festivals and celebrations
  - Attitudes toward foreigners and integration expectations
  - Expat community size and activity
  - Cultural formality vs informality
  - Language and cultural barriers
  - Social openness to newcomers
  Example metrics:
    M103: Active expat community (1000+ in meetup groups) [Heritage]
    M104: Cultural openness index for foreigners [Heritage]
    M105: English widely spoken in social settings [Heritage]
    M106: Regular social events / meetups weekly [Heritage]

P28: "Pets & Animals" → moduleId: pets_animals → 8-10 metrics
  Coverage targets:
  - Pet type and breed (affects import regulations)
  - Pet-friendly housing availability
  - Veterinary care quality and cost
  - Pet import regulations and quarantine
  - Off-leash parks / pet-friendly spaces
  - Breed-specific legislation (if applicable)
  Example metrics:
    M107: Pet-friendly rental apartments available [Pets]
    M108: No breed-specific legislation for [breed] [Pets]
    M109: Veterinary care within 15 minutes [Pets]
    M110: No quarantine requirement for [pet type] import [Pets]

═══ PHASE 6: YOUR VISION ═══

P29: "Your Dream Day" → Cross-category validation → 5-8 metrics
  Coverage targets:
  - Morning routine signals (coffee culture, beach sunrise, gym)
  - Afternoon signals (work setup, lunch culture, siesta)
  - Evening signals (dining out, nightlife, family time, nature)
  - Walkability narrative (does the dream day require a car?)
  - Weather narrative (confirms/refines climate from P8)
  NOTE: This paragraph validates and refines metrics from ALL other paragraphs.
  Gemini cross-references "dream day" activities against extracted metrics.

P30: "Anything Else" → Wildcard / Catch-all → 5-15 metrics
  Coverage targets:
  - Absolute dealbreakers not covered in P3
  - Niche requirements (specific hobby, rare medical need, etc.)
  - Emotional/psychological needs
  - Past relocation experiences (cities loved or hated, and WHY)
  - Partner's separate requirements
  - Future plans (starting family, retiring, building business)
  NOTE: This is the safety net. Olivia should especially encourage depth here.
```

### Total Metric Yield

| User Type | Expected Metrics | Field IDs |
|-----------|-----------------|-----------|
| Sparse writer (1-2 sentences per paragraph) | 100-150 | 150-200 |
| Average writer (paragraph per paragraph) | 150-220 | 200-260 |
| Detailed writer (rich, specific paragraphs) | 220-300 | 260-300 |

**Field IDs vs Metrics**: Field IDs include the metrics PLUS demographic signals, currency data, preference flags, and scoring metadata. 250-300 field IDs is the data table target. 100-250 scored metrics is what feeds the comparison engine.

---

## Olivia: Real-Time Writing Tutor

### The Concept

Olivia is an AI assistant who **watches the user write each paragraph in real-time** and interjects with gentle, encouraging guidance when she detects the user is missing key coverage targets or going off-track. She's a teacher-tutor during an open-book exam — she can't write the answers, but she can say "you haven't addressed question 3 yet."

### How It Works

```
USER WRITES PARAGRAPH
        |
        v
[Debounced analysis — triggers after 3 seconds of pause OR every 150 words]
        |
        v
OLIVIA ANALYZER (keyword detection for MVP, Gemini 3.1 Pro Preview escalation)
  - Checks: which coverage targets for THIS paragraph have been addressed?
  - Checks: is the user off-topic for this paragraph?
  - Checks: has the user provided specific enough detail for metric extraction?
        |
        v
IF missing coverage targets AND user has written 80+ words:
  → Olivia interjects with a SPECIFIC, GENTLE prompt
IF user is off-topic:
  → Olivia redirects with context about what this paragraph is for
IF user is too vague:
  → Olivia asks a sharpening question
```

### Interjection Rules

1. **Never interrupt before 80 words** — let them get started
2. **Maximum 2 interjections per paragraph** — don't be annoying
3. **Always phrase as a question or thought, never a command**
4. **Reference what they HAVE written positively before noting what's missing**
5. **Each interjection targets ONE missing coverage target, not multiple**
6. **If user dismisses/ignores, don't repeat — move to next target on next trigger**
7. **Final "wrap-up" check when user clicks Next — "Before we move on, you mentioned X but not Y — want to add anything?"**

### Interjection Examples by Paragraph

**P3 — "Your Dealbreakers"**
User mentioned safety concerns but nothing about climate or visa:
> "Great that you know your safety limits! Have you thought about climate dealbreakers too? Some cities that feel safe have extreme humidity or heat that makes daily life miserable. And is there a visa pathway that MUST exist, or would lack of one be a hard wall?"


Phase 3 (Advanced): Context-aware cross-paragraph intelligence
  - Olivia remembers what was said in ALL previous paragraphs
  - If P17 (Family) mentions kids but P16 (Education) doesn't address schools: prompt
  - If P11 (Financial) mentions tight budget but P9 (Housing) describes a villa: flag conflict
  - If P3 (Dealbreakers) mentions safety but P7 (Safety) is vague: prompt for specifics
           - Why this is better than Googling / reading blogs
           - VISUAL: Pipeline flowchart showing 6 phases + downstream modules

  Page 88: YOUR METRICS EXPLAINED
           - How paragraphs became metrics
           - Example: "You wrote [quote] → we measured [metric]"
           - 3-4 examples showing paragraph → metric → score chain
           - VISUAL: Quote bubbles → metric cards → score bars

  Page 89: SMART SCORE METHODOLOGY
           - How 0-100 scores work
           - Relative scoring explained ("cities scored against EACH OTHER")
           - Weight system explained (your priorities → category weights)
           - VISUAL: Score formula visualization

  Page 90: DATA QUALITY ASSESSMENT
           - Metrics with high-confidence data (5+ sources)
           - Metrics with moderate data (2-4 sources)
           - Metrics with limited data (1 source or extrapolated)
           - How data gaps affect confidence
           - VISUAL: Data quality heatmap by category

  Pages 91-92: LLM METHODOLOGY
           - Which AI models were used and why
           - How consensus works (StdDev-based confidence)
           - Why Opus is the judge (no web search = unbiased)
           - Tavily's role in sourcing real data
           - VISUAL: LLM architecture diagram + model comparison table

  Pages 93-96: FULL SOURCE CITATIONS
           - Every source used, organized by category
           - Format: Source Name | URL | Date Accessed | Metrics Supported
           - Data freshness indicators
           - VISUAL: Clean citation table with clickable URLs (in digital version)

SECTION 10: CLOSING (Pages 97-100)
───────────────────────────────────
  Page 97: PERSONAL NOTE FROM CRISTIANO
           - "Dear [Name], having reviewed your complete profile..."
           - Warm, personalized closing message
           - Encouragement and confidence-building
           - VISUAL: Letter-style formatting with signature

  Page 98: ABOUT CLUES INTELLIGENCE
           - Company overview
           - Other modules available
           - How to access ongoing support (Olivia chat)
           - VISUAL: Clean brand page

  Page 99: LEGAL DISCLAIMERS & NOTICES
           - Data accuracy disclaimer
           - Not legal/immigration/financial advice
           - Source attribution policy
           - Privacy statement
           - VISUAL: Formal legal page

  Page 100: BACK COVER
           - CLUES Intelligence branding
           - "Your new life is waiting."
           - QR code to access digital interactive version
           - Report ID for reference
           - VISUAL: Clean branded back cover
```

### Visual Element Inventory (Across 100 Pages)

| Visual Type | Count | Where Used |
|-------------|-------|------------|
| Radial score gauges | 3-4 | Verdict, city scores, confidence |
| Horizontal bar charts | 25+ | Category comparisons, metric tables |
| Radar/spider charts | 2-3 | Category showdown, LifeScore sub-categories |
| Heatmaps | 2-3 | Metric overview, data quality, LLM agreement |
| Donut/pie charts | 3-4 | Budget breakdowns, expense categories |
| Line graphs | 2-3 | Temperature over 12 months, trends |
| Comparison tables | 10+ | City vs city, town vs town, neighborhood |
| Waterfall charts | 1-2 | QoL delta, cost comparison |
| Timeline/Gantt charts | 2-3 | Immigration pathway, 90-day plan, future outlook |
| Maps | 4-5 | Country, city, town, neighborhood, climate zones |
| Photo spreads | 6-8 | Cover, city hero, town profiles, neighborhood, lifestyle |
| Infographics | 4-5 | Immigration, methodology, pipeline, profile |
| Checklist/boolean tables | 3-4 | Visa types, pet rules, action items |
| Pull quote callouts | 5-8 | User's own paragraph quotes woven into analysis |
| Score cards | 10+ | Country, city, town, neighborhood scorecards |
| Icon grids | 3-4 | Amenities, family features, community features |

### Report Scaling by Tier

The 100-page blueprint above is the **Validated/Precision tier** (full data). For earlier tiers:

| Tier | Pages | What's Included | What's Reduced |
|------|-------|----------------|----------------|
| Discovery (Paragraphical only) | 35-45 | Cover + Profile + Country + City Showdown (condensed) + Verdict + Next Steps | No town/neighborhood, fewer metrics per category, no LLM consensus |
| Exploratory (+Demographics) | 50-60 | Above + expanded city comparison + town overview | Limited neighborhood, limited action plan |
| Filtered (+DNWs) | 60-70 | Above + elimination reasoning + refined cities | Condensed action plan |
| Evaluated (+MHs) | 70-80 | Above + full scoring + town profiles | Condensed neighborhood |
| Validated (+General Q's) | 85-100 | Full report as designed above | Nothing reduced |
| Precision (+Modules) | 100 | Maximum depth, maximum confidence | Nothing reduced, maximum detail |

---

## LLM Model Registry (Canonical)

This is the **single source of truth** for which AI model powers each function in the CLUES ecosystem. Every developer and every AI session must reference this table. Do not guess models — check here.

| Role | Model | Provider | Why |
|------|-------|----------|-----|
| **Olivia (Chat Assistant)** | Claude Sonnet 4.6 | Anthropic | Company-wide assistant across all CLUES products. Conversational, intelligent, cost-effective for chat. |
| **Olivia Tutor (Paragraphical)** | Gemini 3.1 Pro (Preview) | Google | Coverage-gap detection during writing. Only fires when keyword detection isn't confident enough. |
| **Paragraphical Extraction** | Gemini 3.1 Pro (Preview) | Google | Heavy narrative-to-data extraction. Reads all 30 paragraphs (P1-P2 Profile, P3 DNW, P4 MH, P5 Trade-offs, P6-P28 Module Deep Dives, P29-P30 Vision), converts to 100-250 numbered metrics, recommends locations, scores with sourced data. |
| **LLM Evaluator #1** | Claude Sonnet 4.5 | Anthropic | Structured reasoning, category scoring |
| **LLM Evaluator #2** | GPT-4o | OpenAI | Elimination/classification tasks (DNW hard walls) |
| **LLM Evaluator #3** | Gemini 3.1 Pro Preview | Google | Reuses extraction context for scoring |
| **LLM Evaluator #4** | Grok 4 | xAI | Real-time web context for MH scoring |
| **LLM Evaluator #5** | Perplexity Sonar | Perplexity | Research-backed citations |
| **Cristiano Judge** | Claude Opus 4.5 | Anthropic | Consensus builder, reviews stdDev > 15 disagreements |
| **Emilia (Help Panel)** | N/A (static content) | — | Pre-written help topics, no LLM calls |
| **Report Narrative** | Claude Sonnet 4.5 | Anthropic | Long-form report writing from scored data |
| **HeyGen Avatar** | HeyGen API | HeyGen | Olivia video presentation |
| **InVideo Movie** | InVideo API | InVideo | Cinematic "Before and After" movie |
| **Voice Narration** | ElevenLabs / OpenAI TTS | — | Cristiano Judge narration for films |

### Key Rules
1. **Olivia = Claude Sonnet 4.6 everywhere** — chat bubble, help modal, all products. This is a company architecture decision, not per-feature.
2. **Gemini 3.1 Pro (Preview) for heavy extraction** — the Paragraphical pipeline's main brain.
3. **Gemini 3.1 Pro (Preview) for tutor escalation** — Olivia's tutor interjections during writing when keyword detection is insufficient.
4. **Never substitute models without updating this table.** If a model changes, update here FIRST, then update code.
5. **Cost tracking must match these models.** The `costTracking.ts` rate table must align with this registry.

---

## Olivia Tutor Architecture (Paragraphical Writing Flow)

Olivia guides users while they write each of the 30 paragraphs, ensuring they cover the key topics that feed into accurate city matching. This is a 4-layer system built incrementally.

### Layer 1: Coverage Target Data (Code — Zero Cost)
**What:** A TypeScript data file defining what each paragraph needs.
**File:** `src/data/paragraphTargets.ts`

```typescript
// Per-paragraph: coverage targets, keyword groups, template interjections
{
  paragraphId: 3,
  heading: "Your Dealbreakers",
  coverageTargets: [
    { id: "climate_dnw", label: "Climate dealbreakers", keywords: ["humidity", "heat", "cold", "snow", "ice", "tropical", "desert", "too hot", "too cold", "freezing"] },
    { id: "safety_dnw", label: "Safety dealbreakers", keywords: ["crime", "violence", "dangerous", "war", "conflict", "cartel", "corrupt", "unstable"] },
    { id: "legal_dnw", label: "Legal dealbreakers", keywords: ["no visa", "illegal", "banned", "restricted", "no residency", "no pathway", "deport"] },
    { id: "healthcare_dnw", label: "Healthcare dealbreakers", keywords: ["no hospital", "no doctor", "no specialist", "no pharmacy", "no healthcare", "medical"] },
    { id: "region_dnw", label: "Excluded regions/countries", keywords: ["refuse", "never", "not", "exclude", "avoid", "no way", "except", "only"] },
    { id: "cultural_dnw", label: "Cultural dealbreakers", keywords: ["intolerant", "censorship", "oppressive", "authoritarian", "discrimination", "homophobic", "racist"] },
  ],
  templateInterjections: {
    climate_dnw: "What climate would be completely unacceptable? Extreme humidity, freezing winters, desert heat? These hard walls eliminate cities before scoring even begins.",
    safety_dnw: "Any safety-related dealbreakers? Certain crime levels, political instability, or conflict zones you'd never consider?",
    region_dnw: "Are there specific countries or regions you absolutely refuse to consider? Even if they'd otherwise score well?",
  }
}
```

### Layer 2: Keyword Detection Engine (Code — Zero Cost)
**What:** A React hook that monitors paragraph text in real-time and triggers interjections using local keyword matching.
**File:** `src/hooks/useOliviaTutor.ts`

- Debounces after 3-second pause or 150 words written
- Minimum 80 words before first trigger (let them get going)
- Maximum 2 interjections per paragraph
- Checks each coverage target's keyword group against user text
- If keywords found → target marked as covered
- If missing after threshold → fires template interjection
- Tracks dismissed interjections (don't repeat)
- **This alone handles ~70% of tutoring with zero API spend**

### Layer 3: Gemini 3.1 Pro Preview Escalation (API)
**What:** When keyword detection confidence is low, fire a Gemini 3.1 Pro Preview call.
**File:** `src/lib/oliviaTutor.ts`

Triggers when:
- User wrote 150+ words but keyword detection only found 1-2 of 5+ targets
- User's language is indirect/metaphorical (keyword matching fails)
- Cross-paragraph conflict detected (e.g., P6 says "love the beach" but P9 says "hate tourists")

The Gemini 3.1 Pro Preview prompt:
```
You are Olivia, analyzing paragraph text for coverage gaps.
Paragraph {N}: "{heading}" — Coverage targets: {list}
User wrote: "{text}"

Return JSON:
{
  "covered": ["target1", "target2"],
  "missing": ["target3"],
  "most_important_missing": "target3",
  "interjection": "string or null",
  "confidence": 0.0-1.0
}

Only return interjection if confidence > 0.7 that target is genuinely missing.
Reference something they wrote positively first. Ask about ONE missing target.
Max 2 sentences. Never say "you forgot" — say "have you thought about".
```

Most paragraphs are handled by Layer 2 (keyword detection, zero cost). Layer 3 only fires when keyword confidence is low.

### Layer 4: Cross-Paragraph Intelligence (API — Future)
**What:** After multiple paragraphs are written, Olivia detects conflicts, gaps, and opportunities across the full narrative.

- Fires after paragraphs 5, 12, 16, 20, 23, 28, and 30 (phase boundaries)
- Checks for contradictions (P3 vs P6, P9 vs P11, P4 vs module paragraphs)
- Identifies completely unaddressed categories
- Suggests which remaining paragraphs to focus on
- Uses conversation history to avoid repetition

### Build Order
1. Layer 1 (data file) → Layer 2 (keyword hook) → Ship as MVP
2. Layer 3 (Gemini 3.1 Pro Preview) → Add when keyword detection proves insufficient
3. Layer 4 (cross-paragraph) → Add after Paragraphical extraction endpoint is built

### UI Integration
- Interjections appear in the existing `OliviaBubble.tsx` chat bubble
- Bubble pulses gently when Olivia has something to say (not intrusive)
- User can dismiss ("Got it") or expand ("Tell me more")
- "Tell me more" escalates to Claude Sonnet 4.6 (Olivia's full brain) for a detailed explanation
- Interjection count badge on bubble: "Olivia has 1 suggestion"

---

## Questionnaire Reference Documents

Typeform questionnaire exports for each module, stored in `docs/`:

| # | Module | Questions | Sections | File |
|---|--------|-----------|----------|------|
| — | **Main Module (Demographics, DNW, Must Haves)** | **100** | **3** | `MAIN_MODULE_QUESTIONS.md` |
| — | **General Questions** | **50** | **8** | `GENERAL_QUESTIONS_REFERENCE.md` |
| 1 | Climate & Weather | 100 | 10 | `CLIMATE_WEATHER_QUESTIONS.md` |
| 2 | Safety & Security | 100 | 10 | `SAFETY_SECURITY_QUESTIONS.md` |
| 3 | Financial & Banking | 100 | 10 | `FINANCIAL_BANKING_QUESTIONS.md` |
| 4 | Housing & Property | 100 | 6 | `HOUSING_PROPERTY_QUESTIONS.md` |
| 5 | Education & Learning | 100 | 10 | `EDUCATION_LEARNING_QUESTIONS.md` |
| 6 | Health & Wellness | 100 | 5 | `HEALTH_WELLNESS_QUESTIONS.md` |
| 7 | Social Values & Governance | 100 | 10 | `SOCIAL_VALUES_GOVERNANCE_QUESTIONS.md` |
| 8 | Professional & Career | 100 | 5 | `PROFESSIONAL_CAREER_QUESTIONS.md` |
| 9 | Technology & Connectivity | 100 | 5 | `TECHNOLOGY_CONNECTIVITY_QUESTIONS.md` |
| 10 | Entertainment & Nightlife | 100 | 10 | `ENTERTAINMENT_NIGHTLIFE_QUESTIONS.md` |
| 11 | Outdoor & Recreation | 100 | 8 | `OUTDOOR_RECREATION_QUESTIONS.md` |
| 12 | Family & Children | 100 | 10 | `FAMILY_CHILDREN_QUESTIONS.md` |
| 13 | Sexual Beliefs, Practices & Laws | 100 | 8 | `SEXUAL_BELIEFS_PRACTICES_LAWS_QUESTIONS.md` |
| 14 | Food & Dining | 100 | 9 | `FOOD_DINING_QUESTIONS.md` |
| 15 | Legal & Immigration | 100 | 5 | `LEGAL_IMMIGRATION_QUESTIONS.md` |
| 16 | Pets & Animals | 100 | 10 | `PETS_ANIMALS_QUESTIONS.md` |
| 17 | Religion & Spirituality | 100 | 5 | `RELIGION_SPIRITUALITY_QUESTIONS.md` |
| 18 | Arts & Culture | 100 | 5 | `ARTS_CULTURE_QUESTIONS.md` |
| 19 | Transportation & Mobility | 100 | 9 | `TRANSPORTATION_MOBILITY_QUESTIONS.md` |
| 20 | Shopping & Services | 100 | 10 | `SHOPPING_SERVICES_QUESTIONS.md` |
| 21 | Environment & Community Appearance | 100 | 6 | `ENVIRONMENT_COMMUNITY_APPEARANCE_QUESTIONS.md` |
| 22 | Neighborhood & Urban Design | 100 | 10 | `NEIGHBORHOOD_URBAN_DESIGN_QUESTIONS.md` |
| 23 | Cultural Heritage & Traditions | 100 | 5 | `CULTURAL_HERITAGE_TRADITIONS_QUESTIONS.md` |

---

## Development

See `CLAUDE.md` for WCAG 2.1 AA compliance rules, build rules, and development guidelines.
See `CLUES_MAIN_BUILD_REFERENCE.md` for overall system architecture and build state.
See `PARAGRAPHICAL_ARCHITECTURE.md` for the Paragraphical pipeline, Gemini prompt, metrics, Smart Scores, Cristiano judge, and report structure.
See `docs/DATA_ARCHITECTURE.md` for the **complete data architecture flowchart** — all 200 questions listed individually, all 7 logic jump rules, Olivia's 19-answer context builder, GQ→module relevance engine, 3-layer persistence, tier/confidence calculation, and proof that every question is evaluated.

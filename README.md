# CLUES Intelligence — Main Platform

## Overview

CLUES Intelligence is a relocation and lifestyle intelligence platform that helps users find their **Best City, Best Town, and Best Neighborhood** anywhere in the world. The system uses AI-powered analysis across 20 life categories to deliver personalized, data-driven recommendations.

This is **not** a law-based app (unlike LifeScore, which focuses on legal freedom metrics). CLUES Main is a **quality-of-life fit** platform — scoring how well a location matches a specific user's lifestyle, priorities, and needs.

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **AI:** Google Gemini (Paragraphical pipeline), Cristiano Judge system (Opus)
- **Research:** Tavily (search + research APIs)
- **Reports:** Gamma (100-page visual report), HeyGen (video), InVideo (cinematic)
- **Styling:** Dark-mode-first, WCAG 2.1 AA compliant (see CLAUDE.md)

---

## The 20 Category System (Human Existence Flow)

### SURVIVAL & FOUNDATION (5 categories)
1. **Climate & Weather** — temperature, humidity, seasons, natural disasters, air quality
2. **Safety & Security** — crime rates, political stability, emergency services, personal safety
3. **Healthcare & Medical** — hospital access, insurance, specialists, mental health, pharma
4. **Housing & Real Estate** — cost, availability, quality, rental vs ownership, neighborhoods
5. **Transportation** — public transit, walkability, bike infrastructure, drive times, airports

### LEGAL & FINANCIAL (3 categories)
6. **Legal & Immigration** — visa types, residency paths, bureaucracy, rights
7. **Financial & Banking** — cost of living, taxes, banking access, currency, investment
8. **LifeScore** — personal freedom metrics (standalone 100-metric module, integrated here)

### LIVELIHOOD & GROWTH (3 categories)
9. **Business & Entrepreneurship** — startup ecosystem, regulations, networking, co-working
10. **Technology & Connectivity** — internet speed, 5G, tech infrastructure, digital services
11. **Education & Learning** — schools, universities, language courses, professional development

### PEOPLE & RELATIONSHIPS (3 categories)
12. **Family & Children** — childcare, schools, family activities, safety, healthcare for kids
13. **Dating & Social Life** — social scene, expat community, cultural openness, meetups
14. **Pets & Animals** — pet-friendly housing, vet access, parks, import regulations

### NOURISHMENT & LIFESTYLE (3 categories)
15. **Food & Cuisine** — restaurants, grocery, local cuisine, dietary options, cost
16. **Sports & Fitness** — gyms, outdoor sports, leagues, wellness, yoga/meditation
17. **Outdoor & Nature** — parks, hiking, beaches, mountains, green spaces, wildlife

### SOUL & MEANING (3 categories)
18. **Arts & Culture** — museums, galleries, music, theater, cultural events, history
19. **Entertainment & Nightlife** — bars, clubs, live music, events, festivals, cinema
20. **Spiritual & Religious** — places of worship, communities, meditation, retreats

**Distribution:** 5-3-3-3-3-3 across 6 super-sections. Survival & Foundation is the heaviest group — the non-negotiable baseline for any relocation.

---

## The User Funnel

CLUES is designed as a progressive intelligence funnel. Users enter at any point, and the system gets smarter as they engage deeper.

### Entry Points (Not Sequential — User Chooses)

1. **Paragraphical (Optional)** — User writes freely about their life, priorities, dreams, dealbreakers. AI extracts metrics, weights, and preferences. Generates an initial report with top 3 Cities, 3 Towns, 3 Neighborhoods. Fast, intuitive, surprisingly powerful.

2. **Main Module (Optional)** — Structured questionnaire covering all 20 categories. More systematic data collection. Same output format: top 3/3/3.

3. **Both (Best Results)** — Paragraphical + Main Module together yields the richest data and lowest margin of error. The system cross-references free-form narrative with structured answers.

### The Intelligence Engine

After entry point(s) are complete, the system has initial data. Here's what happens next:

- **Margin of Error Calculation** — The system analyzes ALL raw data (metrics, weights, judge reports) and calculates a confidence/margin of error for the current recommendations
- **Holistic User Analysis** — Looks at the specific user's profile, priorities, and data gaps to determine which category modules would most reduce uncertainty
- **Module Recommendations** — Tells the user: "Complete Climate, Healthcare, and Dating modules to improve your confidence from 65% to 92%." The system doesn't guess which modules matter — it KNOWS based on what data is missing for THIS user
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

Each of the 20 category modules is ALSO a **freestanding web app**. This serves three purposes:

1. **Brand Awareness** — Someone discovers CLUES through the Climate module or Dating module, has fun with it, discovers the full platform
2. **Revenue** — Individual modules have value on their own and can be monetized independently
3. **Data Collection** — Every standalone module interaction feeds back into the intelligence engine if the user later joins the full platform

Many modules are inherently fun and educational on their own — you don't need to be relocating to enjoy exploring Climate data or comparing Food scenes across cities.

---

## LifeScore Integration

LifeScore is one of the 20 category modules (Category 8) but is unique:
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

Each of the 24 paragraphs has a **minimum metric yield** and **coverage targets** — the key topics Gemini MUST extract from, even if the user only hints at them. If the user is detailed, more metrics emerge naturally. If they're sparse, Gemini extrapolates baseline needs from context.

```
PARAGRAPH → CATEGORY MAPPING → MIN METRICS → COVERAGE TARGETS
═══════════════════════════════════════════════════════════════

P1: "Who You Are" → Demographics/Profile → 8-12 metrics
  Coverage targets:
  - Age bracket (affects healthcare, nightlife, education weights)
  - Nationality/passport (affects immigration pathways)
  - Household composition (solo, couple, family, multi-gen)
  - Language(s) spoken (affects integration ease)
  - Cultural identity (affects community matching)
  Example metrics:
    M1: Age-appropriate healthcare infrastructure [Healthcare]
    M2: Passport-compatible visa pathways [Legal]
    M3: Language accessibility for [detected language] speakers [Education]
    M4: Cultural community presence for [detected background] [Social]

P2: "Your Life Right Now" → Cross-category signals → 10-15 metrics
  Coverage targets:
  - Current city/country (baseline for comparison)
  - Push factors (what's WRONG now — critical for DNW signals)
  - Pull factors (what they're SEEKING — critical for MH signals)
  - Timeline urgency (affects visa pathway scoring)
  - Emotional state (affects how we frame the report)
  Example metrics:
    M5: Improvement over current city on [detected push factor] [varies]
    M6: Cost of living differential vs current location [Financial]
    M7: Quality of life index improvement [cross-category]

P3: "Your Ideal Climate" → Climate & Weather → 12-18 metrics
  Coverage targets:
  - Temperature range preference (specific numbers if possible)
  - Humidity tolerance (tropical vs dry — make-or-break)
  - Seasonal preference (4 seasons, eternal summer, mild winters)
  - Natural disaster tolerance (earthquakes, hurricanes, flooding)
  - Sunshine hours importance
  - Air quality sensitivity
  Example metrics:
    M8: Average winter temperature 20-25C [Climate]
    M9: Annual humidity below 60% [Climate]
    M10: Fewer than 2 extreme weather events per decade [Climate]
    M11: Annual sunshine hours above 2500 [Climate]
    M12: Air Quality Index below 50 (WHO standard) [Climate]
    M13: No monsoon/rainy season exceeding 60 days [Climate]

P4: "Safety & Peace of Mind" → Safety & Security → 10-15 metrics
  Coverage targets:
  - Crime type concerns (violent, property, petty, organized)
  - Political stability importance
  - Emergency services quality
  - Women's safety / LGBTQ+ safety (if relevant)
  - Neighborhood safety feel (walkable at night?)
  - Natural disaster preparedness
  Example metrics:
    M14: Violent crime rate below [X] per 100k [Safety]
    M15: Political stability index above 70/100 [Safety]
    M16: Emergency response time under 10 minutes [Safety]
    M17: Safe for solo walking after midnight [Safety]

P5: "Your Health & Wellness" → Healthcare & Medical → 12-18 metrics
  Coverage targets:
  - Chronic conditions requiring specialist access
  - Medication availability (specific drugs)
  - Mental health services
  - Insurance system (public vs private, cost)
  - Hospital quality / international accreditation
  - Wellness infrastructure (alternative medicine, prevention)
  - Dental care access
  Example metrics:
    M18: [Specific specialist] availability within 30min [Healthcare]
    M19: [Specific medication] legally available and affordable [Healthcare]
    M20: English-speaking medical professionals [Healthcare]
    M21: Private health insurance under EUR 300/month [Healthcare]
    M22: JCI-accredited hospital within 30 minutes [Healthcare]

P6: "Your Dream Home" → Housing & Real Estate → 12-15 metrics
  Coverage targets:
  - Property type (apartment, house, villa, loft)
  - Size requirements (bedrooms, sqm/sqft)
  - Rent vs buy preference
  - Budget range for housing specifically
  - Neighborhood character (urban buzz vs quiet residential)
  - Amenities (garden, pool, parking, elevator)
  - Foreign ownership rules
  Example metrics:
    M23: 2BR apartment rental under EUR 1,500/month [Housing]
    M24: Foreigner property ownership permitted [Housing]
    M25: Walkable neighborhood with shops within 500m [Housing]
    M26: Building quality / construction standards [Housing]

P7: "Your Legal Reality" → Legal & Immigration → 10-15 metrics
  Coverage targets:
  - Current passport(s) and their strength
  - Visa type interest (digital nomad, retirement, investment, work)
  - Residency pathway length tolerance
  - Bureaucracy tolerance
  - Tax treaty awareness
  - Dual citizenship possibility
  Example metrics:
    M27: Digital nomad visa available for [nationality] [Legal]
    M28: Residency achievable within 12 months [Legal]
    M29: Tax treaty with [home country] [Financial]
    M30: Bureaucracy efficiency index [Legal]

P8: "Your Financial Picture" → Financial & Banking → 12-18 metrics
  Coverage targets:
  - Monthly income (DETECT CURRENCY — never default to USD)
  - Monthly budget tolerance
  - Income source type (remote salary, investments, pension, business)
  - Tax sensitivity (income tax, capital gains, property tax)
  - Banking needs (international transfers, crypto, investment access)
  - Cost of living expectations (specific: rent, food, transport, healthcare)
  Example metrics:
    M31: Monthly cost of living below EUR 3,000 [Financial]
    M32: No income tax on foreign-sourced income [Financial]
    M33: International banking with EUR/USD accounts [Financial]
    M34: Grocery cost for family of [X] below EUR 600/month [Financial]
    M35: Favorable capital gains tax rate (below 20%) [Financial]

P9: "Freedom & Autonomy" → LifeScore / Legal → 8-12 metrics
  Coverage targets:
  - Personal freedoms that matter (speech, press, religion, lifestyle)
  - Substances (alcohol, cannabis, legal status)
  - LGBTQ+ rights (if applicable)
  - Internet censorship tolerance
  - Gun rights (if applicable)
  - Business freedom / regulatory freedom
  Example metrics:
    M36: Press Freedom Index in top 30 countries [LifeScore]
    M37: Cannabis legal or decriminalized [LifeScore]
    M38: No internet censorship / VPN not required [LifeScore]
    M39: LGBTQ+ legal protections in place [LifeScore]

P10: "Your Work & Career" → Business & Entrepreneurship → 12-15 metrics
  Coverage targets:
  - Remote vs local employment
  - Industry/sector (tech, finance, creative, trades)
  - Startup ecosystem need
  - Coworking space availability
  - Business registration ease
  - Networking / professional community
  - Time zone compatibility with clients/team
  Example metrics:
    M40: Coworking spaces with 24/7 access [Business]
    M41: Startup incorporation under 30 days [Business]
    M42: Time zone within +/- 3 hours of [client zone] [Business]
    M43: Active [industry] professional community [Business]

P11: "Staying Connected" → Technology & Connectivity → 10-12 metrics
  Coverage targets:
  - Internet speed requirements (specific Mbps)
  - 5G / mobile data coverage
  - Remote work infrastructure
  - Digital nomad community / ecosystem
  - Smart city infrastructure
  - Tech startup density (if relevant)
  Example metrics:
    M44: Average broadband speed above 100 Mbps [Technology]
    M45: 5G coverage in city center [Technology]
    M46: Fiber optic availability in residential areas [Technology]
    M47: Reliable power grid (outages < 5 hours/year) [Technology]

P12: "Getting Around" → Transportation → 10-15 metrics
  Coverage targets:
  - Car ownership intention (yes/no/maybe)
  - Public transit quality expectations
  - Walkability importance
  - Bike infrastructure
  - Airport proximity for international travel
  - Ride-sharing availability
  - Commute time tolerance
  Example metrics:
    M48: Public transit coverage reaching 90%+ of city [Transport]
    M49: Walk Score above 80 [Transport]
    M50: International airport within 45 minutes [Transport]
    M51: Bike lane network throughout city center [Transport]

P13: "Learning & Growth" → Education & Learning → 8-12 metrics
  Coverage targets:
  - Personal education goals (language, degree, skills)
  - Children's education needs (if applicable)
  - International school availability
  - University quality / ranking
  - Professional development / conferences
  - Language learning infrastructure
  Example metrics:
    M52: International schools with IB curriculum [Education]
    M53: Language schools for [target language] [Education]
    M54: University ranked in global top 500 [Education]

P14: "Your Family" → Family & Children → 10-15 metrics
  Coverage targets:
  - Who is relocating (partner, kids ages, parents)
  - Partner's career needs
  - Children's age-specific needs (daycare, primary, secondary)
  - Family activities and entertainment
  - Elderly care (if parents coming)
  - Family-friendly neighborhoods
  - Parental leave / family benefits (if employed locally)
  Example metrics:
    M55: Daycare availability under EUR 500/month [Family]
    M56: Parks and playgrounds within 10-minute walk [Family]
    M57: English-medium schooling K-12 [Family]
    M58: Family-oriented neighborhood culture [Family]

P15: "Your Social World" → Dating & Social Life → 10-12 metrics
  Coverage targets:
  - Expat community size and activity
  - Dating scene (if single)
  - Social club/meetup availability
  - Cultural openness to foreigners
  - Nightlife quality (or lack thereof if preferred)
  - Community integration ease
  Example metrics:
    M59: Active expat community (1000+ in meetup groups) [Social]
    M60: Cultural openness index for foreigners [Social]
    M61: English widely spoken in social settings [Social]
    M62: Regular social events / meetups weekly [Social]

P16: "Your Animals" → Pets & Animals → 8-10 metrics
  Coverage targets:
  - Pet type and breed (affects import regulations)
  - Pet-friendly housing availability
  - Veterinary care quality and cost
  - Pet import regulations and quarantine
  - Off-leash parks / pet-friendly spaces
  - Breed-specific legislation (if applicable)
  Example metrics:
    M63: Pet-friendly rental apartments available [Pets]
    M64: No breed-specific legislation for [breed] [Pets]
    M65: Veterinary care within 15 minutes [Pets]
    M66: No quarantine requirement for [pet type] import [Pets]

P17: "Food & Dining" → Food & Cuisine → 10-12 metrics
  Coverage targets:
  - Dietary restrictions (vegan, halal, kosher, gluten-free, allergies)
  - Cuisine preferences (specific cuisines loved)
  - Grocery budget expectations
  - Restaurant culture importance
  - Food delivery infrastructure
  - Local cuisine quality / variety
  - Farmers markets / organic access
  Example metrics:
    M67: Vegan restaurant density above 5 per 10k people [Food]
    M68: International grocery stores with [cuisine] ingredients [Food]
    M69: Average restaurant meal under EUR 15 [Food]
    M70: Food delivery apps with 30-min delivery [Food]

P18: "Fitness & Activity" → Sports & Fitness → 8-12 metrics
  Coverage targets:
  - Gym/fitness center access and cost
  - Specific sports (tennis, surfing, yoga, CrossFit, martial arts)
  - Sports league / club availability
  - Outdoor fitness infrastructure (running paths, outdoor gyms)
  - Wellness/spa culture
  - Swimming pool access (indoor/outdoor)
  Example metrics:
    M71: Gym membership under EUR 50/month [Fitness]
    M72: [Specific sport] clubs with English-speaking members [Fitness]
    M73: Running/cycling paths along waterfront or parks [Fitness]
    M74: Year-round outdoor exercise climate [Fitness]

P19: "Nature & Outdoors" → Outdoor & Nature → 8-12 metrics
  Coverage targets:
  - Mountain vs beach preference (or both)
  - Hiking trail accessibility
  - Water sports access (surfing, diving, sailing)
  - Green space within city
  - National parks / nature reserves proximity
  - Wildlife encounters (positive or concern)
  Example metrics:
    M75: Beach within 30-minute drive [Outdoor]
    M76: Hiking trails accessible without car [Outdoor]
    M77: City green space above 20 sqm per capita [Outdoor]
    M78: National parks within 2-hour drive [Outdoor]

P20: "Arts & Culture" → Arts & Culture → 8-10 metrics
  Coverage targets:
  - Museum / gallery importance
  - Music scene (live music, genres, festivals)
  - Theater / performing arts
  - Historical / architectural richness
  - Cultural events calendar density
  - Art community / creative scene
  Example metrics:
    M79: Museums per capita in top quartile [Culture]
    M80: Live music venues with weekly events [Culture]
    M81: Cultural heritage UNESCO sites nearby [Culture]
    M82: Active creative/artist community [Culture]

P21: "Fun & Entertainment" → Entertainment & Nightlife → 8-10 metrics
  Coverage targets:
  - Nightlife style (clubs, bars, lounges, none)
  - Festival / event calendar
  - Cinema / theater
  - Gaming / esports (if relevant)
  - Weekend activity variety
  - Comedy / stand-up scene
  Example metrics:
    M83: Nightlife district with diverse venue types [Entertainment]
    M84: Annual festivals exceeding 20 events [Entertainment]
    M85: Cinema showing English-language films [Entertainment]
    M86: Weekend activities variety score [Entertainment]

P22: "Faith & Spirituality" → Spiritual & Religious → 6-8 metrics
  Coverage targets:
  - Specific religion / denomination
  - Place of worship proximity
  - Religious tolerance / interfaith
  - Spiritual community (meditation, yoga, retreats)
  - Religious dietary accommodation
  - Secular-friendly (if non-religious)
  Example metrics:
    M87: [Specific] places of worship within 20 minutes [Spiritual]
    M88: Religious tolerance index above 70/100 [Spiritual]
    M89: Meditation / retreat centers accessible [Spiritual]

P23: "Your Dream Day" → Cross-category validation → 5-8 metrics
  Coverage targets:
  - Morning routine signals (coffee culture, beach sunrise, gym)
  - Afternoon signals (work setup, lunch culture, siesta)
  - Evening signals (dining out, nightlife, family time, nature)
  - Walkability narrative (does the dream day require a car?)
  - Weather narrative (confirms/refines climate from P3)
  NOTE: This paragraph validates and refines metrics from ALL other paragraphs.
  Gemini cross-references "dream day" activities against extracted metrics.

P24: "Anything Else" → Wildcard / Dealbreakers → 5-15 metrics
  Coverage targets:
  - Absolute dealbreakers not covered elsewhere
  - Niche requirements (specific hobby, rare medical need, etc.)
  - Emotional/psychological needs
  - Things they're afraid to say in earlier paragraphs
  - Partner's separate requirements
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
OLIVIA ANALYZER (lightweight — Gemini Flash or keyword detection for MVP)
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

**P3 — "Your Ideal Climate"**
User wrote about temperature but not humidity:
> "Love the detail about temperature! Quick thought — how do you feel about humidity? Some places hit your perfect temperature but the humidity makes it feel 10 degrees hotter. Worth mentioning if it matters to you."

**P5 — "Your Health & Wellness"**
User mentioned being healthy but didn't discuss medication or specialists:
> "Great that you're in good health! Just in case — do you take any regular medications or see any specialists? Pharmacy access varies wildly between countries, and some medications that are over-the-counter at home need prescriptions abroad."

**P8 — "Your Financial Picture"**
User mentioned income but not taxes:
> "Good picture of your income! One thing that can make or break a relocation budget: taxes. Some countries won't tax your foreign income at all, others take 30%+. Any thoughts on your tax tolerance?"

**P12 — "Getting Around"**
User described a car-free lifestyle but didn't mention airports:
> "Love the walkable vision! How often do you travel internationally? Airport proximity matters a lot for some people — a beautiful walkable city that's 3 hours from an airport changes the equation."

**P16 — "Your Animals"**
User mentioned a dog but not the breed:
> "A fellow dog person! What breed? It matters more than you'd think — some countries ban specific breeds, and size affects housing options and airline transport rules."

**P24 — "Anything Else"**
User wrote very little:
> "This is your safety net — anything you've been thinking about that didn't fit neatly into the other sections? Dealbreakers you forgot to mention? Things your partner cares about that are different from your priorities? Even small things can matter."

### Technical Implementation

```
Phase 1 (MVP): Keyword/regex detection against coverage target keywords per paragraph.
  - Fast, no API cost, runs locally
  - Each paragraph has a list of target keywords/phrases
  - If 80+ words written and keyword group absent → trigger interjection from template

Phase 2 (Enhanced): Gemini Flash API call (debounced, max 1 per paragraph)
  - Send: paragraph text + coverage targets + paragraph context
  - Return: which targets are covered, which are missing, suggested interjection
  - Cost: ~$0.001 per call (Flash is cheap), 24 calls max = $0.024 per user

Phase 3 (Advanced): Context-aware cross-paragraph intelligence
  - Olivia remembers what was said in ALL previous paragraphs
  - If P14 (Family) mentions kids but P13 (Education) doesn't address schools: prompt
  - If P8 (Financial) mentions tight budget but P6 (Housing) describes a villa: flag conflict
  - Cross-paragraph consistency checking
```

### Olivia's Personality During Paragraphical

- **Warm but purposeful** — she cares about getting good data, not just being nice
- **Knowledgeable** — she knows WHY each data point matters ("humidity affects X because...")
- **Never condescending** — "have you thought about..." not "you forgot to mention..."
- **Brief** — 2-3 sentences max per interjection, never a wall of text
- **Dismissible** — user can close/ignore any interjection, no penalty
- **Encouraging** — "This is great detail!" before any correction
- **Contextual** — her examples reference what the user actually wrote

---

## The 100-Page Report Blueprint

### Hard Ceiling: 100 Pages

The report is exactly 100 pages maximum. Not 100+. Not "around 100." One hundred.

**Why 100 is the ceiling:**
- **Gamma timeout**: LLM-Gamma starts timing out above 100 pages of rendered content
- **Token limits**: The report generation prompt + content approaches context window limits beyond this
- **User fatigue**: Research shows report engagement drops sharply after page 80. 100 is ambitious but digestible.
- **Quality**: 100 dense, visual, data-rich pages beats 150 pages with filler

**The data tables can be 250-300 field IDs** — that's the engine underneath. The report is the presentation layer that makes those field IDs meaningful, visual, and educational.

### Section-by-Section Blueprint

```
THE CLUES INTELLIGENCE REPORT — 100 PAGES
══════════════════════════════════════════

SECTION 1: COVER & EXECUTIVE SUMMARY (Pages 1-8)
─────────────────────────────────────────────────
  Page 1:  COVER PAGE
           - Full-bleed hero image of winning city (AI-generated or stock)
           - User's name, report date
           - CLUES Intelligence branding
           - Confidence badge (e.g., "87% Confidence")
           - Report tier label (Discovery / Validated / Precision)

  Page 2:  THE VERDICT — HERO SPREAD
           - Massive winner declaration: "Your Best City: [CITY]"
           - Radial gauge showing overall Smart Score (0-100)
           - Trophy icon, winner score in gold
           - Top 3 reasons WHY this city wins for YOU (not generic)
           - Runner-up cities with their scores (smaller)
           - VISUAL: Radial score gauge + city skyline overlay

  Page 3:  YOUR PROFILE SNAPSHOT
           - Who you are (from P1-P2 extraction)
           - Personality profile badge
           - Key priorities identified (top 5)
           - Household composition visual
           - Detected currency + budget range
           - VISUAL: Profile card with avatar silhouette, icons for each priority

  Page 4:  THE CATEGORY SHOWDOWN — 20-CATEGORY RADAR CHART
           - Spider/radar chart: winning city vs runner-up on all 20 categories
           - Each axis labeled with category name + icon
           - Winner in sapphire blue, runner-up in orange
           - Categories where winner dominates highlighted in green
           - Categories where runner-up is stronger highlighted in amber
           - VISUAL: Large radar chart, clean, readable

  Page 5:  SMART SCORE SUMMARY TABLE
           - All 20 categories listed
           - City 1 | City 2 | City 3 scores side by side
           - Horizontal bar chart per row
           - Winner of each category marked with gold star
           - Overall winner row at bottom in bold
           - VISUAL: Color-coded comparison table with embedded mini bar charts

  Page 6-7: YOUR METRICS AT A GLANCE
           - Heatmap of ALL extracted metrics (100-250) organized by category
           - Color intensity = how well the winning city scores
           - Hover data (in digital version): metric name, score, source
           - Categories with most metrics = user's biggest priorities (visual proof)
           - VISUAL: Large heatmap grid, category labels on Y-axis, metric density visible

  Page 8:  TABLE OF CONTENTS
           - Clean, navigable TOC with page numbers
           - Section thumbnails (small preview of what's on each section)
           - "How to read this report" sidebar
           - Report methodology badge (5-LLM + Opus Judge + Tavily)

SECTION 2: YOUR COUNTRY (Pages 9-16)
─────────────────────────────────────
  Page 9:  COUNTRY HERO
           - Full-bleed country image (flag + landmark + landscape composite)
           - "Why [COUNTRY] is Your Best Match"
           - Country at a glance: population, capital, currency, language, timezone
           - VISUAL: Magazine-style country hero spread

  Page 10: COUNTRY SCORECARD
           - National-level metrics: GDP, HDI, safety index, healthcare index
           - Comparison vs user's current country (side-by-side)
           - Immigration friendliness score
           - VISUAL: Scorecard with green/amber/red indicators

  Page 11: IMMIGRATION PATHWAY
           - Visa options available for user's nationality
           - Timeline: application → approval → residency → citizenship
           - Cost breakdown for visa/residency process
           - Key requirements and documents
           - VISUAL: Horizontal timeline infographic with milestone markers

  Page 12: COST OF LIVING NATIONAL OVERVIEW
           - National averages: rent, groceries, transport, healthcare, dining
           - Shown in DUAL CURRENCY (local + user's home currency)
           - Comparison bar chart vs user's current country
           - VISUAL: Donut chart of monthly budget allocation + comparison bars

  Page 13-14: COUNTRY DEEP DIVE
           - Cultural overview: what daily life feels like
           - Language landscape: English penetration, language learning resources
           - Digital infrastructure: internet rankings, tech adoption
           - Climate zones within the country (not all cities have same weather)
           - VISUAL: Mini-map showing climate zones, broadband coverage heatmap

  Page 15-16: RUNNER-UP COUNTRIES (if applicable)
           - Why they scored well but didn't win
           - Key differences from winner
           - "Consider [country] if [specific scenario]"
           - Quick scorecard comparison (2-3 rows)
           - VISUAL: Compact country comparison cards

SECTION 3: THE CITY SHOWDOWN (Pages 17-46) — THE CORE
──────────────────────────────────────────────────────
  Page 17: CITY SHOWDOWN INTRO
           - "We analyzed [X] cities. These 3 rose to the top."
           - City 1 | City 2 | City 3 hero images side by side
           - Overall Smart Scores displayed prominently
           - VISUAL: Three-panel city photo spread with score overlays

  Pages 18-19: OVERALL COMPARISON DASHBOARD
           - Three-column comparison table (like LifeScore)
           - Key metrics at a glance: cost of living, safety, weather, transit
           - Winner of each row highlighted
           - Overall winner trophy
           - VISUAL: Dense comparison table with color-coded cells

  Pages 20-39: CATEGORY-BY-CATEGORY DEEP DIVES (20 categories, 1 page each)
           Each category page follows the SAME template:
           ┌─────────────────────────────────────────────────────┐
           │ [CATEGORY ICON] [CATEGORY NAME]        Weight: [X]% │
           ├─────────────────────────────────────────────────────┤
           │                                                      │
           │ SCORE BARS (3 cities, horizontal)                    │
           │ ████████████████████████  City1: 87                  │
           │ ██████████████████        City2: 72                  │
           │ ████████████████████████████ City3: 91  ★ WINNER    │
           │                                                      │
           │ KEY METRICS TABLE (top 5-8 metrics for this category)│
           │ ┌──────────────┬────────┬────────┬────────┐         │
           │ │ Metric       │ City1  │ City2  │ City3  │         │
           │ ├──────────────┼────────┼────────┼────────┤         │
           │ │ Avg Temp     │ 22.4C  │ 18.1C  │ 24.7C  │         │
           │ │ Humidity     │ 55%    │ 68%    │ 42%    │         │
           │ │ Sunshine hrs │ 2,800  │ 2,400  │ 3,100  │         │
           │ └──────────────┴────────┴────────┴────────┘         │
           │                                                      │
           │ INSIGHT: 2-3 sentence narrative explaining           │
           │ what these scores mean for YOUR life                 │
           │                                                      │
           │ SOURCE: "Data from WeatherSpark, Climate-Data.org"   │
           │                                                      │
           │ MINI CHART: Bar chart, scatter plot, or gauge        │
           │ (chart TYPE varies by category for visual variety)    │
           └─────────────────────────────────────────────────────┘

           CHART TYPE ROTATION (for visual variety across 20 pages):
           - Climate: Temperature line graph (12 months)
           - Safety: Horizontal bar comparison
           - Healthcare: Radar chart (sub-metrics)
           - Housing: Donut chart (budget breakdown)
           - Transportation: Walkability/transit score gauge
           - Financial: Stacked bar (expense categories)
           - Legal: Checklist/boolean table (visa types)
           - LifeScore: Spider chart (freedom sub-categories)
           - Business: Bubble chart (ecosystem metrics)
           - Technology: Speed test visual / gauge
           - Education: Ranked list with school logos
           - Family: Icon grid (amenities available)
           - Social: Population pyramid / community size bars
           - Pets: Checklist (pet-friendly features)
           - Food: Pictograph (restaurant density)
           - Fitness: Availability matrix
           - Outdoor: Photo strip (nature highlights)
           - Culture: Event calendar density heatmap
           - Entertainment: Venue type pie chart
           - Spiritual: Map pins (places of worship)

  Pages 40-42: WINNING CITY PORTRAIT
           - Why [City] wins: narrative summary
           - "Your paragraph said [quote from P23] — here's how [City] delivers"
           - Day-in-the-life narrative (morning to night in winning city)
           - Local neighborhood character descriptions
           - VISUAL: Photo collage + pull quotes from user's own paragraphs

  Pages 43-44: RUNNER-UP CITY PROFILES
           - City 2: "Strong in [X], weaker in [Y] — consider if [scenario]"
           - City 3: Same format
           - What would need to change for each runner-up to win
           - VISUAL: Compact city cards with key differentiators

  Pages 45-46: SURPRISING FINDINGS
           - Counterintuitive results ("You'd expect [City2] to win on Safety, but...")
           - Metrics where the "obvious" choice lost
           - Hidden advantages of the winner
           - Hidden costs/risks of the runner-ups
           - VISUAL: "Did you know?" callout boxes with icons

SECTION 4: YOUR TOWN (Pages 47-56)
───────────────────────────────────
  Page 47: TOWN OVERVIEW
           - "Inside [Winning City]: Your Top 3 Towns"
           - Map showing town locations within the city
           - Quick comparison table
           - VISUAL: City map with 3 town pins + photos

  Pages 48-53: TOWN PROFILES (2 pages each, 3 towns)
           Each town spread:
           - Left page: Town photo, character description, walkability, vibe
           - Right page: Town-specific metrics
             - Rent prices (specific to this town)
             - Transit connections
             - Restaurant/café density
             - Safety rating
             - Expat population
             - School proximity (if applicable)
             - Green space / parks
           - VISUAL: Town photo + mini-map + metric cards

  Pages 54-55: TOWN COMPARISON TABLE
           - Side-by-side comparison of all 3 towns
           - Metrics specific to town-level decisions
           - Winner highlighted
           - "Best for [user priority]" labels
           - VISUAL: Clean comparison table with recommendation badges

  Page 56: WINNING TOWN DECLARATION
           - "Your Best Town: [TOWN]"
           - Why it wins for YOUR specific profile
           - Transition to neighborhood analysis
           - VISUAL: Town hero image with score overlay

SECTION 5: YOUR NEIGHBORHOOD (Pages 57-64)
───────────────────────────────────────────
  Page 57: NEIGHBORHOOD OVERVIEW
           - "Inside [Winning Town]: Your Top 3 Neighborhoods"
           - Street-level map with neighborhood boundaries
           - Quick comparison
           - VISUAL: Detailed neighborhood map with highlighted zones

  Pages 58-63: NEIGHBORHOOD PROFILES (2 pages each, 3 neighborhoods)
           Each neighborhood spread:
           - Street-level character: architecture, vibe, noise, foot traffic
           - Specific rental listings / price ranges
           - Walk-to amenities: grocery, café, gym, park, transit stop
           - Neighbor demographics (expat mix, families, young professionals)
           - Photo strip: street views, cafes, parks, buildings
           - VISUAL: Street photos + annotated walk-time map + lifestyle icons

  Page 64: YOUR NEW ADDRESS
           - "Your Best Neighborhood: [NEIGHBORHOOD]"
           - Final recommendation with full reasoning
           - "Start your housing search in [NEIGHBORHOOD] — here's what to look for"
           - VISUAL: Neighborhood hero shot + recommendation badge

SECTION 6: CRISTIANO'S VERDICT (Pages 65-72)
─────────────────────────────────────────────
  ** AESTHETIC: MI6 Briefing Room — midnight navy background, gold accents,
     glassmorphic cards, classified-document feel **

  Page 65: THE JUDGE'S CHAMBERS
           - Cristiano avatar portrait
           - "Judge's Report: Case #[report-id]"
           - Case summary: what was evaluated, how many metrics, how many sources
           - Confidence level declaration
           - VISUAL: Glassmorphic judge card on navy background

  Pages 66-69: CATEGORY-BY-CATEGORY JUDICIAL ANALYSIS
           - Each category gets a "court ruling" box:
             - Score adjustments made (upscores/downscores)
             - Which LLMs agreed, which disagreed
             - Judge's reasoning for any overrides
             - "Court Order": real-world example of what this means for user
           - 4-5 categories per page (the ones with most judicial action)
           - VISUAL: Gold-bordered ruling cards, gavel icons, verdict stamps

  Page 70: THE RULING
           - Final winner declaration
           - "Having reviewed all evidence across [X] metrics from [Y] sources,
             evaluated by [Z] independent AI models, this court finds..."
           - Key factors that sealed the verdict (top 5)
           - Dissenting opinions (where Opus disagreed with majority)
           - VISUAL: Full-page verdict declaration with gold seal

  Page 71: FUTURE OUTLOOK
           - 5-year trajectory for winning city
           - Trends: improving, stable, or declining per category
           - Risk factors to watch
           - "Best time to move" recommendation
           - VISUAL: Trend arrows + timeline projection chart

  Page 72: LLM CONSENSUS REPORT
           - Which 5 LLMs were used
           - Agreement levels (unanimous, strong, moderate, split)
           - StdDev chart showing where models agreed/disagreed
           - Metrics with highest disagreement + how Judge resolved them
           - VISUAL: Agreement heatmap + LLM logo badges

SECTION 7: YOUR LIFE BEFORE & AFTER (Pages 73-78)
──────────────────────────────────────────────────
  Page 73: SIDE-BY-SIDE COMPARISON
           - Current city vs winning city
           - Key metrics compared (weather, cost, safety, transit, etc.)
           - Green = improvement, Red = trade-off
           - VISUAL: Two-column comparison with green/red delta indicators

  Page 74: FINANCIAL TRANSFORMATION
           - Monthly budget: current city vs winning city
           - Category breakdown: rent, food, transport, healthcare, entertainment
           - Dual currency display
           - Net savings or additional cost per month
           - VISUAL: Side-by-side donut charts + monthly cash flow bar chart

  Page 75: QUALITY OF LIFE DELTA
           - Category-by-category: what gets better, what stays same, what's a trade-off
           - Prioritized by user's own weights (most important changes first)
           - "What changes most" narrative
           - VISUAL: Waterfall chart showing QoL improvement by category

  Pages 76-77: YOUR NEW LIFE — NARRATIVE SPREAD
           - Written in second person ("You wake up in your apartment in [neighborhood]...")
           - Weaves in real data: "your 5-minute walk to [actual café district name]"
           - References user's own Dream Day paragraph
           - Seasonal variation: what summer/winter look like
           - VISUAL: Full-bleed lifestyle photography + pull quotes

  Page 78: WHAT YOU TRADE
           - Honest acknowledgment of trade-offs
           - "You'll miss: [specific things from current city]"
           - "You'll gain: [specific things in new city]"
           - "The verdict: [net assessment]"
           - VISUAL: Balance scale graphic

SECTION 8: ACTION PLAN (Pages 79-86)
─────────────────────────────────────
  Page 79: IMMIGRATION ROADMAP
           - Step-by-step visa/residency pathway
           - Timeline with milestones
           - Key documents needed
           - Estimated costs per step
           - VISUAL: Horizontal Gantt-style timeline

  Page 80: FINANCIAL PLANNING CHECKLIST
           - Banking setup steps
           - Tax considerations (home country + destination)
           - Insurance transitions
           - Currency exchange strategy
           - VISUAL: Checklist with progress indicators

  Page 81: HOUSING SEARCH STRATEGY
           - Where to search (specific platforms for that country/city)
           - Price ranges by neighborhood (the 3 recommended ones)
           - Red flags to watch for
           - Recommended first steps (short-term rental → long-term)
           - VISUAL: Price range chart by neighborhood + platform logos

  Page 82: 90-DAY PLAN
           - Month 1: Research + applications
           - Month 2: Documentation + preparation
           - Month 3: Transition + arrival
           - Key milestones and deadlines
           - VISUAL: 90-day calendar with action items

  Pages 83-84: RESOURCE DIRECTORY
           - Expat communities and forums for this city
           - Government websites (immigration, tax)
           - Real estate platforms
           - Healthcare provider directories
           - Language schools
           - VISUAL: Resource cards with logos and descriptions

  Pages 85-86: CONFIDENCE BOOSTER — WHAT'S NEXT
           - Current confidence level and what it means
           - "Complete these modules to improve your results:"
           - Module recommendations with confidence gain per module
           - Before/after visualization: "Your report at 67% vs 92%"
           - VISUAL: Confidence meter + module recommendation cards with gain badges

SECTION 9: METHODOLOGY & EVIDENCE (Pages 87-96)
────────────────────────────────────────────────
  Page 87: HOW CLUES WORKS
           - Plain-language explanation of the system
           - 24 paragraphs → metric extraction → 5-LLM scoring → Opus Judge → Report
           - Why this is better than Googling / reading blogs
           - VISUAL: Pipeline flowchart (simple, clean)

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

## Development

See `CLAUDE.md` for WCAG 2.1 AA compliance rules, build rules, and development guidelines.
See `CLUES_MAIN_BUILD_REFERENCE.md` for overall system architecture and build state.
See `PARAGRAPHICAL_ARCHITECTURE.md` for the Paragraphical pipeline, Gemini prompt, metrics, Smart Scores, Cristiano judge, and report structure.

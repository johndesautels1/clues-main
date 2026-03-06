# Main Module — 100 Typeform Questions Reference

> **Source:** Consolidated from Core Module Draft (130Q) + MainModuleExpander.tsx UI structure
> **Structure:** 3 sections — Demographics (34Q), Do Not Wants (33Q), Must Haves (33Q)
> **Purpose:** Reference table for Paragraphical paragraph design and Gemini prompt engineering
> **Response Type Taxonomy:** See `CLUES_MAIN_BUILD_REFERENCE.md` Section 8
> **Note:** General Questions (50Q) are in GENERAL_QUESTIONS_REFERENCE.md — separate from this 100Q set

---

## Section 1: Demographics (Q1-Q34)

> Factual profile of the person — who they are, not what they want. Feeds Gemini's user profile construction.

| # | Question | Type |
|---|----------|------|
| 1 | What is your nationality or primary citizenship? | Single-select |
| 2 | Do you hold dual or multiple citizenships? If so, which countries? | Yes/No |
| 3 | What is your current country of residence? | Single-select |
| 4 | What is your age range? | Range |
| 5 | What is your current relationship status? (Select one: single, in a relationship, married, domestic partnership, divorced, widowed) | Single-select |
| 6 | Will your partner/spouse relocate with you? | Yes/No |
| 7 | Does your partner/spouse need work authorization in the new location? | Yes/No |
| 8 | Do you have children? | Yes/No |
| 9 | What are your children's age ranges? (Select all that apply: infant 0-2, toddler 3-5, elementary 6-10, middle school 11-13, high school 14-17, adult 18+) | Multi-select |
| 10 | Will all children relocate with you? | Yes/No |
| 11 | Do any of your children have special educational or medical needs? | Yes/No |
| 12 | What is your highest level of education completed? (Select one: high school, trade/vocational, associate's, bachelor's, master's, doctorate, professional degree) | Single-select |
| 13 | Are you involved in a skilled trade? If so, what specific trade certification do you hold? | Yes/No |
| 14 | Are you currently or formerly in the military? | Yes/No |
| 15 | Do you need access to military or veteran services in your new location? | Yes/No |
| 16 | What is your current employment status? (Select one: employed full-time, employed part-time, self-employed, business owner, retired, unemployed, student) | Single-select |
| 17 | Are you seeking employment in your new location, or will you work remotely/be self-employed? (Select one: seeking local employment, remote work, self-employed, business owner, retired, undecided) | Single-select |
| 18 | What is your primary industry or professional field? | Single-select |
| 19 | What is your preferred work arrangement? (Select one: fully remote, hybrid, in-office, freelance, retired) | Single-select |
| 20 | What is your annual household income (USD equivalent)? | Range |
| 21 | What percentage of your current income could you maintain if you relocated internationally? | Range |
| 22 | What is your current housing situation? (Select one: own, rent, live with family, other) | Single-select |
| 23 | What is your current monthly housing cost (USD equivalent)? | Range |
| 24 | How many bedrooms do you need in your new home? | Range |
| 25 | What type of area do you currently live in? (Select one: urban core, suburban, small town, rural) | Single-select |
| 26 | What is the approximate population of your current city or town? | Range |
| 27 | Do you have any chronic health conditions or special medical requirements? | Yes/No |
| 28 | What specific medical conditions require ongoing treatment or specialist access? (Select all that apply: cardiovascular, respiratory, diabetes, autoimmune, neurological, orthopedic, mental health, cancer/oncology, none) | Multi-select |
| 29 | What is your primary mode of daily transportation today? (Select one: personal car, public transit, bicycle, walking, ride-hailing, motorcycle, combination) | Single-select |
| 30 | Do you have pets that would relocate with you? | Yes/No |
| 31 | What type and how many pets do you have? (Select all that apply: dog(s), cat(s), bird(s), reptile(s), fish, small mammals, exotic pets, none) | Multi-select |
| 32 | Are any of your pets a breed that faces import restrictions in certain countries? | Yes/No |
| 33 | How many languages do you speak fluently, and which ones? | Multi-select |
| 34 | What is your relocation timeline? (Select one: immediate, 6 months, 1-2 years, 2+ years, exploring/no timeline) | Single-select |

---

## Section 2: Do Not Wants — Deal-Breakers (Q35-Q67)

> Negative filters — locations with these characteristics get penalized or eliminated. Each rated on a 1-5 severity scale (1 = mild preference to avoid, 5 = absolute deal-breaker). All use Dealbreaker type.

| # | Question | Type |
|---|----------|------|
| 35 | How much do you want to avoid extreme heat (regularly over 35C / 95F)? | Dealbreaker |
| 36 | How much do you want to avoid extreme cold (regularly below -10C / 14F)? | Dealbreaker |
| 37 | How much do you want to avoid high humidity and tropical climate conditions? | Dealbreaker |
| 38 | How much do you want to avoid significant natural disaster risks (earthquakes, hurricanes, floods, wildfires)? | Dealbreaker |
| 39 | How much do you want to avoid severe air pollution (regularly unhealthy air quality)? | Dealbreaker |
| 40 | How much do you want to avoid severe water quality or water shortage issues? | Dealbreaker |
| 41 | How much do you want to avoid language barriers you cannot overcome? | Dealbreaker |
| 42 | How much do you want to avoid living under restrictive social or religious laws? | Dealbreaker |
| 43 | How much do you want to avoid a lack of diversity or a monocultural environment? | Dealbreaker |
| 44 | How much do you want to avoid hostile attitudes toward foreigners or immigrants? | Dealbreaker |
| 45 | How much do you want to avoid gender-based or LGBTQ+ discrimination? | Dealbreaker |
| 46 | How much do you want to avoid religious intolerance or persecution? | Dealbreaker |
| 47 | How much do you want to avoid a poor or inaccessible healthcare system? | Dealbreaker |
| 48 | How much do you want to avoid unreliable infrastructure (power outages, poor roads, inconsistent utilities)? | Dealbreaker |
| 49 | How much do you want to avoid poor internet and telecommunications reliability? | Dealbreaker |
| 50 | How much do you want to avoid high taxes without adequate public services in return? | Dealbreaker |
| 51 | How much do you want to avoid a high cost of living that is not matched by quality of life? | Dealbreaker |
| 52 | How much do you want to avoid an unstable economy and volatile currency? | Dealbreaker |
| 53 | How much do you want to avoid living under an authoritarian or non-democratic government? | Dealbreaker |
| 54 | How much do you want to avoid systemic corruption and an unreliable legal system? | Dealbreaker |
| 55 | How much do you want to avoid political instability or civil unrest? | Dealbreaker |
| 56 | How much do you want to avoid high crime rates and personal safety concerns? | Dealbreaker |
| 57 | How much do you want to avoid a lack of personal safety for women and minorities? | Dealbreaker |
| 58 | How much do you want to avoid complex visa or residency complications? | Dealbreaker |
| 59 | How much do you want to avoid a car-dependent lifestyle with no viable alternatives? | Dealbreaker |
| 60 | How much do you want to avoid poor public transportation options? | Dealbreaker |
| 61 | How much do you want to avoid a lack of career or professional opportunities? | Dealbreaker |
| 62 | How much do you want to avoid lacking access to specific foods, products, or dietary needs? | Dealbreaker |
| 63 | How much do you want to avoid isolation from family and close friends? | Dealbreaker |
| 64 | How much do you want to avoid limited education options for your children? | Dealbreaker |
| 65 | How much do you want to avoid limited access to international airports and travel connectivity? | Dealbreaker |
| 66 | How much do you want to avoid excessive noise pollution or severe overcrowding? | Dealbreaker |
| 67 | How much do you want to avoid a lack of outdoor recreation, parks, and green spaces? | Dealbreaker |

---

## Section 3: Must Haves — Non-Negotiables (Q68-Q100)

> Positive requirements — locations with these characteristics get boosted. Each rated on a 1-5 importance scale (1 = nice to have, 5 = absolute requirement).

| # | Question | Type |
|---|----------|------|
| 68 | How important is it that English (or your primary language) is widely spoken? | Likert-Importance |
| 69 | How important is a welcoming attitude toward newcomers and foreigners? | Likert-Importance |
| 70 | How important is having job opportunities available in your professional field? | Likert-Importance |
| 71 | How important is the ability to legally work in your new location? | Likert-Importance |
| 72 | How important is a reasonable and affordable cost of living? | Likert-Importance |
| 73 | How important is affordable housing availability (rent or purchase)? | Likert-Importance |
| 74 | How important is a stable economy and reliable currency? | Likert-Importance |
| 75 | How important is strong legal protection for foreigners and property rights? | Likert-Importance |
| 76 | How important is access to quality healthcare and medical facilities? | Likert-Importance |
| 77 | How important is a low crime rate and strong personal safety? | Likert-Importance |
| 78 | How important is political stability and democratic governance? | Likert-Importance |
| 79 | How important is a clean environment (air, water, streets)? | Likert-Importance |
| 80 | How important is good air quality for daily life and outdoor activities? | Likert-Importance |
| 81 | How important is reliable high-speed internet and modern telecommunications? | Likert-Importance |
| 82 | How important is reliable utilities infrastructure (electricity, water, gas)? | Likert-Importance |
| 83 | How important is good public transportation and transit options? | Likert-Importance |
| 84 | How important are walkable neighborhoods where daily needs are nearby? | Likert-Importance |
| 85 | How important is proximity to an international airport with good connections? | Likert-Importance |
| 86 | How important is access to outdoor recreation, nature, and green spaces? | Likert-Importance |
| 87 | How important is a vibrant food scene with diverse dining options? | Likert-Importance |
| 88 | How important is access to cultural activities (museums, theater, arts)? | Likert-Importance |
| 89 | How important is access to fitness facilities and sports infrastructure? | Likert-Importance |
| 90 | How important is nightlife and entertainment options? | Likert-Importance |
| 91 | How important is a good education system (for you or your children)? | Likert-Importance |
| 92 | How important is access to professional networking and career development? | Likert-Importance |
| 93 | How important is a family-friendly environment with child-oriented resources? | Likert-Importance |
| 94 | How important is an expat or international community in your new location? | Likert-Importance |
| 95 | How important is access to your religious or spiritual community? | Likert-Importance |
| 96 | How important is a pet-friendly environment (parks, vets, pet-friendly housing)? | Likert-Importance |
| 97 | How important is a climate and weather pattern that suits your lifestyle preferences? | Likert-Importance |
| 98 | How important is the overall happiness and life satisfaction of residents in your prospective city? | Likert-Importance |
| 99 | How important is it that the community actively embraces diversity and inclusion? | Likert-Importance |
| 100 | How important is proximity to family, friends, or an existing support network? | Likert-Importance |

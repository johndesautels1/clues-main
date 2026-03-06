# Main Module — 100 Typeform Questions Reference

> **Source:** Consolidated from Core Module Draft (130Q) + MainModuleExpander.tsx UI structure
> **Structure:** 3 sections — Demographics (34Q), Do Not Wants (33Q), Must Haves (33Q)
> **Purpose:** Reference table for Paragraphical paragraph design and Gemini prompt engineering
> **Note:** General Questions (50Q) are in GENERAL_QUESTIONS_REFERENCE.md — separate from this 100Q set

---

## Section 1: Demographics (Q1-Q34)

> Factual profile of the person — who they are, not what they want. Feeds Gemini's user profile construction.

| # | Question |
|---|----------|
| 1 | What is your nationality or primary citizenship? |
| 2 | Do you hold dual or multiple citizenships? If so, which countries? |
| 3 | What is your current country of residence? |
| 4 | What is your age range? |
| 5 | What is your current relationship status? |
| 6 | Will your partner/spouse relocate with you? |
| 7 | Does your partner/spouse need work authorization in the new location? |
| 8 | Do you have children? |
| 9 | What are your children's age ranges? (Select all that apply) |
| 10 | Will all children relocate with you? |
| 11 | Do any of your children have special educational or medical needs? |
| 12 | What is your highest level of education completed? |
| 13 | Are you involved in a skilled trade? If so, what specific trade certification do you hold? |
| 14 | Are you currently or formerly in the military? |
| 15 | Do you need access to military or veteran services in your new location? |
| 16 | What is your current employment status? |
| 17 | Are you seeking employment in your new location, or will you work remotely/be self-employed? |
| 18 | What is your primary industry or professional field? |
| 19 | What is your preferred work arrangement (fully remote, hybrid, in-office, freelance, retired)? |
| 20 | What is your annual household income (USD equivalent)? |
| 21 | What percentage of your current income could you maintain if you relocated internationally? |
| 22 | What is your current housing situation (own, rent, other)? |
| 23 | What is your current monthly housing cost (USD equivalent)? |
| 24 | How many bedrooms do you need in your new home? |
| 25 | What type of area do you currently live in (urban core, suburban, small town, rural)? |
| 26 | What is the approximate population of your current city or town? |
| 27 | Do you have any chronic health conditions or special medical requirements? |
| 28 | What specific medical conditions require ongoing treatment or specialist access? |
| 29 | What is your primary mode of daily transportation today? |
| 30 | Do you have pets that would relocate with you? |
| 31 | What type and how many pets do you have? |
| 32 | Are any of your pets a breed that faces import restrictions in certain countries? |
| 33 | How many languages do you speak fluently, and which ones? |
| 34 | What is your relocation timeline (immediate, 6 months, 1-2 years, exploring)? |

---

## Section 2: Do Not Wants — Deal-Breakers (Q35-Q67)

> Negative filters — locations with these characteristics get penalized or eliminated. Each rated on a 1-5 severity scale (1 = mild preference to avoid, 5 = absolute deal-breaker).

| # | Question |
|---|----------|
| 35 | How much do you want to avoid extreme heat (regularly over 35C / 95F)? |
| 36 | How much do you want to avoid extreme cold (regularly below -10C / 14F)? |
| 37 | How much do you want to avoid high humidity and tropical climate conditions? |
| 38 | How much do you want to avoid significant natural disaster risks (earthquakes, hurricanes, floods, wildfires)? |
| 39 | How much do you want to avoid severe air pollution (regularly unhealthy air quality)? |
| 40 | How much do you want to avoid severe water quality or water shortage issues? |
| 41 | How much do you want to avoid language barriers you cannot overcome? |
| 42 | How much do you want to avoid living under restrictive social or religious laws? |
| 43 | How much do you want to avoid a lack of diversity or a monocultural environment? |
| 44 | How much do you want to avoid hostile attitudes toward foreigners or immigrants? |
| 45 | How much do you want to avoid gender-based or LGBTQ+ discrimination? |
| 46 | How much do you want to avoid religious intolerance or persecution? |
| 47 | How much do you want to avoid a poor or inaccessible healthcare system? |
| 48 | How much do you want to avoid unreliable infrastructure (power outages, poor roads, inconsistent utilities)? |
| 49 | How much do you want to avoid poor internet and telecommunications reliability? |
| 50 | How much do you want to avoid high taxes without adequate public services in return? |
| 51 | How much do you want to avoid a high cost of living that is not matched by quality of life? |
| 52 | How much do you want to avoid an unstable economy and volatile currency? |
| 53 | How much do you want to avoid living under an authoritarian or non-democratic government? |
| 54 | How much do you want to avoid systemic corruption and an unreliable legal system? |
| 55 | How much do you want to avoid political instability or civil unrest? |
| 56 | How much do you want to avoid high crime rates and personal safety concerns? |
| 57 | How much do you want to avoid a lack of personal safety for women and minorities? |
| 58 | How much do you want to avoid complex visa or residency complications? |
| 59 | How much do you want to avoid a car-dependent lifestyle with no viable alternatives? |
| 60 | How much do you want to avoid poor public transportation options? |
| 61 | How much do you want to avoid a lack of career or professional opportunities? |
| 62 | How much do you want to avoid lacking access to specific foods, products, or dietary needs? |
| 63 | How much do you want to avoid isolation from family and close friends? |
| 64 | How much do you want to avoid limited education options for your children? |
| 65 | How much do you want to avoid limited access to international airports and travel connectivity? |
| 66 | How much do you want to avoid excessive noise pollution or severe overcrowding? |
| 67 | How much do you want to avoid a lack of outdoor recreation, parks, and green spaces? |

---

## Section 3: Must Haves — Non-Negotiables (Q68-Q100)

> Positive requirements — locations with these characteristics get boosted. Each rated on a 1-5 importance scale (1 = nice to have, 5 = absolute requirement).

| # | Question |
|---|----------|
| 68 | How important is it that English (or your primary language) is widely spoken? |
| 69 | How important is a welcoming attitude toward newcomers and foreigners? |
| 70 | How important is having job opportunities available in your professional field? |
| 71 | How important is the ability to legally work in your new location? |
| 72 | How important is a reasonable and affordable cost of living? |
| 73 | How important is affordable housing availability (rent or purchase)? |
| 74 | How important is a stable economy and reliable currency? |
| 75 | How important is strong legal protection for foreigners and property rights? |
| 76 | How important is access to quality healthcare and medical facilities? |
| 77 | How important is a low crime rate and strong personal safety? |
| 78 | How important is political stability and democratic governance? |
| 79 | How important is a clean environment (air, water, streets)? |
| 80 | How important is good air quality for daily life and outdoor activities? |
| 81 | How important is reliable high-speed internet and modern telecommunications? |
| 82 | How important is reliable utilities infrastructure (electricity, water, gas)? |
| 83 | How important is good public transportation and transit options? |
| 84 | How important are walkable neighborhoods where daily needs are nearby? |
| 85 | How important is proximity to an international airport with good connections? |
| 86 | How important is access to outdoor recreation, nature, and green spaces? |
| 87 | How important is a vibrant food scene with diverse dining options? |
| 88 | How important is access to cultural activities (museums, theater, arts)? |
| 89 | How important is access to fitness facilities and sports infrastructure? |
| 90 | How important is nightlife and entertainment options? |
| 91 | How important is a good education system (for you or your children)? |
| 92 | How important is access to professional networking and career development? |
| 93 | How important is a family-friendly environment with child-oriented resources? |
| 94 | How important is an expat or international community in your new location? |
| 95 | How important is access to your religious or spiritual community? |
| 96 | How important is a pet-friendly environment (parks, vets, pet-friendly housing)? |
| 97 | How important is a climate and weather pattern that suits your lifestyle preferences? |
| 98 | How important is the overall happiness and life satisfaction of residents in your prospective city? |
| 99 | How important is it that the community actively embraces diversity and inclusion? |
| 100 | How important is proximity to family, friends, or an existing support network? |

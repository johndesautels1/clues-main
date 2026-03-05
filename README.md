# CLUES Intelligence — Main Platform

## Overview

CLUES Intelligence is a relocation and lifestyle intelligence platform that helps users find their **Best City, Best Town, and Best Neighborhood** anywhere in the world. The system uses AI-powered analysis across 20 life categories to deliver personalized, data-driven recommendations.

This is **not** a law-based app (unlike LifeScore, which focuses on legal freedom metrics). CLUES Main is a **quality-of-life fit** platform — scoring how well a location matches a specific user's lifestyle, priorities, and needs.

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **AI:** Google Gemini (Paragraphical pipeline), Cristiano Judge system
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

## The Report

- **Target: 100+ pages** (up from LifeScore's 82-page report) — this is the most important report our company produces
- **Living document** — grows in depth and confidence as the user progresses through the funnel
- Page count scales with data quality: early reports (Paragraphical only) are lighter with higher margin of error; fully-loaded reports (all recommended modules complete) reach maximum depth
- Report explicitly tells users which modules to complete and what effect it will have on confidence
- **No fixed template** — section depth is proportional to available data for that user
- Comparison format, country/town/neighborhood depth, and exact section breakdown are under active design (see design notes below)

### Open Design Questions
- Metrics per category: minimum per category + natural weighting from paragraph emphasis?
- City comparison format: side-by-side 3-column tables vs ranked lists?
- Country-level section depth (new — LifeScore didn't have this)
- Town & Neighborhood granularity (different metrics apply at different geographic scales)
- Persona presets (Balanced, Digital Nomad, Entrepreneur, Family, etc.) — yes or no?

---

## Development

See `CLAUDE.md` for WCAG 2.1 AA compliance rules, build rules, and development guidelines.
See `CLUES_MAIN_BUILD_REFERENCE.md` for overall system architecture and build state.
See `PARAGRAPHICAL_ARCHITECTURE.md` for the Paragraphical pipeline, Gemini prompt, metrics, Smart Scores, Cristiano judge, and report structure.

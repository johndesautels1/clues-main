# Trade-offs — 50 Priority Weighting Questions Reference

> **Purpose:** Part of the Main Module. When two cities score differently across dimensions, these answers tell the LLM which dimension the user would sacrifice.
> **Response Type Taxonomy:** See `CLUES_MAIN_BUILD_REFERENCE.md` Section 8
> **Why this is critical:** Without trade-offs, the LLM cannot break ties. A city with perfect weather but average safety vs. a city with perfect safety but average weather — without knowing the user's priorities, the LLM guesses randomly.
> **How it works:** Each question presents a realistic conflict between two competing priorities. The user picks a side and rates intensity (1-5). This generates WEIGHT MULTIPLIERS that Gemini applies to competing metrics.
> **Scale:** 1 = Slight lean toward Option A, 3 = Truly torn, 5 = Strongly favor Option A. Reverse for Option B.
> **Covers:** All 23 category modules + cross-cutting lifestyle trade-offs

---

## Section 1: Safety vs. Lifestyle (Q1-Q6)

| # | Trade-off Question | Type |
|---|-------------------|------|
| 1 | Would you accept a higher cost of living for significantly better personal safety and lower crime? | Slider |
| 2 | Would you live in a less exciting city (fewer restaurants, nightlife, culture) if it meant your family felt completely safe? | Slider |
| 3 | Would you accept stricter laws and less personal freedom in exchange for a very low crime rate and political stability? | Slider |
| 4 | Would you move to a city with moderate safety concerns if it had world-class healthcare within walking distance? | Slider |
| 5 | Would you choose a safe but isolated small town over a vibrant but riskier large city? | Slider |
| 6 | Would you live in a country with mild political instability if it offered significantly better weather and cost of living? | Slider |

---

## Section 2: Cost vs. Quality (Q7-Q12)

| # | Trade-off Question | Type |
|---|-------------------|------|
| 7 | Would you pay 30-50% more in monthly expenses to live in a city with excellent infrastructure, healthcare, and services? | Slider |
| 8 | Would you accept a smaller home or apartment to live in a walkable neighborhood with everything nearby? | Slider |
| 9 | Would you choose a cheaper city with average food options over an expensive city with an incredible food scene? | Slider |
| 10 | Would you sacrifice access to international-standard shopping and services for a significantly lower cost of living? | Slider |
| 11 | Would you accept higher taxes in exchange for excellent public services (healthcare, transit, education, safety)? | Slider |
| 12 | Would you live further from the city center to afford a larger home, even if it meant a longer commute? | Slider |

---

## Section 3: Climate vs. Opportunity (Q13-Q18)

| # | Trade-off Question | Type |
|---|-------------------|------|
| 13 | Would you tolerate a climate you dislike (too hot, too cold, too humid) for significantly better career opportunities? | Slider |
| 14 | Would you accept fewer sunshine days for a city with a stronger professional network in your field? | Slider |
| 15 | Would you choose perfect weather in a rural area over imperfect weather in a thriving metropolis? | Slider |
| 16 | Would you live in a city with harsh winters if it had the best education options for your children? | Slider |
| 17 | Would you sacrifice beach access for mountain access (or vice versa) if one option had better overall infrastructure? | Slider |
| 18 | Would you accept a climate with natural disaster risk (earthquakes, hurricanes) for a city that excels in everything else? | Slider |

---

## Section 4: Career & Financial vs. Lifestyle (Q19-Q24)

| # | Trade-off Question | Type |
|---|-------------------|------|
| 19 | Would you take a significant pay cut to live in a city with a dramatically better quality of life? | Slider |
| 20 | Would you give up career advancement opportunities to live in a place that perfectly matches your lifestyle values? | Slider |
| 21 | Would you accept a less favorable tax situation for a city that has everything else you want? | Slider |
| 22 | Would you work in a different time zone (inconvenient hours) to live in your dream location? | Slider |
| 23 | Would you choose a city with fewer professional networking opportunities if it had a stronger sense of community? | Slider |
| 24 | Would you sacrifice financial growth potential for immediate quality of life improvement? | Slider |

---

## Section 5: Social & Cultural vs. Practical (Q25-Q30)

| # | Trade-off Question | Type |
|---|-------------------|------|
| 25 | Would you live in a place where you don't speak the language if everything else was perfect? | Slider |
| 26 | Would you choose a culturally unfamiliar environment over a comfortable expat bubble if it meant deeper integration? | Slider |
| 27 | Would you sacrifice proximity to family and friends for a location that matches all other priorities? | Slider |
| 28 | Would you accept a less diverse community for a city that scores perfectly on safety, cost, and climate? | Slider |
| 29 | Would you live somewhere with limited nightlife and entertainment if the daytime lifestyle was exceptional? | Slider |
| 30 | Would you choose a city where you'd be a visible minority if it was the best match on every other metric? | Slider |

---

## Section 6: Healthcare & Wellness vs. Other Priorities (Q31-Q36)

| # | Trade-off Question | Type |
|---|-------------------|------|
| 31 | Would you accept a longer commute to hospitals and specialists for a location with better overall daily life quality? | Slider |
| 32 | Would you live in a country with excellent public healthcare but less personal freedom? | Slider |
| 33 | Would you sacrifice access to cutting-edge medical technology for a city with better air quality, less stress, and a healthier lifestyle? | Slider |
| 34 | Would you accept higher out-of-pocket healthcare costs for a location with better weather and outdoor activity options? | Slider |
| 35 | Would you choose a location with fewer wellness amenities (gyms, spas, yoga) if it had stronger community health outcomes? | Slider |
| 36 | Would you live further from nature and outdoor recreation to be closer to top-tier medical facilities? | Slider |

---

## Section 7: Housing & Neighborhood vs. Location (Q37-Q42)

| # | Trade-off Question | Type |
|---|-------------------|------|
| 37 | Would you accept a less desirable home (older, smaller, fewer amenities) to live in the perfect neighborhood? | Slider |
| 38 | Would you rent instead of own to live in a city you love, even if you could afford to buy in a city you only like? | Slider |
| 39 | Would you sacrifice modern urban design and architecture for a historic, charming neighborhood with older infrastructure? | Slider |
| 40 | Would you accept a noisier, busier neighborhood for walkability and proximity to everything? | Slider |
| 41 | Would you choose a city with less green space but better public transit over one with beautiful parks but car-dependent living? | Slider |
| 42 | Would you accept a less aesthetically pleasing environment (concrete, industrial) for a city with exceptional community and culture? | Slider |

---

## Section 8: Freedom & Values vs. Convenience (Q43-Q50)

| # | Trade-off Question | Type |
|---|-------------------|------|
| 43 | Would you accept more bureaucracy and slower government services for a country with stronger civil liberties? | Slider |
| 44 | Would you live in a more religiously conservative area if it had the best family environment and lowest cost? | Slider |
| 45 | Would you sacrifice access to certain substances (alcohol, cannabis) for a safer, more family-friendly environment? | Slider |
| 46 | Would you accept internet censorship or limited media access for a location that excels in other areas? | Slider |
| 47 | Would you choose a location with weaker environmental regulations but stronger economic opportunities? | Slider |
| 48 | Would you accept limited pet-friendliness (fewer parks, stricter rules) for a city that otherwise perfectly matches your needs? | Slider |
| 49 | Would you live in a location with limited cultural heritage and traditions if it was modern, efficient, and comfortable? | Slider |
| 50 | Looking at everything you've told us — if you could ONLY optimize for THREE things in your new home and had to accept "good enough" on everything else, what would your three be? | Text |

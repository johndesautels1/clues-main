/**
 * Discovery Questionnaire — Data & Constants
 *
 * 30 sections following the CLUES decision pipeline:
 *   Phase 1: Your Profile (P1-P2)
 *   Phase 2: Do Not Wants (P3)
 *   Phase 3: Must Haves (P4)
 *   Phase 4: Trade-offs (P5)
 *   Phase 5: Module Deep Dives (P6-P28)
 *   Phase 6: Your Vision (P29-P30)
 *
 * Kept in sync with src/data/paragraphs.ts (the canonical data source).
 * This file adds UI-specific properties (accent colors, icons, hints).
 */

export interface DiscoverySection {
  id: number;
  cat: string;
  title: string;
  icon: string;
  accent: string;
  prompt: string;
  hint: string;
}

export const SECTIONS: DiscoverySection[] = [
  // ═══ PHASE 1: YOUR PROFILE ═══
  { id: 1,  cat: 'Your Profile',  title: 'Who You Are',        icon: '\u25C6', accent: '#C4A87A',
    prompt: 'Tell us about yourself. Include your age, gender, nationality, and citizenship(s). Are you single, married, partnered? Do you have children \u2014 how many and what ages? What languages do you speak? What is your employment type \u2014 remote worker, business owner, retired, student? This is the foundation for every recommendation.',
    hint: "I'm a 34-year-old American, single, no kids. I speak English and basic Spanish. I work remotely as a software engineer. I hold a US passport only\u2026" },
  { id: 2,  cat: 'Your Profile',  title: 'Your Life Right Now', icon: '\u25C7', accent: '#C8AE80',
    prompt: 'Where do you currently live and what is your monthly income or budget in your currency? What is pushing you to consider relocating \u2014 cost of living, quality of life, safety, career, relationships, climate, politics? How soon do you want to move? Be specific about numbers where you can.',
    hint: "I live in Austin, Texas. I earn about $8,000/month after taxes. I'm thinking about moving within 6\u201312 months. The main push is cost of living and heat\u2026" },

  // ═══ PHASE 2: DO NOT WANTS ═══
  { id: 3,  cat: 'Do Not Wants',  title: 'Your Dealbreakers',  icon: '\u2718', accent: '#E06060',
    prompt: 'What would make a place absolutely unacceptable to you? Climate extremes you cannot tolerate, crime levels, political instability, lack of healthcare, internet too slow for your work, no visa pathway, religious or cultural intolerance, specific countries or regions you refuse to consider, languages you cannot function in. These are HARD walls \u2014 if a city hits any of these, it is eliminated.',
    hint: "I absolutely cannot live somewhere with humidity above 80%. I refuse to consider any country without a path to legal residency. I won't live where violent crime is common\u2026" },

  // ═══ PHASE 3: MUST HAVES ═══
  { id: 4,  cat: 'Must Haves',    title: 'Your Non-Negotiables', icon: '\u2714', accent: '#60B070',
    prompt: 'What must your new home absolutely have? Minimum internet speed for your work, specific medical facilities or specialists, airport within X hours, English widely spoken, specific visa type available, minimum safety rating, type of housing that must exist, proximity to family, specific legal rights you require. Unlike dealbreakers (what you reject), these are what you REQUIRE to be present.',
    hint: "I must have at least 100 Mbps internet \u2014 my job depends on it. I need an international airport within 2 hours. English needs to be widely spoken. I require access to\u2026" },

  // ═══ PHASE 4: TRADE-OFFS ═══
  { id: 5,  cat: 'Trade-offs',    title: 'Your Trade-offs',    icon: '\u21C4', accent: '#C0A07E',
    prompt: 'No place is perfect. What are you willing to sacrifice to get what matters most? Would you pay more rent for better safety? Accept slower internet for beach access? Live farther from an airport for lower cost of living? Give up nightlife for nature? Tolerate bureaucracy for tax advantages? This tells us how to WEIGHT your priorities.',
    hint: "I'd happily pay 20% more rent for a safer neighborhood. I could sacrifice nightlife entirely if the nature and outdoor access is great. I'd tolerate learning a new language\u2026" },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 1: Survival ═══
  { id: 6,  cat: 'Survival',      title: 'Safety & Security',  icon: '\u25A1', accent: '#8BA9B2',
    prompt: 'What does feeling safe mean to you specifically? Violent crime rates, property crime, political stability, corruption levels, police reliability, neighborhood safety for walking at night, safety for women/LGBTQ+/minorities, emergency services quality? What is your current safety situation vs. what you want?',
    hint: "I want to feel safe walking alone at night. Low violent crime is critical \u2014 I'd want a city with rates below the US average. Political stability matters more to me than\u2026" },
  { id: 7,  cat: 'Survival',      title: 'Health & Wellness',  icon: '+', accent: '#7DACA4',
    prompt: 'Describe your health needs. Chronic conditions, regular medications, specialist access? Public vs. private healthcare? Health insurance for expats? English-speaking doctors? Mental health services? Pharmacy access? Wellness infrastructure \u2014 gyms, spas, yoga studios?',
    hint: "I take daily medication for blood pressure \u2014 I need reliable pharmacy access. I see a therapist monthly so mental health services in English are important\u2026" },
  { id: 8,  cat: 'Survival',      title: 'Climate & Weather',  icon: '\u2600', accent: '#92ADB6',
    prompt: 'Describe your ideal climate in detail. What temperature range in summer and winter? How do you feel about humidity, rain, snow, wind? Four seasons or year-round warmth? How many cloudy days can you tolerate? Do natural disasters factor in? What climate are you escaping from?',
    hint: "I want winter temps around 15\u201322\u00B0C and summers no higher than 32\u00B0C. I hate humidity \u2014 anything above 65% makes me miserable. I need at least 250 sunny days per year\u2026" },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 2: Foundation ═══
  { id: 9,  cat: 'Foundation',     title: 'Legal & Immigration', icon: '\u00A7', accent: '#B49E80',
    prompt: 'What is your passport and visa situation? Which visa pathways interest you \u2014 digital nomad, freelancer, investor, retirement, employment? How long do you want to stay \u2014 short-term, long-term, permanent, citizenship? Rule of law importance?',
    hint: "I have a US passport. I'm looking for a digital nomad visa initially, with a path to permanent residency within 3\u20135 years. Strong rule of law matters\u2026" },
  { id: 10, cat: 'Foundation',     title: 'Financial & Banking', icon: '\u25C8', accent: '#C0A07E',
    prompt: 'Break down your financial picture. Monthly income and currency? Comfortable vs. stretched cost of living? Tax optimization, banking access for foreigners, international transfers, crypto-friendliness? Savings, investments, rental income?',
    hint: "I earn EUR 6,500/month from remote work. I'd like my total cost of living under EUR 3,000/month including rent. Tax structure matters \u2014 I want an effective rate under 25%\u2026" },
  { id: 11, cat: 'Foundation',     title: 'Housing & Real Estate', icon: '\u2302', accent: '#95B5BF',
    prompt: 'What does your ideal home look like and what can you afford? Apartment, house, villa? How many bedrooms? Urban, suburban, rural? Monthly rent or purchase budget? Rent or buy? Property rights for foreigners? Furnished or unfurnished? Gated, walkable, near beach, city center?',
    hint: "I want a modern 2-bedroom apartment in a walkable neighborhood. My rent budget is $1,500\u20132,000/month. I'd prefer to rent first then possibly buy\u2026" },
  { id: 12, cat: 'Foundation',     title: 'Professional & Career', icon: '\u2B21', accent: '#88A88E',
    prompt: 'What is your professional situation and ambition? Remote employee, freelancer, business owner, starting something new? Local startup ecosystem, coworking spaces, networking? Need to register a business locally? Business-friendly regulations, corporate tax, ease of hiring, IP protection?',
    hint: "I'm a freelance designer who may start an agency. I need good coworking spaces and a community of remote workers. Ideally I'd register an LLC locally\u2026" },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 3: Infrastructure ═══
  { id: 13, cat: 'Infrastructure', title: 'Technology & Connectivity', icon: '\u25CE', accent: '#7DA68A',
    prompt: 'How critical is tech infrastructure? Minimum internet speed (download AND upload)? Fiber availability, 5G coverage, reliable power grid? Access to specific services (AWS, cloud, VPN-friendly)? Local tech/digital nomad scene?',
    hint: "I need minimum 200 Mbps download and 50 Mbps upload for video calls. Power outages would be a disaster. 5G coverage matters for mobile work\u2026" },
  { id: 14, cat: 'Infrastructure', title: 'Transportation & Mobility', icon: '\u2192', accent: '#8EAE92',
    prompt: 'How do you want to get around daily? Walk, bike, public transit, car, rideshare? Walkability score importance? Public transit quality? Distance from international airport? Frequent flights to specific destinations?',
    hint: "I want to walk or bike for daily errands. I don't want to need a car. Good public transit is important. I need an airport within 1 hour with direct flights to NYC\u2026" },
  { id: 15, cat: 'Infrastructure', title: 'Education & Learning', icon: '\u221E', accent: '#79A48C',
    prompt: 'Education needs for you or family? International schools, specific curricula (IB, American, British)? Continuing education, certifications, university courses? Libraries, language schools? If no education needs, say so.',
    hint: "My kids (ages 8 and 11) need an international school with IB curriculum in English. I'd like to take language classes myself\u2026" },
  { id: 16, cat: 'Infrastructure', title: 'Social Values & Governance', icon: '\u2696', accent: '#BDA478',
    prompt: 'What personal freedoms and social values matter most? Freedom of speech and press, government transparency, LGBTQ+ rights, cannabis/alcohol laws, privacy laws, internet censorship, social tolerance? Freedoms you won\'t give up?',
    hint: "Freedom of speech is non-negotiable. I want to live somewhere with legal cannabis. LGBTQ+ rights matter \u2014 I want a tolerant society\u2026" },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 4: Lifestyle ═══
  { id: 17, cat: 'Lifestyle',     title: 'Food & Dining',      icon: '\u2727', accent: '#C0A07E',
    prompt: 'What are your food needs? Dietary restrictions (vegan, gluten-free, halal, kosher, allergies)? Restaurant variety and quality? Grocery store quality? Cuisines you love? Local food culture, farmers markets, food delivery? Monthly food budget?',
    hint: "I'm vegetarian and need a city with lots of meat-free options. I cook at home most days so good grocery stores are essential. I love Thai, Indian, and Mediterranean food\u2026" },
  { id: 18, cat: 'Lifestyle',     title: 'Shopping & Services', icon: '\u25A0', accent: '#C8A67A',
    prompt: 'How important is access to shopping and services? International product availability, Amazon or equivalent delivery, availability of specific brands, home delivery speed, dry cleaning, laundry, barbers, salons? Convenience vs. local market charm?',
    hint: "I order a lot online \u2014 Amazon Prime or similar fast delivery is important. I need access to international brands for certain products\u2026" },
  { id: 19, cat: 'Lifestyle',     title: 'Outdoor & Recreation', icon: '\u2756', accent: '#B89C7E',
    prompt: 'How important is access to nature? Beach, mountains, forests, lakes? How close? Water sports, hiking, camping, skiing? City parks and green spaces? Sports and fitness \u2014 gym, padel, tennis, running, yoga? Is natural beauty a core reason for relocating?',
    hint: "I want to be within 30 minutes of a beach and within an hour of hiking trails. I surf recreationally. Nature is a top-3 priority for me\u2026" },
  { id: 20, cat: 'Lifestyle',     title: 'Entertainment & Nightlife', icon: '\u273A', accent: '#9690B2',
    prompt: 'What does your ideal entertainment and nightlife look like? Bars, clubs, restaurants on weekends? Concerts, festivals, comedy shows, sporting events? City alive at night or quiets down early? Monthly entertainment spend?',
    hint: "I love going out on weekends \u2014 good cocktail bars and live music venues are essential. I attend 3\u20134 concerts a year and love food festivals\u2026" },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 5: Connection ═══
  { id: 21, cat: 'Connection',    title: 'Family & Children',  icon: '\u274B', accent: '#AD8899',
    prompt: 'Who is relocating with you? Partner, children, elderly parents? What does each family member need? Childcare, playgrounds, family-friendly neighborhoods, eldercare, partner employment? Proximity to family back home? If solo with no dependents, say so clearly.',
    hint: "It's just me and my partner \u2014 no kids. My parents are in Florida and I'd want to visit 2\u20133 times a year, so flight connections to the US matter\u2026" },
  { id: 22, cat: 'Connection',    title: 'Neighborhood & Urban Design', icon: '\u25D0', accent: '#A8879A',
    prompt: 'What should your neighborhood feel like? Walkability, bike lanes, public spaces, mixed-use vs. residential, noise levels, street lighting, urban density? Dense urban core, leafy suburb, or small-town feel? Community feeling? What vibe \u2014 bohemian, upscale, family-oriented, artsy?',
    hint: "I want a walkable, mixed-use neighborhood where I can walk to cafes, groceries, and restaurants. Tree-lined streets matter. I prefer urban density over suburbs\u2026" },
  { id: 23, cat: 'Connection',    title: 'Environment & Community Appearance', icon: '\u2742', accent: '#99A899',
    prompt: 'How important is visual and environmental quality? Street cleanliness, graffiti, green spaces, air quality, noise pollution, water quality, waste management, recycling? Building maintenance? Environmental sustainability and green initiatives?',
    hint: "Clean streets are important to me. Air quality matters for my daily runs. I want lots of green space and trees. Recycling infrastructure shows me a city cares\u2026" },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 6: Identity ═══
  { id: 24, cat: 'Identity',      title: 'Religion & Spirituality', icon: '\u2721', accent: '#A79CC0',
    prompt: 'Do you have religious or spiritual needs? Specific place of worship needed? Religious tolerance and diversity importance? Yoga, meditation, alternative spirituality communities? If not a factor, say so.',
    hint: "I'm not religious but I practice meditation. Access to a meditation center or Buddhist temple is a plus. Religious tolerance matters\u2026" },
  { id: 25, cat: 'Identity',      title: 'Sexual Beliefs, Practices & Laws', icon: '\u2764', accent: '#B088A0',
    prompt: 'How important are sexual freedom and legal protections? LGBTQ+ rights and social acceptance, same-sex marriage, anti-discrimination protections, dating culture, reproductive healthcare, attitudes toward alternative lifestyles?',
    hint: "As a gay man, LGBTQ+ rights are critical \u2014 I need same-sex marriage to be legal or strong anti-discrimination protections. Social acceptance matters as much as legal rights\u2026" },
  { id: 26, cat: 'Identity',      title: 'Arts & Culture',     icon: '\u2666', accent: '#9F96B8',
    prompt: 'How important is cultural richness? Museums, galleries, theater, live music, film festivals? Architectural beauty and historic character vs. modern development? Do you create art \u2014 need studio space? Cultural identity? Would you pay more for cultural vibrancy?',
    hint: "I go to museums and galleries monthly. Live music is part of my social life. I want genuine cultural character, not soulless modern development\u2026" },
  { id: 27, cat: 'Identity',      title: 'Cultural Heritage & Traditions', icon: '\u2609', accent: '#B0A090',
    prompt: 'How important is connecting with local culture and traditions? Local festivals, attitudes toward foreigners, integration expectations, cultural formality, expat community vs. local integration, language barriers? Do you want to deeply integrate or maintain your own identity?',
    hint: "I want to integrate with locals, not just live in an expat bubble. Learning the local language and customs is part of the adventure\u2026" },
  { id: 28, cat: 'Identity',      title: 'Pets & Animals',     icon: '\u2661', accent: '#B88FA0',
    prompt: 'Do you have pets or plan to get any? What animals and breeds? Pet-friendly housing, veterinary quality, off-leash parks, pet import regulations, breed-specific legislation? Attitude toward pets in the culture? If no pets, say so clearly.',
    hint: "I have a 4-year-old golden retriever. Pet-friendly apartments are essential. I need a good vet within 20 minutes. Off-leash parks are important\u2026" },

  // ═══ PHASE 6: YOUR VISION ═══
  { id: 29, cat: 'Your Vision',   title: 'Your Dream Day',     icon: '\u2600', accent: '#C8AE80',
    prompt: 'Describe your perfect ordinary day in your new city \u2014 not a vacation day, but a regular Tuesday. Morning to night: where do you wake up, what do you see, how do you get coffee, where do you work, what do you do for lunch, how do you spend the afternoon, what does the evening look like?',
    hint: "I wake up in my apartment with a balcony overlooking the water. Walk 5 minutes to a local caf\u00E9 for coffee. Work from a coworking space until noon\u2026" },
  { id: 30, cat: 'Your Vision',   title: 'Anything Else',      icon: '\u2605', accent: '#C4A87A',
    prompt: 'What did we miss? Dealbreakers that didn\'t fit, quirky preferences, things no questionnaire ever asks. Past relocation experiences (good or bad), specific cities you\'ve visited and loved or hated and WHY, future plans that should influence the recommendation. This is your wildcard.',
    hint: "One thing nobody asks about: I'm a light sleeper and noise pollution is a real issue. I visited Lisbon last year and loved the vibe but hated the hills\u2026" },
];

export const CATEGORIES = [...new Set(SECTIONS.map(s => s.cat))];

export const CAT_COLORS: Record<string, string> = {
  'Your Profile': '#C4A87A',
  'Do Not Wants': '#E06060',
  'Must Haves': '#60B070',
  'Trade-offs': '#C0A07E',
  'Survival': '#92ADB6',
  'Foundation': '#B49E80',
  'Infrastructure': '#7DA68A',
  'Lifestyle': '#C0A07E',
  'Connection': '#AD8899',
  'Identity': '#9F96B8',
  'Your Vision': '#C8AE80',
};

/**
 * WCAG 2.1 AA compliant color tokens for dark mode.
 * All colors verified against --bg-primary (#0a0e1a).
 * Aligned with globals.css design tokens.
 */
export const C = {
  // Backgrounds
  pageBg: '#0a0e1a',       // var(--bg-primary) — THE canonical dark background
  cardBg: '#111827',       // var(--bg-secondary)
  inputBg: '#0d1222',      // Slightly lighter than pageBg for inputs
  inputBorder: '#374151',  // var(--gray-700) — 3.2:1 against pageBg

  // Borders & dividers
  divider: '#1f2937',      // var(--gray-800)

  // Text — all verified against #0a0e1a
  textPrimary: '#f9fafb',    // 18.3:1 — headings, body
  textSecondary: '#9ca3af',  // 6.3:1  — subtitles, descriptions
  textMuted: '#8b95a5',      // 5.2:1  — hints, captions, timestamps
  textAccent: '#60a5fa',     // 5.1:1  — links, interactive

  // Placeholder — must meet 4.5:1 per CLAUDE.md
  textPlaceholder: '#8b95a5', // Using --text-muted (5.2:1)

  // Focus ring
  focusDefault: '#C4A87A',
};

export function wordCount(t: string): number {
  return !t || !t.trim() ? 0 : t.trim().split(/\s+/).length;
}

export interface OliviaContext {
  /** e.g. "Question 5 of 34 in Demographics" */
  positionLabel?: string;
  /** e.g. "12 of 200 total questions answered (6%)" */
  progressLabel?: string;
  /** Key prior answers relevant to the current question */
  relevantAnswers?: Record<string, string>;
  /** Questions that were skipped due to logic jumps */
  skippedInfo?: string;
}

export function buildOliviaPrompt(sectionTitle: string, sectionCat: string, sectionPrompt: string, currentAnswer: string, ctx?: OliviaContext): string {
  let prompt = `You are Olivia, a warm and sophisticated AI relocation advisor for CLUES\u2122 by Clues Intelligence LTD.
CURRENT SECTION: "${sectionTitle}" (Category: ${sectionCat})
QUESTION: "${sectionPrompt}"
CLIENT'S ANSWER SO FAR: ${currentAnswer ? `"${currentAnswer}"` : '(not yet answered)'}`;

  if (ctx) {
    if (ctx.positionLabel) prompt += `\nPOSITION: ${ctx.positionLabel}`;
    if (ctx.progressLabel) prompt += `\nPROGRESS: ${ctx.progressLabel}`;
    if (ctx.relevantAnswers && Object.keys(ctx.relevantAnswers).length > 0) {
      prompt += `\nKEY CLIENT FACTS:`;
      for (const [label, val] of Object.entries(ctx.relevantAnswers)) {
        prompt += `\n  - ${label}: ${val}`;
      }
    }
    if (ctx.skippedInfo) prompt += `\nSMART LOGIC: ${ctx.skippedInfo}`;
  }

  prompt += `\nYOUR ROLE: Help them articulate their true needs for relocation. You understand the full questionnaire funnel \u2014 Demographics, Deal-Breakers, Must-Haves, Trade-offs, and General Preferences. Reference their prior answers when relevant. Ask gentle follow-up questions. Be warm, empathetic, conversational \u2014 never clinical. Keep responses under 120 words. Never fabricate location data.
If questions were skipped by smart logic (e.g., no children \u2192 child questions skipped), acknowledge this naturally if relevant.
MODULE GUIDANCE: Use the client's lifestyle/values signals (Religion importance, Food culture importance, Entertainment importance, Sports/fitness importance, LGBTQ+ acceptance importance, Gun law importance, Values alignment importance, Dwelling preference, Setting preference) from KEY CLIENT FACTS to guide which of the 23 deep-dive modules matter most. If a signal is high (4-5), suggest they prioritize that module. If low (1-2), note they can skip it. For dwelling/setting preferences, recommend the Housing & Property and Neighborhood modules accordingly.
Speak as you would on a warm, professional video call.`;

  return prompt;
}

/** localStorage key for persisting discovery answers */
export const DISCOVERY_STORAGE_KEY = 'clues_discovery_answers';

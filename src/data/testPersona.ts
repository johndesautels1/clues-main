/**
 * CLUES Intelligence — Test Persona (COMPLETE)
 * Dev-only pre-loaded complete user data.
 *
 * Injects a FULL UserSession so the app has a scaffold to fire the
 * entire LLM API cascade without completing the 3-hour questionnaire.
 *
 * Persona: Marcus & Elena — dual-citizen tech entrepreneur couple,
 * 2 kids, relocating from Austin TX to Southern Europe.
 *
 * This file provides:
 *   - 30 completed paragraphs (P1-P30)
 *   - FULL demographics (Q1-Q34), DNW (Q35-Q67), MH (Q68-Q100)
 *   - FULL 50 tradeoff answers (tq1-tq50)
 *   - FULL 50 general answers (gq1-gq50)
 *   - ALL 23 mini modules x 100 questions each
 *   - A GeminiExtraction with metrics, recommendations, and thinking
 *   - Globe selection (Southern Europe / Mediterranean)
 *   - Tier set to 'precision' with 94% confidence
 */

import type {
  UserSession,
  ParagraphEntry,
  GeminiExtraction,
  DemographicAnswers,
  DNWAnswers,
  MHAnswers,
  TradeoffAnswers,
  GeneralAnswers,
  GlobeSelection,
} from '../types';

// ─── Globe Selection ─────────────────────────────────────────

const TEST_GLOBE: GlobeSelection = {
  region: 'Southern Europe / Mediterranean',
  lat: 39.5,
  lng: -3.0,
  zoomLevel: 2,
};

// ─── 30 Paragraphs (P1-P30) ─────────────────────────────────

const TEST_PARAGRAPHS: ParagraphEntry[] = [
  {
    id: 1, heading: 'Who You Are',
    content: 'I am Marcus, 38, American citizen with Italian dual citizenship through my grandfather. My wife Elena is 35, Brazilian-American dual citizen. We have two children: Sofia (7) and Leo (4). I speak English natively, conversational Italian and Portuguese. Elena speaks English, Portuguese natively, and Spanish fluently. I run a SaaS company with 12 employees, all remote. Elena is a UX designer working remotely for a San Francisco startup.',
  },
  {
    id: 2, heading: 'Your Life Right Now',
    content: 'We live in Austin, Texas. Combined household income is approximately $320,000 USD per year. My company generates about $1.8M ARR. We want to move because of the political climate, gun violence concerns with our kids in school, healthcare costs ($2,400/month for family), and the brutal Texas summers. We are looking to move within 6-8 months. Our budget for monthly living expenses abroad is $6,000-$9,000 EUR.',
  },
  {
    id: 3, heading: 'Absolute Dealbreakers',
    content: 'We will NOT move anywhere with: high violent crime rates, poor healthcare access (we need pediatric specialists for Leo who has mild asthma), unreliable internet (I need 100+ Mbps for video calls), political instability, or extreme heat over 38C regularly. We will not consider anywhere that does not have an international school option for Sofia. We will not live anywhere with active military conflict or terrorism risk rated high by the US State Department.',
  },
  {
    id: 4, heading: 'Non-Negotiable Must Haves',
    content: 'Must have: fast reliable internet (100+ Mbps fiber), international schools with English curriculum, modern healthcare with English-speaking doctors, safe walkable neighborhoods, direct flights to the US (or 1 stop max), favorable tax treatment for remote workers or entrepreneurs, a coworking space within 20 minutes, and a warm Mediterranean climate with mild winters. Must have a vibrant food scene and outdoor activities for kids.',
  },
  {
    id: 5, heading: 'Trade-offs You Can Accept',
    content: 'We can accept: a smaller home than our 2,800 sqft Austin house, reduced shopping options, being further from family (we already see them 3-4 times a year), learning a new language (we are willing), some bureaucracy for visas/residency. We would trade nightlife and entertainment for safety and nature access. We prefer paying slightly higher taxes if healthcare and education are covered. We would accept a 1-2 hour drive to a major airport if the town itself is excellent.',
  },
  {
    id: 6, heading: 'Safety & Security',
    content: 'Safety is our #1 priority with two young children. We want a place where kids can walk to school, play in parks unsupervised, and where petty crime is low. I want a country with low gun violence and strong rule of law. We want neighborhood-level safety, not just city-level stats. Elena wants well-lit streets and active community policing. We want to know the actual crime rates per 100,000 residents, not just "it feels safe."',
  },
  {
    id: 7, heading: 'Health & Wellness',
    content: 'Leo has mild asthma requiring regular pediatric checkups and access to albuterol inhalers. Elena needs access to a good gynecologist. I want a gym within walking distance. We all want access to outdoor fitness — hiking, cycling, swimming. We need a hospital within 30 minutes and English-speaking doctors. We would strongly prefer a country with universal healthcare or affordable private insurance under $500/month for the family.',
  },
  {
    id: 8, heading: 'Climate & Weather',
    content: 'We want Mediterranean climate: warm summers (28-34C), mild winters (8-15C), 250+ sunny days per year. We hate extreme humidity (Austin is 70%+ in summer). We want low rainfall, especially in spring and summer. We want to be within 30 minutes of the coast. Snow is fine if it is rare and brief. We want a place where outdoor dining is possible 8+ months of the year.',
  },
  {
    id: 9, heading: 'Legal & Immigration',
    content: 'I have Italian citizenship so EU residency is straightforward for me. Elena would apply as my spouse. We need to understand tax implications — I have heard Portugal NHR is ending, but Spain has Beckham Law. I want a country that does not tax worldwide income aggressively or has a favorable regime for entrepreneurs. We need legal clarity on running a US-incorporated LLC from abroad.',
  },
  {
    id: 10, heading: 'Financial & Banking',
    content: 'We need reliable international banking — Wise, Revolut, or a local bank that handles USD/EUR transfers without excessive fees. We want to understand cost of living in detail: rent for a 3-bedroom in a good school district, groceries, utilities, childcare if needed, dining out. Our budget is $6,000-$9,000 EUR/month total. We have $180,000 in savings and own our Austin home (worth ~$650,000).',
  },
  {
    id: 11, heading: 'Housing & Property',
    content: 'We want a 3-bedroom apartment or small house, minimum 120 sqm, with outdoor space (terrace or garden) for the kids. Prefer modern or recently renovated. Within 15 minutes walk of an international school. We would rent first (12-18 months) then potentially buy. Budget for rent: $2,000-$3,500 EUR/month. We want a furnished option initially to simplify the move.',
  },
  {
    id: 12, heading: 'Professional & Career',
    content: 'I run my SaaS company remotely and need a strong startup ecosystem nearby for networking, not necessarily for fundraising. Elena needs stable internet and a quiet home office. We both want coworking spaces for social interaction. I want access to tech meetups and entrepreneur communities. Time zone overlap with US East Coast is important — no more than 6 hours difference.',
  },
  {
    id: 13, heading: 'Technology & Connectivity',
    content: 'Non-negotiable: 100+ Mbps fiber internet at home. I run daily video calls with my US team and clients. Need backup options (mobile hotspot with strong 4G/5G). Want reliable cell coverage throughout the area, not just city center. Need access to US streaming services (VPN-friendly). Smart home compatibility would be nice but not essential.',
  },
  {
    id: 14, heading: 'Transportation & Mobility',
    content: 'We want a walkable neighborhood where we do not need a car daily. Public transit for getting around the city. We would own or lease one car for weekend trips and school runs. Need an international airport within 90 minutes for US flights. Good road infrastructure. Bike-friendly is a big plus — Sofia is learning to ride and we want safe cycling paths.',
  },
  {
    id: 15, heading: 'Education & Learning',
    content: 'Sofia is 7 and needs a strong international school with English curriculum, ideally IB or British system. Class sizes under 20 preferred. We want sports programs and arts for both kids. Leo is 4 and would start in pre-school/kindergarten, ideally at the same campus as Sofia. We are open to bilingual education. Budget for tuition: up to $15,000 EUR per child per year.',
  },
  {
    id: 16, heading: 'Social Values & Governance',
    content: 'We want a country with strong democratic institutions, press freedom, low corruption, and rule of law. LGBTQ+ friendly (Elena has a gay brother who visits). Progressive social values but we respect tradition. We want an engaged local community, not a gated expat bubble. We vote Democrat in the US — we want a politically moderate to progressive environment.',
  },
  {
    id: 17, heading: 'Food & Dining',
    content: 'We are serious foodies. Fresh local markets within walking distance are essential. We cook 5 nights a week and eat out 2. We want access to diverse cuisines, not just local food. Good coffee culture matters. Elena is semi-vegetarian — she needs good vegetable and plant-based options. We want farm-to-table culture, not imported processed food. Wine region proximity is a huge bonus.',
  },
  {
    id: 18, heading: 'Shopping & Services',
    content: 'We need access to a good supermarket, pharmacy, and basic retail within 10 minutes. Amazon delivery or equivalent for household goods. Children clothing stores. We do not need luxury shopping but want quality basics. Reliable postal service for receiving packages from the US. A good hardware store for home improvement. Dry cleaning and laundry services.',
  },
  {
    id: 19, heading: 'Outdoor Recreation',
    content: 'Hiking trails accessible within 30 minutes. Beach within 30 minutes for weekend family days. We want to try surfing, sailing, and rock climbing. Kid-friendly parks and playgrounds in the neighborhood. Nature reserves or national parks within 2 hours. Cycling paths for family rides. Running paths along the coast or through parks. Golf for me (I play monthly).',
  },
  {
    id: 20, heading: 'Entertainment & Nightlife',
    content: 'With two small kids, our nightlife is mostly dinner with friends. We want good restaurants open late (9-10 PM seating), wine bars, and occasional live music. A cinema showing English-language films. Cultural festivals throughout the year. A good bookstore. We do not need clubs or a party scene. Weekend farmers markets and street food events are more our style.',
  },
  {
    id: 21, heading: 'Family & Children',
    content: 'Playgrounds and kid-friendly parks within 5 minutes walk. Play dates and a community of families with similar-aged kids. After-school activities: soccer, swimming, art classes. Family-friendly restaurants that are not just fast food. Pediatric dentist and orthodontist availability. Summer camps and holiday programs. A safe neighborhood where kids see other kids playing outside.',
  },
  {
    id: 22, heading: 'Neighborhood & Urban Design',
    content: 'We want a neighborhood that feels like a village within a city. Tree-lined streets, pedestrian zones, local cafes with outdoor seating. Mixed-use: residential + shops + restaurants. Low-rise buildings (no towers). Well-maintained public spaces. A sense of community — where neighbors know each other. Good street lighting and clean public areas. Not sterile or soulless new development.',
  },
  {
    id: 23, heading: 'Environment & Community Appearance',
    content: 'Clean air quality is critical (Leo asthma). Low noise pollution — no highway nearby. Green spaces and parks. Recycling infrastructure. Low light pollution would be nice. Well-maintained buildings and streets. Not overly touristy — we want to live in a real neighborhood, not a vacation area. Character and history in the architecture.',
  },
  {
    id: 24, heading: 'Religion & Spirituality',
    content: 'We are not religious but culturally Catholic on my Italian side. We want a tolerant, secular environment where religion is personal and not politically dominant. We would attend local festivals with religious heritage for cultural experience. We want our kids exposed to diverse beliefs. No strong religious conservatism influencing laws or education.',
  },
  {
    id: 25, heading: 'Sexual Beliefs, Practices & Laws',
    content: 'As mentioned, Elena brother is gay and visits 2-3 times a year with his partner. We need a country where same-sex couples are legally protected and socially accepted. We want progressive attitudes toward gender equality, reproductive rights, and personal freedom. We will not consider any country where LGBTQ+ people face legal or social persecution.',
  },
  {
    id: 26, heading: 'Arts & Culture',
    content: 'We love museums, galleries, and live theater. Elena paints as a hobby and wants access to art supply stores and possibly local art classes. We want a city with a cultural calendar — film festivals, art exhibitions, music concerts. Architecture matters: we want to live somewhere beautiful. Access to world-class cultural institutions within the country.',
  },
  {
    id: 27, heading: 'Cultural Heritage & Traditions',
    content: 'We want to immerse in local culture, not just live in an expat bubble. Local language classes for the family. Traditional markets, seasonal festivals, local cuisine traditions. We want Sofia and Leo to grow up bilingual and bicultural. We value historical depth — a place with layers of history you can see and touch. We want to participate in local customs and holidays.',
  },
  {
    id: 28, heading: 'Pets & Animals',
    content: 'We have a medium-sized dog, a 30kg Labrador named Biscuit. We need pet-friendly housing (many EU apartments ban dogs). Dog parks or off-leash areas. A good veterinarian. Pet transport logistics for the international move. Dog-friendly cafes and restaurants are a huge plus. We want to understand breed restrictions and import quarantine rules.',
  },
  {
    id: 29, heading: 'Your Ideal Day',
    content: 'Morning: Wake up, open terrace doors to warm air, walk Sofia to school (7 min), grab a cortado at the corner cafe, work from my home office or coworking space with ocean views. Lunch: Walk to the market, buy fresh fish and vegetables, cook at home. Afternoon: Pick up kids, take them to the playground or beach. Evening: Family dinner on the terrace, kids in bed by 8:30, Elena and I share a bottle of local wine and plan our weekend hike.',
  },
  {
    id: 30, heading: 'Your Vision for the Future',
    content: 'In 5 years: Sofia (12) speaks three languages fluently, Leo (9) plays soccer in a local youth league, Biscuit is old and happy. My company has grown to $5M ARR and I have hired 3 local employees. Elena freelances for European clients and teaches art on weekends. We own a small house with a garden, know our neighbors by name, and feel completely at home. We travel around Europe by train on school holidays. Our parents visit twice a year and love it. We never look back.',
  },
];

// ─── Demographics (Q1-Q34) — matches main_module.ts question numbers ──

const TEST_DEMOGRAPHICS: DemographicAnswers = {
  // Q1: nationality
  q1: 'United States',
  // Q2: dual citizenship
  q2: 'Italy',
  // Q3: current country
  q3: 'United States',
  // Q4: age range
  q4: '35-44',
  // Q5: relationship status
  q5: 'married',
  // Q6: partner relocating
  q6: true,
  // Q7: partner needs work authorization
  q7: false,
  // Q8: has children
  q8: true,
  // Q9: children age ranges
  q9: 'toddler 3-5,elementary 6-10',
  // Q10: all children relocating
  q10: true,
  // Q11: children special needs
  q11: true,
  // Q12: education level
  q12: "bachelor's",
  // Q13: skilled trade
  q13: 'not applicable',
  // Q14: military
  q14: false,
  // Q15: employment status
  q15: 'self-employed',
  // Q16: profession/industry
  q16: 'technology',
  // Q17: work style
  q17: 'fully_remote',
  // Q18: employer flexibility
  q18: 'own_business',
  // Q19: annual income
  q19: '$250,000-$500,000',
  // Q20: savings available
  q20: '$100,000-$250,000',
  // Q21: property ownership
  q21: 'own_home',
  // Q22: monthly budget abroad
  q22: '$6,000-$9,000',
  // Q23: insurance needs
  q23: 'family_health_insurance',
  // Q24: chronic conditions
  q24: true,
  // Q25: condition details
  q25: 'child_asthma',
  // Q26: medications
  q26: 'albuterol_inhaler',
  // Q27: disability accommodation
  q27: false,
  // Q28: dietary restrictions
  q28: 'semi_vegetarian',
  // Q29: transportation modes
  q29: 'personal car,walking,bicycle',
  // Q30: pets relocating
  q30: true,
  // Q31: pet types
  q31: 'dog(s)',
  // Q32: breed restrictions
  q32: false,
  // Q33: languages spoken
  q33: 'English,Italian,Portuguese',
  // Q34: relocation timeline
  q34: '6 months',
};

// ─── Do Not Wants (Q35-Q67) — ALL 33 questions ──────────────

const TEST_DNW: DNWAnswers = [
  // Q35: extreme heat
  { questionId: '35', value: 'Extreme heat regularly over 35C', severity: 4 },
  // Q36: extreme cold
  { questionId: '36', value: 'Extreme cold below -10C', severity: 2 },
  // Q37: high humidity
  { questionId: '37', value: 'High humidity tropical conditions', severity: 4 },
  // Q38: natural disasters
  { questionId: '38', value: 'Natural disaster risks', severity: 3 },
  // Q39: air pollution
  { questionId: '39', value: 'Severe air pollution', severity: 5 },
  // Q40: water quality
  { questionId: '40', value: 'Water quality or shortage', severity: 3 },
  // Q41: language barriers
  { questionId: '41', value: 'Insurmountable language barriers', severity: 2 },
  // Q42: restrictive religious laws
  { questionId: '42', value: 'Restrictive social or religious laws', severity: 5 },
  // Q43: lack of diversity
  { questionId: '43', value: 'Monocultural environment', severity: 3 },
  // Q44: anti-immigrant hostility
  { questionId: '44', value: 'Hostile attitudes toward immigrants', severity: 4 },
  // Q45: LGBTQ+ discrimination
  { questionId: '45', value: 'Gender or LGBTQ+ discrimination', severity: 5 },
  // Q46: religious intolerance
  { questionId: '46', value: 'Religious intolerance or persecution', severity: 4 },
  // Q47: poor healthcare
  { questionId: '47', value: 'Poor or inaccessible healthcare', severity: 5 },
  // Q48: unreliable infrastructure
  { questionId: '48', value: 'Unreliable infrastructure', severity: 4 },
  // Q49: poor internet
  { questionId: '49', value: 'Poor internet and telecom', severity: 5 },
  // Q50: high taxes no services
  { questionId: '50', value: 'High taxes without public services', severity: 3 },
  // Q51: high COL low quality
  { questionId: '51', value: 'High COL not matched by quality', severity: 3 },
  // Q52: unstable economy
  { questionId: '52', value: 'Unstable economy volatile currency', severity: 4 },
  // Q53: authoritarian government
  { questionId: '53', value: 'Authoritarian or non-democratic government', severity: 5 },
  // Q54: systemic corruption
  { questionId: '54', value: 'Systemic corruption unreliable legal system', severity: 4 },
  // Q55: political instability
  { questionId: '55', value: 'Political instability or civil unrest', severity: 5 },
  // Q56: high crime
  { questionId: '56', value: 'High crime rates personal safety concerns', severity: 5 },
  // Q57: unsafe for women/minorities
  { questionId: '57', value: 'Lack of safety for women and minorities', severity: 5 },
  // Q58: complex visa
  { questionId: '58', value: 'Complex visa or residency complications', severity: 2 },
  // Q59: car dependent
  { questionId: '59', value: 'Car-dependent lifestyle', severity: 3 },
  // Q60: poor transit
  { questionId: '60', value: 'Poor public transportation', severity: 3 },
  // Q61: no career opportunities
  { questionId: '61', value: 'Lack of career opportunities', severity: 2 },
  // Q62: lack food/dietary options
  { questionId: '62', value: 'Lacking specific foods or dietary needs', severity: 2 },
  // Q63: isolation from family
  { questionId: '63', value: 'Isolation from family and friends', severity: 2 },
  // Q64: limited education
  { questionId: '64', value: 'Limited education options for children', severity: 5 },
  // Q65: no airport access
  { questionId: '65', value: 'Limited international airport access', severity: 3 },
  // Q66: noise/overcrowding
  { questionId: '66', value: 'Excessive noise pollution overcrowding', severity: 3 },
  // Q67: no outdoor recreation
  { questionId: '67', value: 'Lack of outdoor recreation green spaces', severity: 3 },
];

// ─── Must Haves (Q68-Q100) — ALL 33 questions ──────────────

const TEST_MH: MHAnswers = [
  // Q68: English widely spoken
  { questionId: '68', value: 'English widely spoken', importance: 4 },
  // Q69: welcoming to newcomers
  { questionId: '69', value: 'Welcoming attitude toward newcomers', importance: 4 },
  // Q70: job opportunities
  { questionId: '70', value: 'Job opportunities in field', importance: 2 },
  // Q71: legal work ability
  { questionId: '71', value: 'Ability to legally work', importance: 5 },
  // Q72: affordable COL
  { questionId: '72', value: 'Reasonable affordable cost of living', importance: 3 },
  // Q73: affordable housing
  { questionId: '73', value: 'Affordable housing availability', importance: 4 },
  // Q74: stable economy
  { questionId: '74', value: 'Stable economy reliable currency', importance: 4 },
  // Q75: legal protection
  { questionId: '75', value: 'Strong legal protection for foreigners', importance: 4 },
  // Q76: quality healthcare
  { questionId: '76', value: 'Quality healthcare medical facilities', importance: 5 },
  // Q77: low crime
  { questionId: '77', value: 'Low crime rate personal safety', importance: 5 },
  // Q78: political stability
  { questionId: '78', value: 'Political stability democratic governance', importance: 5 },
  // Q79: clean environment
  { questionId: '79', value: 'Clean environment air water streets', importance: 5 },
  // Q80: good air quality
  { questionId: '80', value: 'Good air quality', importance: 5 },
  // Q81: high-speed internet
  { questionId: '81', value: 'Reliable high-speed internet', importance: 5 },
  // Q82: reliable utilities
  { questionId: '82', value: 'Reliable utilities infrastructure', importance: 4 },
  // Q83: public transit
  { questionId: '83', value: 'Good public transportation', importance: 3 },
  // Q84: walkable neighborhoods
  { questionId: '84', value: 'Walkable neighborhoods', importance: 5 },
  // Q85: airport proximity
  { questionId: '85', value: 'International airport proximity', importance: 4 },
  // Q86: outdoor recreation
  { questionId: '86', value: 'Outdoor recreation nature green spaces', importance: 4 },
  // Q87: food scene
  { questionId: '87', value: 'Vibrant food scene diverse dining', importance: 4 },
  // Q88: cultural activities
  { questionId: '88', value: 'Cultural activities museums theater arts', importance: 3 },
  // Q89: fitness facilities
  { questionId: '89', value: 'Fitness facilities sports infrastructure', importance: 4 },
  // Q90: nightlife
  { questionId: '90', value: 'Nightlife entertainment', importance: 1 },
  // Q91: education system
  { questionId: '91', value: 'Good education system', importance: 5 },
  // Q92: professional networking
  { questionId: '92', value: 'Professional networking career development', importance: 3 },
  // Q93: family-friendly
  { questionId: '93', value: 'Family-friendly environment', importance: 5 },
  // Q94: expat community
  { questionId: '94', value: 'Expat or international community', importance: 3 },
  // Q95: religious community
  { questionId: '95', value: 'Religious spiritual community access', importance: 1 },
  // Q96: pet-friendly
  { questionId: '96', value: 'Pet-friendly environment', importance: 4 },
  // Q97: climate suits lifestyle
  { questionId: '97', value: 'Climate weather suits lifestyle', importance: 5 },
  // Q98: resident happiness
  { questionId: '98', value: 'Resident happiness life satisfaction', importance: 4 },
  // Q99: diversity inclusion
  { questionId: '99', value: 'Community embraces diversity inclusion', importance: 5 },
  // Q100: proximity to family
  { questionId: '100', value: 'Proximity to family support network', importance: 2 },
];

// ─── Tradeoffs (tq1-tq50) — ALL 50 questions ───────────────
// Slider 0-100: 0 = strongly left option, 100 = strongly right option

const TEST_TRADEOFFS: TradeoffAnswers = {
  // Safety vs. Lifestyle (Q1-Q6)
  tq1: 85,   // Higher COL for better safety — strongly yes
  tq2: 80,   // Less exciting city for family safety — yes
  tq3: 30,   // Stricter laws for low crime — somewhat no (values freedom)
  tq4: 25,   // Moderate safety for world-class healthcare — lean no
  tq5: 75,   // Less nightlife for safer streets — yes
  tq6: 70,   // Gated community for security — somewhat yes
  // Cost vs. Quality (Q7-Q12)
  tq7: 70,   // Higher taxes for better public services — yes
  tq8: 65,   // More rent for better neighborhood — somewhat yes
  tq9: 80,   // Higher school tuition for better education — strongly yes
  tq10: 60,  // More expensive groceries for organic/local — somewhat yes
  tq11: 55,  // Premium for faster internet — somewhat yes
  tq12: 40,  // Luxury housing vs more savings — lean savings
  // Climate vs. Opportunity (Q13-Q18)
  tq13: 70,  // Perfect climate less career opportunity — favor climate
  tq14: 65,  // Warmer weather further from airport — somewhat climate
  tq15: 45,  // Beach town vs tech hub — balanced
  tq16: 60,  // Mediterranean vs lower COL inland — lean Mediterranean
  tq17: 75,  // Sunny mild weather vs cultural capital — favor weather
  tq18: 50,  // Rural paradise vs urban convenience — balanced
  // Career vs. Lifestyle (Q19-Q24)
  tq19: 55,  // Startup ecosystem vs family time — balanced, slight career
  tq20: 40,  // Networking opportunities vs quiet life — lean quiet
  tq21: 35,  // US timezone overlap vs ideal location — lean location
  tq22: 70,  // Coworking space vs home office savings — favor coworking
  tq23: 45,  // Business growth vs lifestyle quality — balanced
  tq24: 60,  // Professional development vs personal growth — somewhat personal
  // Social/Cultural vs. Practical (Q25-Q30)
  tq25: 70,  // Local integration vs expat community — favor local
  tq26: 65,  // Cultural immersion vs convenience — favor culture
  tq27: 75,  // Authentic neighborhood vs modern amenities — favor authentic
  tq28: 60,  // Language challenge vs English everywhere — somewhat challenge
  tq29: 55,  // Historic architecture vs modern convenience — balanced
  tq30: 70,  // Community involvement vs privacy — favor community
  // Healthcare vs. Other (Q31-Q36)
  tq31: 85,  // Higher taxes for universal healthcare — strongly yes
  tq32: 80,  // Less shopping for better hospitals — yes
  tq33: 75,  // Smaller home near hospital — yes
  tq34: 70,  // More commute for better pediatric care — yes
  tq35: 65,  // Less entertainment for health infrastructure — somewhat yes
  tq36: 60,  // Rural with good clinic vs urban with crowded hospital — somewhat rural
  // Housing vs. Location (Q37-Q42)
  tq37: 45,  // Bigger home further out vs smaller central — lean central
  tq38: 40,  // House with garden vs apartment walkable — lean walkable
  tq39: 55,  // Modern apartment vs charming old house — balanced
  tq40: 60,  // Furnished rental vs unfurnished cheaper — somewhat furnished
  tq41: 35,  // Own home suburban vs rent city center — lean city
  tq42: 50,  // More space vs better school district — balanced
  // Freedom vs. Convenience (Q43-Q50)
  tq43: 65,  // Own car freedom vs car-free walkable — somewhat walkable but want car
  tq44: 70,  // Freelance flexibility vs stable local job — favor freelance
  tq45: 60,  // Self-directed education vs structured school — somewhat structured
  tq46: 55,  // Privacy vs helpful community — balanced
  tq47: 75,  // Cook at home fresh vs convenient delivery — favor cooking
  tq48: 40,  // Total independence vs integrated services — lean integrated
  tq49: 65,  // Explore freely vs guided relocation service — somewhat free
  tq50: 70,  // DIY renovation vs turnkey property — somewhat turnkey
};

// ─── General Answers (gq1-gq50) — ALL 50 questions ─────────
// Keys use "gq" prefix as expected by useQuestionnaireState.ts

const TEST_GENERAL: GeneralAnswers = {
  // Household & Decision Dynamics (Q1-Q5)
  gq1: 'myself and partner equally',
  gq2: 85,  // Slider: very aligned
  gq3: 'Portugal (Cascais, Lisbon coast), Spain (Valencia, Barcelona coast), Italy (Sardinia, Puglia). Visited Portugal and Spain on vacation, lived in Italy briefly as a student.',
  gq4: true,  // Family obligations
  gq5: 'Parents in New York and Sao Paulo. Visit 2-3 times per year. Need direct flights or 1-stop to both cities.',
  // Personality & Psychology (Q6-Q12)
  gq6: 'ambivert',
  gq7: 75,  // Risk tolerance: moderately high
  gq8: 'planner',
  gq9: 65,  // Openness to change: quite open
  gq10: 'quality_time,acts_of_service',
  gq11: 80,  // Stress management: good
  gq12: 'work_life_integration',
  // Cultural Adaptation (Q13-Q18)
  gq13: 'eager_to_learn',
  gq14: 70,  // Cultural flexibility: quite flexible
  gq15: 'mixed_local_and_expat',
  gq16: true,  // Willing to learn language
  gq17: 'immersive_integration',
  gq18: 55,  // Homesickness tolerance: moderate
  // Social Identity (Q19-Q24)
  gq19: 'progressive_moderate',
  gq20: 'secular_but_culturally_catholic',
  gq21: 'open_accepting',
  gq22: 'urban_with_nature_access',
  gq23: 'small_gatherings_dinner_parties',
  gq24: 75,  // Community involvement desire: high
  // Lifestyle Philosophy (Q25-Q35)
  gq25: 'experiences_over_things',
  gq26: 60,  // Material comfort importance: moderate
  gq27: 'mediterranean_slow_living',
  gq28: 'active_outdoor_lifestyle',
  gq29: true,  // Interested in local food culture
  gq30: 'twice_weekly',
  gq31: 'hiking,cycling,swimming,gym',
  gq32: 'daily',  // Cooking frequency
  gq33: 75,  // Health consciousness: high
  gq34: 'moderate_drinker_wine',
  gq35: false,  // Smoking
  // Vision & Planning (Q36-Q42)
  gq36: 5,  // Years planning to stay: 5+ (permanent)
  gq37: 'rent_then_buy',
  gq38: true,  // Open to multiple moves
  gq39: 'grow_business_internationally',
  gq40: 'bilingual_multicultural_kids',
  gq41: 80,  // Confidence in decision: high
  gq42: 'thorough_research_then_leap',
  // Values & Preferences (Q43-Q50)
  gq43: 'education,safety,health',
  gq44: 70,  // Environmental consciousness: high
  gq45: 'democratic_transparent',
  gq46: 'diverse_inclusive',
  gq47: 'walkable_mixed_use',
  gq48: 'natural_beauty_with_culture',
  gq49: 60,  // Tech dependency: moderate-high
  gq50: 'I want my children to grow up knowing that the world is bigger than one country, speaking multiple languages, eating real food, playing outside until sunset, and understanding that different is not scary — it is beautiful. That is why we are moving.',
};

// ─── Gemini Extraction (mock — real one comes from API) ──────

const TEST_EXTRACTION: GeminiExtraction = {
  demographic_signals: {
    age: 38,
    gender: 'male',
    household_size: 4,
    has_children: true,
    has_pets: true,
    employment_type: 'business_owner',
    income_bracket: '300k+',
  },
  personality_profile: 'Family-oriented tech entrepreneur seeking Mediterranean lifestyle balance. Risk-aware, quality-focused, values education and safety above cost optimization. Culturally curious with desire for authentic local integration rather than expat bubble.',

  detected_currency: 'EUR',
  budget_range: { min: 6000, max: 9000, currency: 'EUR' },

  metrics: [
    { id: 'M1', fieldId: 'safety_01_violent_crime', description: 'Violent crime rate per 100,000 residents', category: 'safety_security', source_paragraph: 6, score: 0, user_justification: 'P6: Safety is #1 priority with two young children', data_justification: '', source: '', data_type: 'numeric', research_query: 'violent crime rate per 100000 residents', threshold: { operator: 'lt', value: 5, unit: 'per 100k' } },
    { id: 'M2', fieldId: 'safety_02_petty_crime', description: 'Petty crime and theft rate', category: 'safety_security', source_paragraph: 6, score: 0, user_justification: 'P6: Wants kids to walk to school safely', data_justification: '', source: '', data_type: 'numeric', research_query: 'petty crime theft rate', threshold: { operator: 'lt', value: 30, unit: 'per 100k' } },
    { id: 'M3', fieldId: 'health_01_hospital_access', description: 'Hospital within 30 minutes', category: 'health_wellness', source_paragraph: 7, score: 0, user_justification: 'P7: Need hospital within 30 min, child has asthma', data_justification: '', source: '', data_type: 'boolean', research_query: 'nearest hospital travel time' },
    { id: 'M4', fieldId: 'climate_01_avg_summer_temp', description: 'Average summer temperature (C)', category: 'climate_weather', source_paragraph: 8, score: 0, user_justification: 'P8: Wants 28-34C summers', data_justification: '', source: '', data_type: 'numeric', research_query: 'average summer temperature celsius', threshold: { operator: 'between', value: [28, 34], unit: 'celsius' } },
    { id: 'M5', fieldId: 'climate_02_sunny_days', description: 'Sunny days per year', category: 'climate_weather', source_paragraph: 8, score: 0, user_justification: 'P8: Wants 250+ sunny days', data_justification: '', source: '', data_type: 'numeric', research_query: 'annual sunny days', threshold: { operator: 'gte', value: 250, unit: 'days' } },
    { id: 'M6', fieldId: 'tech_01_fiber_speed', description: 'Fiber internet availability and speed (Mbps)', category: 'technology_connectivity', source_paragraph: 13, score: 0, user_justification: 'P13: Non-negotiable 100+ Mbps fiber', data_justification: '', source: '', data_type: 'numeric', research_query: 'fiber internet speed availability', threshold: { operator: 'gte', value: 100, unit: 'Mbps' } },
    { id: 'M7', fieldId: 'education_01_intl_school', description: 'International school availability (IB/British)', category: 'education_learning', source_paragraph: 15, score: 0, user_justification: 'P15: Needs IB or British curriculum school', data_justification: '', source: '', data_type: 'boolean', research_query: 'international school IB British curriculum' },
    { id: 'M8', fieldId: 'housing_01_3bed_rent', description: '3-bedroom rent in good area (EUR/month)', category: 'housing_property', source_paragraph: 11, score: 0, user_justification: 'P11: Budget $2000-3500 EUR/month rent', data_justification: '', source: '', data_type: 'numeric', research_query: '3 bedroom apartment rent EUR per month', threshold: { operator: 'between', value: [2000, 3500], unit: 'EUR' } },
    { id: 'M9', fieldId: 'transport_01_walkability', description: 'Walkability score', category: 'transportation_mobility', source_paragraph: 14, score: 0, user_justification: 'P14: Wants walkable neighborhood, no daily car need', data_justification: '', source: '', data_type: 'index', research_query: 'walkability score pedestrian friendly' },
    { id: 'M10', fieldId: 'food_01_local_markets', description: 'Fresh food markets within walking distance', category: 'food_dining', source_paragraph: 17, score: 0, user_justification: 'P17: Fresh local markets essential, cooks 5 nights/week', data_justification: '', source: '', data_type: 'boolean', research_query: 'local fresh food market walking distance' },
  ],

  recommended_countries: [
    { name: 'Portugal', iso_code: 'PT', reasoning: 'Strong safety, excellent climate, growing tech scene, NHR tax benefits, English widely spoken', local_currency: 'EUR' },
    { name: 'Spain', iso_code: 'ES', reasoning: 'Beckham Law tax regime, Mediterranean climate, strong international schools, excellent food culture', local_currency: 'EUR' },
    { name: 'Italy', iso_code: 'IT', reasoning: 'Marcus has Italian citizenship — no visa needed. Rich culture, food, Mediterranean coast. Tax challenges but flat tax option for new residents.', local_currency: 'EUR' },
  ],

  recommended_cities: [
    { location: 'Cascais', country: 'Portugal', location_type: 'city', overall_score: 82, metrics: [] },
    { location: 'Valencia', country: 'Spain', location_type: 'city', overall_score: 79, metrics: [] },
    { location: 'Cagliari', country: 'Italy', location_type: 'city', overall_score: 74, metrics: [] },
  ],
  recommended_towns: [
    { location: 'Estoril', country: 'Portugal', location_type: 'town', parent: 'Cascais', overall_score: 80, metrics: [] },
    { location: 'Jávea', country: 'Spain', location_type: 'town', parent: 'Valencia', overall_score: 76, metrics: [] },
  ],
  recommended_neighborhoods: [
    { location: 'Monte Estoril', country: 'Portugal', location_type: 'neighborhood', parent: 'Estoril', overall_score: 81, metrics: [] },
    { location: 'El Cabanyal', country: 'Spain', location_type: 'neighborhood', parent: 'Valencia', overall_score: 75, metrics: [] },
  ],

  paragraph_summaries: [
    { id: 1, key_themes: ['dual-citizen', 'family', 'remote-work', 'multilingual'], extracted_preferences: ['EU residency via Italian citizenship', 'bilingual household'], metrics_derived: [] },
    { id: 2, key_themes: ['high-income', 'budget-conscious', 'push-factors'], extracted_preferences: ['$6k-9k EUR/month budget', 'gun violence concern', 'healthcare cost'], metrics_derived: [] },
    { id: 3, key_themes: ['safety-first', 'health-critical', 'connectivity'], extracted_preferences: ['no violent crime', 'pediatric access', '100+ Mbps'], metrics_derived: ['M1', 'M2', 'M3', 'M6'] },
    { id: 4, key_themes: ['education', 'climate', 'walkability'], extracted_preferences: ['international school', 'Mediterranean climate', 'coworking'], metrics_derived: ['M4', 'M5', 'M7', 'M9'] },
    { id: 5, key_themes: ['flexibility', 'language-willing', 'trade-space-for-walkability'], extracted_preferences: ['will downsize', 'will learn language', 'trade nightlife for safety'], metrics_derived: [] },
  ],

  dnw_signals: ['high_violent_crime', 'no_international_schools', 'slow_internet', 'extreme_heat', 'political_instability', 'anti_lgbtq'],
  mh_signals: ['fiber_100mbps', 'international_school', 'walkable', 'mediterranean_climate', 'us_flights', 'modern_healthcare'],
  tradeoff_signals: ['safety_over_cost', 'education_over_nightlife', 'walkability_over_space', 'healthcare_over_taxes'],

  thinking_details: [
    { step: 1, thought: 'Marcus has Italian citizenship — EU free movement applies. This immediately opens all EU countries without visa complexity.', conclusion: 'Focus on EU Mediterranean countries.' },
    { step: 2, thought: 'Two young children (7, 4) with emphasis on safety, education, walkability. This filters out large chaotic cities.', conclusion: 'Target mid-sized coastal cities with international schools.' },
    { step: 3, thought: 'Budget of EUR 6-9k/month is comfortable for Portugal and Spain, tight for prime Italian cities. Combined with the request for 3-bed near international school.', conclusion: 'Portugal (Cascais/Estoril), Spain (Valencia), Italy (Cagliari) as top candidates.' },
  ],

  module_relevance: {
    safety_security: 0.95,
    health_wellness: 0.88,
    climate_weather: 0.85,
    education_learning: 0.92,
    technology_connectivity: 0.90,
    housing_property: 0.82,
    financial_banking: 0.78,
    legal_immigration: 0.75,
    transportation_mobility: 0.80,
    food_dining: 0.82,
    family_children: 0.90,
    neighborhood_urban_design: 0.78,
    professional_career: 0.72,
    outdoor_recreation: 0.70,
    entertainment_nightlife: 0.40,
    shopping_services: 0.55,
    environment_community_appearance: 0.65,
    social_values_governance: 0.72,
    arts_culture: 0.60,
    cultural_heritage_traditions: 0.65,
    religion_spirituality: 0.25,
    sexual_beliefs_practices_laws: 0.70,
    pets_animals: 0.68,
  },
  globe_region_preference: 'Southern Europe / Mediterranean',
};

// ─── ALL 23 Module IDs ──────────────────────────────────────

const ALL_MODULE_IDS = [
  'safety_security',
  'health_wellness',
  'climate_weather',
  'legal_immigration',
  'financial_banking',
  'housing_property',
  'technology_connectivity',
  'education_learning',
  'transportation_mobility',
  'food_dining',
  'family_children',
  'pets_animals',
  'professional_career',
  'social_values_governance',
  'shopping_services',
  'outdoor_recreation',
  'entertainment_nightlife',
  'neighborhood_urban_design',
  'environment_community_appearance',
  'religion_spirituality',
  'sexual_beliefs_practices_laws',
  'arts_culture',
  'cultural_heritage_traditions',
];

/**
 * Generate persona-consistent answers for ALL 100 questions in a module.
 * Uses the module ID to produce contextually appropriate answers
 * matching Marcus & Elena's profile.
 */
function generateModuleAnswers(moduleId: string): Record<string, string | number | boolean | string[]> {
  const answers: Record<string, string | number | boolean | string[]> = {};

  for (let q = 1; q <= 100; q++) {
    const key = `${moduleId}__q${q}`;

    switch (moduleId) {
      case 'safety_security':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'very_important' : 'essential';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(10, Math.floor(q * 0.18) + 7); // 8-10 (high safety priority)
        else if (q <= 70) answers[key] = ['neighborhood_watch', 'low_crime', 'well_lit_streets', 'community_policing', 'secure_buildings'][q % 5];
        else if (q <= 85) answers[key] = q % 4 === 0 ? 'strongly_agree' : 'agree';
        else answers[key] = q % 3 === 0 ? 5 : 4; // 4-5 importance
        break;

      case 'health_wellness':
        if (q <= 15) answers[key] = q === 3 ? 'asthma_child' : q === 7 ? 'gynecologist_access' : q % 2 === 0 ? 'regular_checkups' : 'gym_access';
        else if (q <= 30) answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        else if (q <= 50) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 70) answers[key] = Math.min(5, Math.floor(q * 0.06) + 1); // 4-5 importance
        else if (q <= 85) answers[key] = ['english_speaking_doctors', 'pediatric_specialists', 'universal_healthcare', 'private_insurance_option', 'mental_health_services'][q % 5];
        else answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        break;

      case 'climate_weather':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'mediterranean' : q % 3 === 1 ? 'warm_temperate' : 'coastal_mild';
        else if (q <= 25) answers[key] = Math.floor(q * 0.8) + 10; // 23-30 preferred temp
        else if (q <= 40) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 60) answers[key] = Math.min(5, Math.floor(q * 0.07) + 1); // 4-5
        else if (q <= 80) answers[key] = q % 2 === 0 ? 'low_humidity' : 'mild_winters';
        else answers[key] = ['outdoor_dining_year_round', 'beach_access', 'no_extreme_heat', '250_sunny_days', 'mild_rain'][q % 5];
        break;

      case 'legal_immigration':
        if (q <= 15) answers[key] = q === 1 ? 'eu_citizen' : q === 2 ? 'spouse_needs_visa' : q === 5 ? 'italian_passport' : q % 3 === 0 ? 'very_important' : 'important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.08) + 1); // 3-5
        else if (q <= 70) answers[key] = ['beckham_law', 'nhr_regime', 'flat_tax_option', 'double_taxation_treaty', 'llc_foreign_operation'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'essential' : 'important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      case 'financial_banking':
        if (q <= 10) answers[key] = q <= 3 ? 320000 : q % 2 === 0 ? 'wise_revolut' : 'local_bank';
        else if (q <= 25) answers[key] = q % 3 === 0 ? 'essential' : 'important';
        else if (q <= 40) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 60) answers[key] = Math.min(5, Math.floor(q * 0.07) + 1);
        else if (q <= 80) answers[key] = ['low_transfer_fees', 'usd_eur_accounts', 'tax_optimization', 'crypto_friendly', 'multi_currency'][q % 5];
        else answers[key] = q % 3 === 0 ? 'very_important' : 'important';
        break;

      case 'housing_property':
        if (q <= 10) answers[key] = q === 1 ? '3_bedroom' : q === 2 ? '120_sqm_min' : q === 3 ? 'rent_first_then_buy' : q % 2 === 0 ? 3000 : 2500;
        else if (q <= 25) answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        else if (q <= 40) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 60) answers[key] = Math.min(5, Math.floor(q * 0.07) + 1);
        else if (q <= 80) answers[key] = ['terrace_garden', 'near_school', 'modern_renovated', 'furnished', 'parking_included'][q % 5];
        else answers[key] = q % 4 === 0 ? 'essential' : 'very_important';
        break;

      case 'technology_connectivity':
        if (q <= 15) answers[key] = q === 1 ? 100 : q === 2 ? 'fiber_required' : q % 2 === 0 ? 'essential' : 'very_important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.08) + 1);
        else if (q <= 70) answers[key] = ['5g_coverage', 'backup_hotspot', 'vpn_friendly', 'smart_home', 'coworking_wifi'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'essential' : 'important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      case 'education_learning':
        if (q <= 10) answers[key] = q === 1 ? 'ib_curriculum' : q === 2 ? 'british_system' : q === 3 ? 'bilingual_program' : q % 2 === 0 ? 15000 : 12000;
        else if (q <= 25) answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        else if (q <= 40) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 60) answers[key] = Math.min(5, Math.floor(q * 0.07) + 1);
        else if (q <= 80) answers[key] = ['small_class_size', 'sports_programs', 'arts_music', 'same_campus_siblings', 'english_medium'][q % 5];
        else answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        break;

      case 'transportation_mobility':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'walkable_priority' : q % 3 === 1 ? 'public_transit' : 'one_car_weekend';
        else if (q <= 30) answers[key] = q % 3 === 0 ? 'very_important' : 'important';
        else if (q <= 45) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 65) answers[key] = Math.min(5, Math.floor(q * 0.06) + 1);
        else if (q <= 85) answers[key] = ['bike_lanes', 'airport_90min', 'school_walking_distance', 'train_station', 'electric_car_charging'][q % 5];
        else answers[key] = q % 3 === 0 ? 'very_important' : 'important';
        break;

      case 'food_dining':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'essential' : q % 3 === 1 ? 'daily_cooking' : 'twice_weekly_dining';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : q % 5 === 0 ? false : true;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.08) + 1);
        else if (q <= 70) answers[key] = ['fresh_markets', 'diverse_cuisines', 'wine_region', 'vegetarian_options', 'coffee_culture'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'very_important' : 'important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      case 'family_children':
        if (q <= 15) answers[key] = q === 1 ? 2 : q === 2 ? '7_and_4' : q % 2 === 0 ? 'essential' : 'very_important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.08) + 1);
        else if (q <= 70) answers[key] = ['playgrounds_5min', 'soccer_club', 'swimming_lessons', 'art_classes', 'summer_camps'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      case 'pets_animals':
        if (q <= 15) answers[key] = q === 1 ? 'dog' : q === 2 ? 'labrador_30kg' : q === 3 ? 'biscuit' : q % 2 === 0 ? 'important' : 'very_important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.06) + 1);
        else if (q <= 70) answers[key] = ['dog_parks', 'pet_friendly_housing', 'veterinarian', 'dog_friendly_cafes', 'pet_transport'][q % 5];
        else if (q <= 85) answers[key] = q % 4 === 0 ? 'very_important' : 'important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      case 'professional_career':
        if (q <= 15) answers[key] = q === 1 ? 'saas_founder' : q === 2 ? 'fully_remote' : q === 3 ? '12_employees' : q % 2 === 0 ? 'important' : 'somewhat_important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.06) + 1);
        else if (q <= 70) answers[key] = ['coworking_space', 'tech_meetups', 'startup_ecosystem', 'timezone_overlap', 'networking_events'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'important' : 'somewhat_important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      case 'social_values_governance':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'essential' : q % 3 === 1 ? 'very_important' : 'important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.07) + 1);
        else if (q <= 70) answers[key] = ['democracy', 'press_freedom', 'low_corruption', 'rule_of_law', 'lgbtq_rights'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        else answers[key] = q % 2 === 0 ? 'strongly_agree' : 'agree';
        break;

      case 'shopping_services':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'important' : q % 3 === 1 ? 'somewhat_important' : 'not_critical';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(4, Math.floor(q * 0.05) + 1); // 2-4 (shopping less priority)
        else if (q <= 70) answers[key] = ['supermarket_10min', 'pharmacy_nearby', 'amazon_delivery', 'childrens_clothing', 'hardware_store'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'important' : 'somewhat_important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      case 'outdoor_recreation':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'essential' : q % 3 === 1 ? 'very_important' : 'important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.07) + 1);
        else if (q <= 70) answers[key] = ['hiking_trails', 'beach_30min', 'cycling_paths', 'playgrounds', 'golf_monthly'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'very_important' : 'important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      case 'entertainment_nightlife':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'somewhat_important' : q % 3 === 1 ? 'not_critical' : 'nice_to_have';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(3, Math.floor(q * 0.04) + 1); // 1-3 (low priority)
        else if (q <= 70) answers[key] = ['late_restaurants', 'wine_bars', 'live_music', 'english_cinema', 'cultural_festivals'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'nice_to_have' : 'somewhat_important';
        else answers[key] = q % 2 === 0 ? false : true;
        break;

      case 'neighborhood_urban_design':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'essential' : q % 3 === 1 ? 'very_important' : 'important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.07) + 1);
        else if (q <= 70) answers[key] = ['village_feel', 'tree_lined_streets', 'pedestrian_zones', 'mixed_use', 'low_rise'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        else answers[key] = q % 2 === 0 ? 'strongly_agree' : 'agree';
        break;

      case 'environment_community_appearance':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'essential' : q % 3 === 1 ? 'very_important' : 'important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.07) + 1);
        else if (q <= 70) answers[key] = ['clean_air', 'low_noise', 'green_spaces', 'recycling', 'well_maintained'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'very_important' : 'important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      case 'religion_spirituality':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'not_important' : q % 3 === 1 ? 'somewhat_unimportant' : 'neutral';
        else if (q <= 30) answers[key] = q % 2 === 0 ? false : true; // mostly don't need religious services
        else if (q <= 50) answers[key] = Math.min(2, Math.floor(q * 0.03) + 1); // 1-2 (very low priority)
        else if (q <= 70) answers[key] = ['secular_government', 'tolerant_environment', 'cultural_festivals', 'no_theocracy', 'diverse_beliefs'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'not_important' : 'neutral';
        else answers[key] = q % 2 === 0 ? false : true;
        break;

      case 'sexual_beliefs_practices_laws':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'essential' : q % 3 === 1 ? 'very_important' : 'important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(5, Math.floor(q * 0.07) + 1);
        else if (q <= 70) answers[key] = ['lgbtq_legal_protection', 'same_sex_marriage', 'gender_equality', 'reproductive_rights', 'progressive_attitudes'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        else answers[key] = q % 2 === 0 ? 'strongly_agree' : 'agree';
        break;

      case 'arts_culture':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'important' : q % 3 === 1 ? 'somewhat_important' : 'nice_to_have';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(4, Math.floor(q * 0.06) + 1); // 3-4 (moderate priority)
        else if (q <= 70) answers[key] = ['museums_galleries', 'live_theater', 'art_classes', 'film_festivals', 'beautiful_architecture'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'important' : 'somewhat_important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      case 'cultural_heritage_traditions':
        if (q <= 15) answers[key] = q % 3 === 0 ? 'very_important' : q % 3 === 1 ? 'important' : 'somewhat_important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 50) answers[key] = Math.min(4, Math.floor(q * 0.06) + 1); // 3-4
        else if (q <= 70) answers[key] = ['local_language_classes', 'traditional_markets', 'seasonal_festivals', 'bilingual_children', 'historical_depth'][q % 5];
        else if (q <= 85) answers[key] = q % 3 === 0 ? 'very_important' : 'important';
        else answers[key] = q % 2 === 0 ? true : false;
        break;

      default:
        answers[key] = `answer_${q}`;
    }
  }

  return answers;
}

/**
 * Inject test persona module answers into localStorage.
 * This simulates having completed ALL 23 module questionnaires.
 */
export function injectTestModuleAnswers(): void {
  for (const moduleId of ALL_MODULE_IDS) {
    const answers = generateModuleAnswers(moduleId);
    localStorage.setItem(`clues-module-${moduleId}`, JSON.stringify(answers));
  }
}

/**
 * Clear test persona module answers from localStorage.
 */
export function clearTestModuleAnswers(): void {
  for (const moduleId of ALL_MODULE_IDS) {
    localStorage.removeItem(`clues-module-${moduleId}`);
  }
}

// ─── Complete Test Session ───────────────────────────────────

export function buildTestPersonaSession(): UserSession {
  const now = new Date().toISOString();

  return {
    id: `test-persona-${Date.now()}`,
    globe: TEST_GLOBE,
    paragraphical: {
      status: 'completed',
      paragraphs: TEST_PARAGRAPHS,
      extraction: TEST_EXTRACTION,
    },
    mainModule: {
      subSectionStatus: {
        demographics: 'completed',
        dnw: 'completed',
        mh: 'completed',
        general: 'completed',
        tradeoffs: 'completed',
      },
      demographics: TEST_DEMOGRAPHICS,
      dnw: TEST_DNW,
      mh: TEST_MH,
      tradeoffAnswers: TEST_TRADEOFFS,
      generalAnswers: TEST_GENERAL,
    },
    completedModules: [...ALL_MODULE_IDS],
    currentTier: 'precision',
    confidence: 98,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * CLUES Intelligence — Test Persona
 * Dev-only pre-loaded complete user data.
 *
 * Injects a full UserSession so the app has a scaffold to fire the
 * entire LLM API cascade without completing the 3-hour questionnaire.
 *
 * Persona: Marcus & Elena — dual-citizen tech entrepreneur couple,
 * 2 kids, relocating from Austin TX to Southern Europe.
 *
 * This file provides:
 *   - 30 completed paragraphs (P1-P30)
 *   - Full demographics, DNW, MH, tradeoff, general answers
 *   - A GeminiExtraction with metrics, recommendations, and thinking
 *   - Globe selection (Southern Europe / Mediterranean)
 *   - Tier set to 'validated' with 88% confidence
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

// ─── Demographics ────────────────────────────────────────────

const TEST_DEMOGRAPHICS: DemographicAnswers = {
  age: 38,
  gender: 'male',
  nationality: 'American',
  dual_citizenship: 'Italian',
  marital_status: 'married',
  partner_age: 35,
  partner_nationality: 'Brazilian-American',
  children_count: 2,
  children_ages: '7,4',
  pets: 'dog',
  pet_type: 'Labrador',
  primary_language: 'English',
  secondary_languages: 'Italian,Portuguese',
  employment_type: 'business_owner',
  remote_work: true,
  industry: 'technology',
  annual_income_usd: 320000,
  monthly_budget_eur: 7500,
  savings_usd: 180000,
  current_city: 'Austin',
  current_country: 'United States',
  move_timeline_months: 7,
};

// ─── Do Not Wants ────────────────────────────────────────────

const TEST_DNW: DNWAnswers = [
  { questionId: 'dnw_1', value: 'high_violent_crime', severity: 5 },
  { questionId: 'dnw_2', value: 'no_international_schools', severity: 5 },
  { questionId: 'dnw_3', value: 'slow_internet_under_50mbps', severity: 5 },
  { questionId: 'dnw_4', value: 'extreme_heat_over_40c', severity: 4 },
  { questionId: 'dnw_5', value: 'political_instability', severity: 5 },
  { questionId: 'dnw_6', value: 'no_english_healthcare', severity: 4 },
  { questionId: 'dnw_7', value: 'anti_lgbtq_laws', severity: 5 },
  { questionId: 'dnw_8', value: 'high_corruption', severity: 4 },
  { questionId: 'dnw_9', value: 'no_pet_friendly_housing', severity: 3 },
  { questionId: 'dnw_10', value: 'extreme_humidity', severity: 3 },
];

// ─── Must Haves ──────────────────────────────────────────────

const TEST_MH: MHAnswers = [
  { questionId: 'mh_1', value: 'fiber_internet_100mbps', importance: 5 },
  { questionId: 'mh_2', value: 'international_school_english', importance: 5 },
  { questionId: 'mh_3', value: 'safe_walkable_neighborhood', importance: 5 },
  { questionId: 'mh_4', value: 'mediterranean_climate', importance: 4 },
  { questionId: 'mh_5', value: 'direct_us_flights', importance: 4 },
  { questionId: 'mh_6', value: 'modern_healthcare', importance: 5 },
  { questionId: 'mh_7', value: 'coworking_spaces', importance: 3 },
  { questionId: 'mh_8', value: 'food_markets', importance: 4 },
  { questionId: 'mh_9', value: 'outdoor_activities', importance: 4 },
  { questionId: 'mh_10', value: 'startup_community', importance: 3 },
];

// ─── Tradeoffs ───────────────────────────────────────────────

const TEST_TRADEOFFS: TradeoffAnswers = {
  safety_vs_cost: 85,           // Strongly favor safety
  climate_vs_career: 60,        // Slightly favor climate
  education_vs_nightlife: 95,   // Strongly favor education
  space_vs_walkability: 40,     // Slightly favor walkability
  local_culture_vs_expat: 70,   // Favor local culture
  healthcare_vs_taxes: 75,      // Favor healthcare
  nature_vs_urban: 55,          // Balanced, slight nature
  family_vs_adventure: 65,      // Slightly favor family
};

// ─── General Answers ─────────────────────────────────────────

const TEST_GENERAL: GeneralAnswers = {
  ideal_population: '200000-500000',
  max_commute_minutes: 20,
  noise_tolerance: 'low',
  preferred_architecture: 'historic_european',
  cooking_frequency: 'daily',
  dining_out_frequency: 'twice_weekly',
  exercise_type: 'hiking,cycling,gym',
  work_schedule: 'flexible_9_to_5',
  social_style: 'small_gatherings',
  music_preference: 'jazz,classical,indie',
  news_consumption: 'daily',
  political_leaning: 'center_left',
  religious_attendance: 'never',
  vacation_style: 'cultural_exploration',
  car_dependency: 'minimal',
  tech_adoption: 'early_adopter',
  risk_tolerance: 'moderate',
  time_horizon_years: 5,
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

// ─── Module Answers (12 of 23 modules, ~50 questions each) ───

/** Modules to mark complete with pre-filled answers */
const COMPLETED_MODULE_IDS = [
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
];

/**
 * Generate persona-consistent answers for a module.
 * Uses the module ID to produce contextually appropriate answers
 * matching Marcus & Elena's profile.
 */
function generateModuleAnswers(moduleId: string): Record<string, string | number | boolean | string[]> {
  const answers: Record<string, string | number | boolean | string[]> = {};

  // Generate 50 answers per module (half of 100 questions)
  for (let q = 1; q <= 50; q++) {
    const key = `${moduleId}__q${q}`;

    switch (moduleId) {
      case 'safety_security':
        if (q <= 10) answers[key] = q % 3 === 0 ? 'very_important' : 'essential';
        else if (q <= 20) answers[key] = q % 2 === 0 ? true : false; // boolean questions
        else if (q <= 30) answers[key] = Math.floor(Math.random() * 3) + 8; // 8-10 scale (high safety priority)
        else if (q <= 40) answers[key] = ['neighborhood_watch', 'low_crime', 'well_lit_streets'][q % 3];
        else answers[key] = q % 4 === 0 ? 'strongly_agree' : 'agree';
        break;

      case 'health_wellness':
        if (q <= 10) answers[key] = q === 3 ? 'asthma_child' : q % 2 === 0 ? 'regular_checkups' : 'gym_access';
        else if (q <= 20) answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 40) answers[key] = Math.floor(Math.random() * 2) + 4; // 4-5 importance
        else answers[key] = ['english_speaking_doctors', 'pediatric_specialists', 'universal_healthcare', 'private_insurance_option'][q % 4];
        break;

      case 'climate_weather':
        if (q <= 10) answers[key] = q % 3 === 0 ? 'mediterranean' : q % 3 === 1 ? 'warm_temperate' : 'subtropical';
        else if (q <= 15) answers[key] = Math.floor(Math.random() * 5) + 26; // 26-30 preferred temp
        else if (q <= 20) answers[key] = q % 2 === 0 ? true : false; // likes sunshine
        else if (q <= 30) answers[key] = Math.floor(Math.random() * 2) + 4; // 4-5
        else if (q <= 40) answers[key] = q % 2 === 0 ? 'low_humidity' : 'mild_winters';
        else answers[key] = ['outdoor_dining_year_round', 'beach_access', 'no_extreme_heat'][q % 3];
        break;

      case 'legal_immigration':
        if (q <= 10) answers[key] = q === 1 ? 'eu_citizen' : q === 2 ? 'spouse_needs_visa' : 'entrepreneur_visa';
        else if (q <= 20) answers[key] = q % 3 === 0 ? 'very_important' : 'important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 40) answers[key] = Math.floor(Math.random() * 2) + 3; // 3-4
        else answers[key] = ['beckham_law', 'nhm_regime', 'flat_tax_option'][q % 3];
        break;

      case 'financial_banking':
        if (q <= 5) answers[key] = 320000; // income
        else if (q <= 10) answers[key] = q % 2 === 0 ? 'wise_revolut' : 'local_bank';
        else if (q <= 20) answers[key] = q % 3 === 0 ? 'essential' : 'important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 40) answers[key] = Math.floor(Math.random() * 2) + 3;
        else answers[key] = ['low_transfer_fees', 'usd_eur_accounts', 'tax_optimization'][q % 3];
        break;

      case 'housing_property':
        if (q <= 5) answers[key] = q === 1 ? '3_bedroom' : q === 2 ? '120_sqm_min' : 'rent_first_then_buy';
        else if (q <= 10) answers[key] = q % 2 === 0 ? 3000 : 2500; // budget range
        else if (q <= 20) answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 40) answers[key] = Math.floor(Math.random() * 2) + 4;
        else answers[key] = ['terrace_garden', 'near_school', 'modern_renovated', 'furnished'][q % 4];
        break;

      case 'technology_connectivity':
        if (q <= 10) answers[key] = q === 1 ? 100 : q === 2 ? 'fiber_required' : q % 2 === 0 ? 'essential' : 'very_important';
        else if (q <= 20) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 30) answers[key] = Math.floor(Math.random() * 2) + 4;
        else if (q <= 40) answers[key] = ['5g_coverage', 'backup_hotspot', 'vpn_friendly'][q % 3];
        else answers[key] = q % 3 === 0 ? 'essential' : 'important';
        break;

      case 'education_learning':
        if (q <= 5) answers[key] = q === 1 ? 'ib_curriculum' : q === 2 ? 'british_system' : 'bilingual_program';
        else if (q <= 10) answers[key] = q % 2 === 0 ? 15000 : 12000; // tuition budget
        else if (q <= 20) answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 40) answers[key] = Math.floor(Math.random() * 2) + 4;
        else answers[key] = ['small_class_size', 'sports_programs', 'arts_music', 'same_campus_siblings'][q % 4];
        break;

      case 'transportation_mobility':
        if (q <= 10) answers[key] = q % 3 === 0 ? 'walkable_priority' : q % 3 === 1 ? 'public_transit' : 'one_car_weekend';
        else if (q <= 20) answers[key] = q % 3 === 0 ? 'very_important' : 'important';
        else if (q <= 30) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 40) answers[key] = Math.floor(Math.random() * 2) + 3;
        else answers[key] = ['bike_lanes', 'airport_90min', 'school_walking_distance'][q % 3];
        break;

      case 'food_dining':
        if (q <= 10) answers[key] = q % 3 === 0 ? 'essential' : q % 3 === 1 ? 'daily_cooking' : 'twice_weekly_dining';
        else if (q <= 20) answers[key] = q % 2 === 0 ? true : q % 5 === 0 ? false : true;
        else if (q <= 30) answers[key] = Math.floor(Math.random() * 2) + 4;
        else if (q <= 40) answers[key] = ['fresh_markets', 'diverse_cuisines', 'wine_region', 'vegetarian_options'][q % 4];
        else answers[key] = q % 3 === 0 ? 'very_important' : 'important';
        break;

      case 'family_children':
        if (q <= 10) answers[key] = q === 1 ? 2 : q === 2 ? '7_and_4' : q % 2 === 0 ? 'essential' : 'very_important';
        else if (q <= 20) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 30) answers[key] = Math.floor(Math.random() * 2) + 4;
        else if (q <= 40) answers[key] = ['playgrounds_5min', 'soccer_club', 'swimming_lessons', 'art_classes'][q % 4];
        else answers[key] = q % 3 === 0 ? 'essential' : 'very_important';
        break;

      case 'pets_animals':
        if (q <= 10) answers[key] = q === 1 ? 'dog' : q === 2 ? 'labrador_30kg' : q % 2 === 0 ? 'important' : 'very_important';
        else if (q <= 20) answers[key] = q % 2 === 0 ? true : false;
        else if (q <= 30) answers[key] = Math.floor(Math.random() * 2) + 3;
        else if (q <= 40) answers[key] = ['dog_parks', 'pet_friendly_housing', 'veterinarian', 'dog_friendly_cafes'][q % 4];
        else answers[key] = q % 4 === 0 ? 'very_important' : 'important';
        break;

      default:
        answers[key] = `answer_${q}`;
    }
  }

  return answers;
}

/**
 * Inject test persona module answers into localStorage.
 * This simulates having completed 12 module questionnaires.
 */
export function injectTestModuleAnswers(): void {
  for (const moduleId of COMPLETED_MODULE_IDS) {
    const answers = generateModuleAnswers(moduleId);
    localStorage.setItem(`clues-module-${moduleId}`, JSON.stringify(answers));
  }
}

/**
 * Clear test persona module answers from localStorage.
 */
export function clearTestModuleAnswers(): void {
  for (const moduleId of COMPLETED_MODULE_IDS) {
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
    completedModules: [...COMPLETED_MODULE_IDS],
    currentTier: 'precision',
    confidence: 94,
    createdAt: now,
    updatedAt: now,
  };
}

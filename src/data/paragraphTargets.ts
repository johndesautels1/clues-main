/**
 * Paragraph Coverage Targets
 * Defines what each of the 27 paragraphs should cover.
 * Used by the Olivia Tutor (useOliviaTutor hook) for real-time guidance.
 *
 * Structure matches src/data/paragraphs.ts:
 *   Phase 1: Your Profile (P1-P2)
 *   Phase 2: Do Not Wants (P3)
 *   Phase 3: Must Haves (P4)
 *   Phase 4: Trade-offs (P5)
 *   Phase 5: Module Deep Dives (P6-P25)
 *   Phase 6: Your Vision (P26-P27)
 *
 * Each paragraph has:
 * - coverageTargets: the key topics Gemini needs to extract
 * - keywords per target: for local keyword detection (Layer 2, zero cost)
 * - templateInterjections: pre-written Olivia prompts when a target is missing
 */

export interface CoverageTarget {
  id: string;
  label: string;
  keywords: string[];
}

export interface ParagraphTargets {
  paragraphId: number;
  heading: string;
  coverageTargets: CoverageTarget[];
  templateInterjections: Record<string, string>;
}

export const PARAGRAPH_TARGETS: ParagraphTargets[] = [
  // ═══ PHASE 1: YOUR PROFILE ═══
  {
    paragraphId: 1,
    heading: 'Who You Are',
    coverageTargets: [
      { id: 'age', label: 'Age', keywords: ['age', 'years old', 'born in', 'turning', 'mid-', 'early ', 'late ', '20s', '30s', '40s', '50s', '60s', '70s'] },
      { id: 'gender', label: 'Gender', keywords: ['male', 'female', 'man', 'woman', 'non-binary', 'he', 'she', 'they'] },
      { id: 'nationality', label: 'Nationality/citizenship', keywords: ['passport', 'citizen', 'nationality', 'american', 'british', 'canadian', 'australian', 'european', 'dual'] },
      { id: 'household', label: 'Household composition', keywords: ['single', 'married', 'partner', 'wife', 'husband', 'kids', 'children', 'family', 'alone', 'couple', 'solo', 'daughter', 'son'] },
      { id: 'languages', label: 'Languages spoken', keywords: ['speak', 'language', 'fluent', 'english', 'spanish', 'french', 'german', 'bilingual', 'native', 'learning'] },
      { id: 'employment_type', label: 'Employment type', keywords: ['remote', 'freelance', 'business owner', 'retired', 'student', 'self-employed', 'employee', 'contractor', 'entrepreneur'] },
    ],
    templateInterjections: {
      age: "Great start! Your age bracket matters a lot — healthcare, visa options, and even nightlife vary hugely by age. Mind sharing roughly how old you are?",
      nationality: "Love the detail! What passport(s) do you hold? It's the single biggest factor for visa pathways and where you can actually move.",
      household: "Nice picture of who you are! Are you moving solo, with a partner, or with family? It changes recommendations dramatically.",
      employment_type: "What's your employment type — remote worker, freelancer, business owner, retired? It affects which visas you qualify for.",
    },
  },
  {
    paragraphId: 2,
    heading: 'Your Life Right Now',
    coverageTargets: [
      { id: 'current_location', label: 'Current city/country', keywords: ['live in', 'living in', 'based in', 'currently in', 'hometown', 'home city'] },
      { id: 'income', label: 'Monthly income/budget', keywords: ['income', 'earn', 'make', 'salary', 'budget', 'per month', 'annually', 'after tax'] },
      { id: 'currency', label: 'Currency', keywords: ['dollar', 'euro', 'pound', 'usd', 'eur', 'gbp', 'thb', 'aud', 'cad', '$', 'currency'] },
      { id: 'push_factors', label: 'Push factors', keywords: ['hate', 'tired of', 'frustrated', 'expensive', 'crime', 'traffic', 'weather', 'leaving because', 'escape'] },
      { id: 'timeline', label: 'Timeline', keywords: ['soon', 'asap', 'next year', 'months', 'ready', 'planning', 'years', 'timeline', 'when', 'urgent'] },
    ],
    templateInterjections: {
      income: "Where you live now is clear — what about your monthly income or budget? Even a rough range helps us match cities to your financial reality.",
      timeline: "Quick thought — what's your timeline? Moving next month versus next year changes which visa pathways are realistic.",
      currency: "What currency is your income in? This matters for exchange rate impacts and cost-of-living comparisons.",
    },
  },

  // ═══ PHASE 2: DO NOT WANTS ═══
  {
    paragraphId: 3,
    heading: 'Your Dealbreakers',
    coverageTargets: [
      { id: 'climate_dnw', label: 'Climate dealbreakers', keywords: ['humidity', 'heat', 'cold', 'snow', 'ice', 'tropical', 'desert', 'too hot', 'too cold', 'freezing'] },
      { id: 'safety_dnw', label: 'Safety dealbreakers', keywords: ['crime', 'violence', 'dangerous', 'war', 'conflict', 'cartel', 'corrupt', 'unstable'] },
      { id: 'legal_dnw', label: 'Legal dealbreakers', keywords: ['no visa', 'illegal', 'banned', 'restricted', 'no residency', 'no pathway', 'deport'] },
      { id: 'healthcare_dnw', label: 'Healthcare dealbreakers', keywords: ['no hospital', 'no doctor', 'no specialist', 'no pharmacy', 'no healthcare', 'medical'] },
      { id: 'region_dnw', label: 'Excluded regions/countries', keywords: ['refuse', 'never', 'not', 'exclude', 'avoid', 'no way', 'except', 'only'] },
      { id: 'cultural_dnw', label: 'Cultural dealbreakers', keywords: ['intolerant', 'censorship', 'oppressive', 'authoritarian', 'discrimination', 'homophobic', 'racist'] },
    ],
    templateInterjections: {
      climate_dnw: "What climate would be completely unacceptable? Extreme humidity, freezing winters, desert heat? These hard walls eliminate cities before scoring even begins.",
      safety_dnw: "Any safety-related dealbreakers? Certain crime levels, political instability, or conflict zones you'd never consider?",
      region_dnw: "Are there specific countries or regions you absolutely refuse to consider? Even if they'd otherwise score well?",
    },
  },

  // ═══ PHASE 3: MUST HAVES ═══
  {
    paragraphId: 4,
    heading: 'Your Non-Negotiables',
    coverageTargets: [
      { id: 'internet_mh', label: 'Internet requirement', keywords: ['internet', 'mbps', 'wifi', 'broadband', 'fiber', 'speed', 'connection'] },
      { id: 'medical_mh', label: 'Medical requirement', keywords: ['hospital', 'doctor', 'specialist', 'medication', 'pharmacy', 'healthcare', 'medical'] },
      { id: 'airport_mh', label: 'Airport proximity', keywords: ['airport', 'flight', 'fly', 'international', 'within', 'hours', 'direct'] },
      { id: 'language_mh', label: 'Language requirement', keywords: ['english', 'speak', 'language', 'communicate', 'understand', 'widely spoken'] },
      { id: 'visa_mh', label: 'Visa requirement', keywords: ['visa', 'residency', 'permit', 'legal', 'pathway', 'digital nomad', 'work permit'] },
      { id: 'safety_mh', label: 'Safety requirement', keywords: ['safe', 'safety', 'low crime', 'secure', 'stable', 'peaceful'] },
    ],
    templateInterjections: {
      internet_mh: "What's the minimum internet speed your life requires? If you work remotely, this is a hard filter.",
      medical_mh: "Any medical must-haves? Specific specialists, medications, or hospital standards you absolutely need access to?",
      visa_mh: "What visa pathway must be available? Not all countries offer digital nomad visas or paths to permanent residency.",
    },
  },

  // ═══ PHASE 4: TRADE-OFFS ═══
  {
    paragraphId: 5,
    heading: 'Your Trade-offs',
    coverageTargets: [
      { id: 'cost_vs_quality', label: 'Cost vs quality trade-off', keywords: ['pay more', 'spend more', 'cheaper', 'budget', 'sacrifice', 'afford', 'expensive'] },
      { id: 'urban_vs_nature', label: 'Urban vs nature trade-off', keywords: ['city', 'urban', 'nature', 'rural', 'quiet', 'lively', 'nightlife', 'beach', 'mountain'] },
      { id: 'convenience_vs_charm', label: 'Convenience vs charm', keywords: ['modern', 'convenient', 'character', 'charm', 'old', 'historic', 'infrastructure'] },
      { id: 'language_barrier', label: 'Language barrier tolerance', keywords: ['language', 'learn', 'barrier', 'speak', 'english', 'local language', 'immerse'] },
      { id: 'weather_vs_other', label: 'Weather vs other priorities', keywords: ['weather', 'climate', 'sacrifice', 'tolerate', 'accept', 'give up', 'trade'] },
    ],
    templateInterjections: {
      cost_vs_quality: "Would you pay significantly more rent for a safer, better-located neighborhood? How you answer trade-offs tells us how to weight your priorities.",
      language_barrier: "How much of a language barrier can you tolerate? Some amazing cities require learning a new language — is that a plus or a minus for you?",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Survival ═══
  {
    paragraphId: 6,
    heading: 'Climate & Weather',
    coverageTargets: [
      { id: 'temperature', label: 'Temperature preference', keywords: ['hot', 'cold', 'warm', 'cool', 'degrees', 'celsius', 'fahrenheit', 'temperature', 'heat', 'mild'] },
      { id: 'humidity', label: 'Humidity tolerance', keywords: ['humid', 'humidity', 'dry', 'moisture', 'sticky', 'arid', 'tropical', 'muggy'] },
      { id: 'seasons', label: 'Seasonal preference', keywords: ['seasons', 'winter', 'summer', 'spring', 'autumn', 'year-round', 'seasonal', 'snow', 'four seasons'] },
      { id: 'sunshine', label: 'Sunshine needs', keywords: ['sun', 'sunny', 'sunshine', 'overcast', 'cloudy', 'rain', 'rainy', 'gloomy', 'bright'] },
      { id: 'disasters', label: 'Natural disaster tolerance', keywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'typhoon', 'wildfire', 'disaster', 'storm'] },
      { id: 'air_quality', label: 'Air quality', keywords: ['air quality', 'pollution', 'smog', 'clean air', 'asthma', 'allergies'] },
    ],
    templateInterjections: {
      humidity: "Love how specific you are about temperature! Are you more of a dry-heat person or do you handle humidity okay? That single factor eliminates about 40% of cities.",
      disasters: "Have you thought about natural disaster risk? Some dream-weather cities sit in earthquake or hurricane zones.",
    },
  },
  {
    paragraphId: 7,
    heading: 'Safety & Security',
    coverageTargets: [
      { id: 'crime', label: 'Crime concerns', keywords: ['crime', 'theft', 'robbery', 'violence', 'murder', 'pickpocket', 'assault', 'safe', 'dangerous'] },
      { id: 'political', label: 'Political stability', keywords: ['political', 'government', 'corrupt', 'stable', 'democracy', 'protest', 'coup', 'conflict'] },
      { id: 'emergency', label: 'Emergency services', keywords: ['police', 'ambulance', 'hospital', 'fire', 'emergency', '911', 'response time'] },
      { id: 'personal_safety', label: 'Personal safety specifics', keywords: ['walk at night', 'solo', 'woman', 'lgbtq', 'minority', 'discrimination', 'harass'] },
      { id: 'neighborhood', label: 'Neighborhood feel', keywords: ['neighborhood', 'street', 'walk', 'night', 'comfortable', 'vibe', 'friendly', 'quiet'] },
    ],
    templateInterjections: {
      political: "What about political stability? Some cities feel safe day-to-day but have underlying political instability affecting long-term planning.",
      personal_safety: "Any specific personal safety concerns? Walking alone at night, LGBTQ+ friendliness, or being a visible minority vary enormously between cities.",
    },
  },
  {
    paragraphId: 8,
    heading: 'Healthcare & Medical',
    coverageTargets: [
      { id: 'conditions', label: 'Medical conditions', keywords: ['condition', 'chronic', 'diabetes', 'asthma', 'allergy', 'disability', 'mental health', 'anxiety', 'depression'] },
      { id: 'medication', label: 'Medication needs', keywords: ['medication', 'medicine', 'prescription', 'drug', 'pharmacy', 'refill', 'blood thinner', 'insulin'] },
      { id: 'specialists', label: 'Specialist access', keywords: ['specialist', 'doctor', 'surgeon', 'therapist', 'psychiatrist', 'dentist', 'cardiologist'] },
      { id: 'insurance', label: 'Healthcare system/insurance', keywords: ['insurance', 'healthcare', 'public health', 'private', 'cost', 'coverage', 'universal'] },
      { id: 'english_doctors', label: 'English-speaking doctors', keywords: ['english', 'speak english', 'communicate', 'understand', 'english-speaking'] },
    ],
    templateInterjections: {
      medication: "Do you take any regular medications? Pharmacy access varies wildly — some medications that are over-the-counter at home need prescriptions abroad.",
      insurance: "How would you handle health insurance abroad? Some countries have excellent public systems, others require expensive private coverage.",
    },
  },
  {
    paragraphId: 9,
    heading: 'Housing & Real Estate',
    coverageTargets: [
      { id: 'type', label: 'Property type', keywords: ['apartment', 'house', 'villa', 'condo', 'loft', 'studio', 'penthouse', 'flat'] },
      { id: 'size', label: 'Size requirements', keywords: ['bedroom', 'bathroom', 'sqm', 'sqft', 'space', 'big', 'small', 'spacious'] },
      { id: 'rent_buy', label: 'Rent vs buy', keywords: ['rent', 'buy', 'purchase', 'own', 'lease', 'mortgage', 'invest'] },
      { id: 'budget', label: 'Housing budget', keywords: ['budget', 'afford', 'cost', 'price', 'per month', 'rent for', 'spend'] },
      { id: 'neighborhood_char', label: 'Neighborhood character', keywords: ['urban', 'suburban', 'rural', 'quiet', 'lively', 'downtown', 'central', 'walkable'] },
    ],
    templateInterjections: {
      rent_buy: "Renting or buying? It's a huge factor — some countries restrict foreign ownership entirely.",
      budget: "What's your housing budget? Knowing a range lets us find cities where your dream home is actually affordable.",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Foundation ═══
  {
    paragraphId: 10,
    heading: 'Legal & Immigration',
    coverageTargets: [
      { id: 'passport', label: 'Passport', keywords: ['passport', 'citizen', 'dual', 'nationality', 'visa-free', 'eu', 'us', 'uk'] },
      { id: 'visa_type', label: 'Visa interest', keywords: ['visa', 'digital nomad', 'retirement', 'investor', 'work permit', 'golden visa', 'freelance'] },
      { id: 'residency', label: 'Residency pathway', keywords: ['residency', 'permanent', 'citizenship', 'naturalize', 'path', 'timeline', 'temporary'] },
      { id: 'rule_of_law', label: 'Rule of law', keywords: ['rule of law', 'judicial', 'contract', 'enforcement', 'legal system', 'courts', 'corruption'] },
    ],
    templateInterjections: {
      visa_type: "What type of visa pathway interests you? Digital nomad, retirement, investor — each opens different countries.",
      rule_of_law: "How important is rule of law? Contract enforcement, judicial independence, and corruption levels vary dramatically.",
    },
  },
  {
    paragraphId: 11,
    heading: 'Financial & Banking',
    coverageTargets: [
      { id: 'income', label: 'Monthly income', keywords: ['income', 'salary', 'earn', 'make', 'revenue', 'pension', 'per month'] },
      { id: 'cost_of_living', label: 'Cost of living tolerance', keywords: ['cost of living', 'afford', 'expenses', 'monthly', 'budget', 'comfortable'] },
      { id: 'taxes', label: 'Tax sensitivity', keywords: ['tax', 'income tax', 'capital gains', 'property tax', 'tax-free', 'low tax', 'effective rate'] },
      { id: 'banking', label: 'Banking needs', keywords: ['bank', 'banking', 'transfer', 'crypto', 'international', 'account', 'currency'] },
    ],
    templateInterjections: {
      taxes: "Tax structure can make or break a budget. Some countries won't tax your foreign income at all, others take 30%+. Any thoughts on your tax tolerance?",
      banking: "How important is banking access for foreigners? Some countries make it very difficult to open an account.",
    },
  },
  {
    paragraphId: 12,
    heading: 'Legal Independence & Freedom',
    coverageTargets: [
      { id: 'speech', label: 'Freedom of speech/press', keywords: ['speech', 'press', 'expression', 'say', 'opinion', 'protest', 'journalism', 'media'] },
      { id: 'substances', label: 'Substance laws', keywords: ['alcohol', 'cannabis', 'marijuana', 'weed', 'drug', 'legal', 'decriminalized'] },
      { id: 'lgbtq', label: 'LGBTQ+ rights', keywords: ['lgbtq', 'gay', 'lesbian', 'trans', 'queer', 'same-sex', 'marriage equality', 'pride'] },
      { id: 'internet_freedom', label: 'Internet freedom', keywords: ['internet', 'censorship', 'vpn', 'blocked', 'surveillance', 'privacy', 'firewall'] },
      { id: 'lifestyle', label: 'Lifestyle freedom', keywords: ['lifestyle', 'gambling', 'alternative', 'freedom', 'choice', 'autonomy', 'liberty'] },
    ],
    templateInterjections: {
      substances: "How do you feel about substance laws? Cannabis legality, alcohol availability — these vary wildly and surprise many expats.",
      internet_freedom: "How important is unrestricted internet? Some countries block VPNs, social media, or news sites.",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Growth ═══
  {
    paragraphId: 13,
    heading: 'Business & Entrepreneurship',
    coverageTargets: [
      { id: 'work_type', label: 'Work type', keywords: ['remote', 'freelance', 'business', 'startup', 'agency', 'consulting', 'employed'] },
      { id: 'coworking', label: 'Coworking needs', keywords: ['coworking', 'co-working', 'workspace', 'office', 'cafe', 'desk', 'nomad'] },
      { id: 'business_reg', label: 'Business registration', keywords: ['register', 'llc', 'company', 'incorporate', 'business', 'corporate tax', 'license'] },
      { id: 'networking', label: 'Professional networking', keywords: ['network', 'community', 'meetup', 'conference', 'professional', 'ecosystem'] },
    ],
    templateInterjections: {
      coworking: "Do you need coworking spaces or good cafe-working culture? Some cities have incredible nomad infrastructure; others have nothing.",
      business_reg: "Planning to register a business locally? Corporate tax and regulations vary enormously — some cities make it trivial, others are bureaucratic nightmares.",
    },
  },
  {
    paragraphId: 14,
    heading: 'Technology & Connectivity',
    coverageTargets: [
      { id: 'internet_speed', label: 'Internet speed needs', keywords: ['mbps', 'speed', 'fast', 'fiber', 'broadband', 'download', 'upload', 'gigabit'] },
      { id: 'mobile', label: '5G/mobile coverage', keywords: ['5g', '4g', 'mobile', 'cell', 'coverage', 'signal', 'data', 'sim'] },
      { id: 'power_grid', label: 'Power reliability', keywords: ['power', 'outage', 'blackout', 'reliable', 'electric', 'grid', 'backup', 'generator'] },
      { id: 'cloud_services', label: 'Cloud/service access', keywords: ['aws', 'cloud', 'google', 'vpn', 'latency', 'service', 'platform'] },
    ],
    templateInterjections: {
      internet_speed: "What internet speed do you actually need? Download AND upload? If you do video calls, 50+ Mbps minimum.",
      power_grid: "How reliable does the power grid need to be? Some tropical paradises have daily outages.",
    },
  },
  {
    paragraphId: 15,
    heading: 'Transportation & Mobility',
    coverageTargets: [
      { id: 'car', label: 'Car ownership', keywords: ['car', 'drive', 'driving', 'parking', 'vehicle', 'motorcycle', 'scooter'] },
      { id: 'transit', label: 'Public transit', keywords: ['transit', 'bus', 'metro', 'subway', 'train', 'tram', 'public transport'] },
      { id: 'walkability', label: 'Walkability', keywords: ['walk', 'walkable', 'pedestrian', 'foot', 'walkability', 'sidewalk'] },
      { id: 'airport', label: 'Airport proximity', keywords: ['airport', 'fly', 'flight', 'international', 'travel', 'airline', 'hub', 'direct'] },
      { id: 'rideshare', label: 'Ride-sharing', keywords: ['uber', 'lyft', 'grab', 'taxi', 'rideshare', 'cab'] },
    ],
    templateInterjections: {
      airport: "How often do you travel internationally? Airport proximity matters — a walkable city 3 hours from an airport changes the equation.",
      car: "Car or car-free? It's a major lifestyle and cost difference. Some cities are impossible without one.",
    },
  },
  {
    paragraphId: 16,
    heading: 'Education & Learning',
    coverageTargets: [
      { id: 'kids_ed', label: 'Children\'s education', keywords: ['school', 'kids', 'children', 'international school', 'ib', 'curriculum', 'preschool'] },
      { id: 'personal_ed', label: 'Personal education', keywords: ['learn', 'study', 'degree', 'course', 'university', 'certification'] },
      { id: 'language_learning', label: 'Language learning', keywords: ['language', 'spanish', 'french', 'portuguese', 'mandarin', 'immersion', 'class'] },
      { id: 'no_ed_needs', label: 'No education needs', keywords: ['no kids', 'no children', 'not applicable', 'not a priority', 'doesn\'t apply'] },
    ],
    templateInterjections: {
      kids_ed: "Do your kids need schooling? International school quality varies enormously — costs range from free to $30,000/year.",
      language_learning: "Interested in learning the local language? Cities with strong language schools make integration much easier.",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Connection ═══
  {
    paragraphId: 17,
    heading: 'Family & Children',
    coverageTargets: [
      { id: 'who_comes', label: 'Who is relocating', keywords: ['partner', 'wife', 'husband', 'spouse', 'kids', 'children', 'parents', 'alone', 'solo', 'family'] },
      { id: 'partner_needs', label: 'Partner\'s needs', keywords: ['partner', 'spouse', 'their job', 'their career', 'they need', 'they want'] },
      { id: 'kids_ages', label: 'Children\'s ages/needs', keywords: ['baby', 'toddler', 'teenager', 'teen', 'school age', 'years old', 'daycare'] },
      { id: 'family_visits', label: 'Visiting family back home', keywords: ['visit', 'family', 'parents', 'fly back', 'home', 'times a year'] },
      { id: 'solo', label: 'Solo/no dependents', keywords: ['solo', 'alone', 'no kids', 'no dependents', 'just me', 'single'] },
    ],
    templateInterjections: {
      partner_needs: "What does your partner need from the new city? Their career needs or dealbreakers might be different from yours.",
      family_visits: "How often would you fly back to visit family? That affects both location choice and airport access needs.",
    },
  },
  {
    paragraphId: 18,
    heading: 'Dating & Social Life',
    coverageTargets: [
      { id: 'dating', label: 'Dating scene', keywords: ['dating', 'single', 'relationship', 'meet people', 'tinder', 'apps', 'romance'] },
      { id: 'expat', label: 'Expat community', keywords: ['expat', 'expatriate', 'foreigner', 'international', 'community', 'english-speaking'] },
      { id: 'social_clubs', label: 'Social activities', keywords: ['meetup', 'club', 'group', 'social', 'hobby', 'event', 'volunteer'] },
      { id: 'integration', label: 'Integration with locals', keywords: ['integrate', 'local', 'friends', 'connect', 'fit in', 'outsider', 'belong'] },
    ],
    templateInterjections: {
      expat: "How important is an expat community? Some cities have thousands of English-speaking expats with weekly meetups; others you'll be the only foreigner.",
      integration: "Do you want to integrate with locals or stick with an expat bubble? Both are valid — they just suit different cities.",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Nourishment ═══
  {
    paragraphId: 19,
    heading: 'Food & Cuisine',
    coverageTargets: [
      { id: 'dietary', label: 'Dietary restrictions', keywords: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten', 'allergy', 'lactose', 'celiac'] },
      { id: 'cuisines', label: 'Cuisine preferences', keywords: ['cuisine', 'food', 'restaurant', 'sushi', 'italian', 'thai', 'mexican', 'indian', 'mediterranean'] },
      { id: 'grocery', label: 'Grocery expectations', keywords: ['grocery', 'supermarket', 'market', 'organic', 'farmers market', 'fresh', 'produce'] },
      { id: 'food_budget', label: 'Food budget', keywords: ['budget', 'spend', 'cost', 'expensive', 'cheap', 'monthly', 'per month'] },
    ],
    templateInterjections: {
      dietary: "Do you have dietary restrictions? Vegan in Tokyo is very different from vegan in Berlin — availability varies wildly.",
      food_budget: "What do you expect to spend on food monthly? Costs can be 2-3x different between cities that otherwise seem similar.",
    },
  },
  {
    paragraphId: 20,
    heading: 'Sports & Fitness',
    coverageTargets: [
      { id: 'gym', label: 'Gym access', keywords: ['gym', 'fitness', 'membership', 'weightlifting', 'strength', 'equipment'] },
      { id: 'sports', label: 'Specific sports', keywords: ['tennis', 'padel', 'golf', 'surfing', 'yoga', 'crossfit', 'swimming', 'football', 'climbing'] },
      { id: 'outdoor_fitness', label: 'Outdoor exercise', keywords: ['running', 'jogging', 'cycling', 'hiking', 'outdoor', 'path', 'trail'] },
      { id: 'leagues', label: 'Sports leagues/clubs', keywords: ['league', 'club', 'team', 'play', 'recreational', 'join'] },
      { id: 'not_priority', label: 'Not a priority', keywords: ['not a priority', 'not important', 'don\'t exercise', 'not active'] },
    ],
    templateInterjections: {
      sports: "What specific sports do you do? Not every city has good surfing, padel courts, or climbing gyms.",
      outdoor_fitness: "Do you exercise outdoors? Running paths, cycling lanes — some cities are built for it and others aren't.",
    },
  },
  {
    paragraphId: 21,
    heading: 'Outdoor & Nature',
    coverageTargets: [
      { id: 'landscape', label: 'Landscape preference', keywords: ['mountain', 'beach', 'ocean', 'sea', 'lake', 'river', 'coast', 'hills', 'forest'] },
      { id: 'proximity', label: 'Nature proximity', keywords: ['walk', 'drive', 'minutes', 'within', 'close', 'nearby', 'access', 'daily'] },
      { id: 'water_sports', label: 'Water activities', keywords: ['surf', 'dive', 'snorkel', 'kayak', 'sail', 'swim', 'paddle', 'kite'] },
      { id: 'green_space', label: 'Urban green space', keywords: ['park', 'garden', 'green', 'tree', 'nature', 'botanical'] },
    ],
    templateInterjections: {
      landscape: "Mountains or beaches? Or both? This is often the single biggest lifestyle factor. Some cities let you surf in the morning and ski in the afternoon.",
      proximity: "How close does nature need to be? Walkable daily parks vs. weekend drive to mountains are very different requirements.",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Soul ═══
  {
    paragraphId: 22,
    heading: 'Arts & Culture',
    coverageTargets: [
      { id: 'museums', label: 'Museums/galleries', keywords: ['museum', 'gallery', 'art', 'exhibit', 'collection'] },
      { id: 'music', label: 'Music scene', keywords: ['music', 'concert', 'live', 'jazz', 'classical', 'electronic', 'festival', 'venue'] },
      { id: 'theater', label: 'Theater/performing arts', keywords: ['theater', 'theatre', 'opera', 'ballet', 'dance', 'performance'] },
      { id: 'heritage', label: 'Historic character', keywords: ['history', 'historical', 'heritage', 'ancient', 'architecture', 'old town', 'culture'] },
    ],
    templateInterjections: {
      music: "What kind of music scene do you want? Some cities are world-class for jazz, others for electronic music, others for live indie.",
      heritage: "How important is architectural and historical richness? Old-world charm vs. modern cities are very different vibes.",
    },
  },
  {
    paragraphId: 23,
    heading: 'Entertainment & Nightlife',
    coverageTargets: [
      { id: 'nightlife', label: 'Nightlife style', keywords: ['nightlife', 'bar', 'club', 'pub', 'cocktail', 'party', 'dance', 'late night'] },
      { id: 'festivals', label: 'Festivals/events', keywords: ['festival', 'event', 'carnival', 'concert', 'comedy', 'sporting event'] },
      { id: 'entertainment_budget', label: 'Entertainment budget', keywords: ['budget', 'spend', 'monthly', 'cost', 'afford'] },
      { id: 'hobbies', label: 'Hobbies/activities', keywords: ['hobby', 'gaming', 'cooking class', 'pottery', 'photography', 'reading', 'book'] },
    ],
    templateInterjections: {
      nightlife: "What's your nightlife vibe? Thriving bar scene or quiet evenings? Both are valid — it changes the recommendations.",
      entertainment_budget: "How much do you spend monthly on entertainment? This helps us match cities to your lifestyle expectations.",
    },
  },
  {
    paragraphId: 24,
    heading: 'Spiritual & Religious',
    coverageTargets: [
      { id: 'religion', label: 'Specific religion', keywords: ['christian', 'muslim', 'jewish', 'buddhist', 'hindu', 'catholic', 'church', 'mosque', 'temple'] },
      { id: 'tolerance', label: 'Religious tolerance', keywords: ['tolerance', 'tolerant', 'secular', 'accepting', 'diverse', 'freedom of religion'] },
      { id: 'spiritual', label: 'Spiritual practice', keywords: ['spiritual', 'meditation', 'yoga', 'retreat', 'mindfulness', 'zen', 'community'] },
      { id: 'not_factor', label: 'Not a factor', keywords: ['not religious', 'atheist', 'agnostic', 'secular', 'not a factor', 'doesn\'t matter'] },
    ],
    templateInterjections: {
      tolerance: "Whether religious or not — how important is religious tolerance? Some places are wonderfully diverse; others quite restrictive.",
    },
  },
  {
    paragraphId: 25,
    heading: 'Pets & Animals',
    coverageTargets: [
      { id: 'pet_type', label: 'Pet type and breed', keywords: ['dog', 'cat', 'bird', 'reptile', 'breed', 'puppy', 'kitten', 'pet'] },
      { id: 'pet_housing', label: 'Pet-friendly housing', keywords: ['pet-friendly', 'allow pets', 'no pets', 'deposit', 'landlord', 'apartment'] },
      { id: 'vet', label: 'Veterinary care', keywords: ['vet', 'veterinary', 'animal hospital', 'checkup', 'emergency'] },
      { id: 'import', label: 'Pet import regulations', keywords: ['import', 'quarantine', 'microchip', 'rabies', 'vaccination', 'fly with'] },
      { id: 'no_pets', label: 'No pets', keywords: ['no pets', 'no animals', 'don\'t have', 'no plans'] },
    ],
    templateInterjections: {
      import: "Have you looked into pet import regulations? Some countries require months of quarantine. Start researching early.",
      pet_housing: "Pet-friendly housing can be very hard to find in some cities — it dramatically narrows your options.",
    },
  },

  // ═══ PHASE 6: YOUR VISION ═══
  {
    paragraphId: 26,
    heading: 'Your Dream Day',
    coverageTargets: [
      { id: 'morning', label: 'Morning routine', keywords: ['morning', 'wake', 'coffee', 'breakfast', 'sunrise', 'gym', 'run', 'yoga'] },
      { id: 'afternoon', label: 'Afternoon activities', keywords: ['afternoon', 'lunch', 'work', 'cafe', 'siesta', 'walk', 'explore', 'coworking'] },
      { id: 'evening', label: 'Evening plans', keywords: ['evening', 'dinner', 'sunset', 'restaurant', 'friends', 'nightlife', 'cook'] },
      { id: 'transport_mode', label: 'How you get around', keywords: ['walk', 'drive', 'bike', 'bus', 'metro', 'taxi', 'stroll'] },
      { id: 'weather_feel', label: 'Weather in the scene', keywords: ['sun', 'warm', 'breeze', 'cool', 'weather', 'outdoor', 'terrace'] },
    ],
    templateInterjections: {
      evening: "Love your morning and afternoon! What does the evening look like? This tells us a lot about what you need from a city.",
      transport_mode: "In your dream day, how are you getting around? This confirms what city infrastructure you actually need.",
    },
  },
  {
    paragraphId: 27,
    heading: 'Anything Else',
    coverageTargets: [
      { id: 'dealbreakers', label: 'Missed dealbreakers', keywords: ['dealbreaker', 'never', 'refuse', 'absolutely not', 'can\'t', 'won\'t', 'non-negotiable'] },
      { id: 'niche', label: 'Niche requirements', keywords: ['specific', 'niche', 'unusual', 'rare', 'unique', 'important to me'] },
      { id: 'past_experience', label: 'Past relocation experience', keywords: ['visited', 'lived in', 'tried', 'loved', 'hated', 'experience', 'before'] },
      { id: 'future_plans', label: 'Future plans', keywords: ['plan', 'future', 'start a family', 'retire', 'build', 'business', 'eventually'] },
    ],
    templateInterjections: {
      dealbreakers: "This is your safety net — any dealbreakers you forgot? Even small things can make or break a relocation.",
      past_experience: "Have you visited or lived in any cities you loved or hated? That real experience is incredibly valuable for our matching.",
    },
  },
];

/** Quick lookup by paragraph ID */
export function getTargetsForParagraph(paragraphId: number): ParagraphTargets | undefined {
  return PARAGRAPH_TARGETS.find(t => t.paragraphId === paragraphId);
}

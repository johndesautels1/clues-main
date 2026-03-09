/**
 * Paragraph Coverage Targets
 * Defines what each of the 30 paragraphs should cover.
 * Used by the Olivia Tutor (useOliviaTutor hook) for real-time guidance.
 *
 * Structure matches src/data/paragraphs.ts:
 *   Phase 1: Your Profile (P1-P2)
 *   Phase 2: Do Not Wants (P3)
 *   Phase 3: Must Haves (P4)
 *   Phase 4: Trade-offs (P5)
 *   Phase 5: Module Deep Dives (P6-P28)
 *   Phase 6: Your Vision (P29-P30)
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
  /** Olivia's auto-greeting when user first lands on this paragraph */
  welcomeMessage?: string;
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
      { id: 'partner_details', label: 'Partner details', keywords: ["partner's", "wife's", "husband's", "spouse's", 'my wife', 'my husband', 'my partner', 'filipina', 'her nationality', 'his nationality', 'their age'] },
      { id: 'languages', label: 'Languages spoken', keywords: ['speak', 'language', 'fluent', 'english', 'spanish', 'french', 'german', 'bilingual', 'native', 'learning', 'tagalog', 'mandarin'] },
      { id: 'employment_type', label: 'Employment type', keywords: ['remote', 'freelance', 'business owner', 'retired', 'student', 'self-employed', 'employee', 'contractor', 'entrepreneur'] },
    ],
    welcomeMessage: "Let's start with the basics! Tell me who you are — your age, nationality, household, and how you work. If you have a partner, include their details too.",
    templateInterjections: {
      age: "Your age bracket matters a lot — healthcare, visa options, and even nightlife vary hugely by age. Mind sharing roughly how old you are?",
      nationality: "What passport(s) do you hold? It's the single biggest factor for visa pathways and where you can actually move.",
      household: "Are you moving solo, with a partner, or with family? It changes recommendations dramatically.",
      partner_details: "If you have a partner, tell me about them too — their age, nationality, and languages. Their needs could open or close visa doors.",
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
    welcomeMessage: "Now paint the picture of your life right now — where you live, what you earn, what's pushing you to move, and when you want to make it happen.",
    templateInterjections: {
      income: "What about your monthly income or budget? Even a rough range helps us match cities to your financial reality.",
      timeline: "What's your timeline? Moving next month versus next year changes which visa pathways are realistic.",
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
      { id: 'bureaucracy_dnw', label: 'Bureaucracy dealbreakers', keywords: ['bureaucracy', 'bureaucratic', 'red tape', 'paperwork', 'administrative', 'slow process', 'inefficient'] },
      { id: 'political_dnw', label: 'Political ideology', keywords: ['right wing', 'right-wing', 'fascist', 'far right', 'far-right', 'left', 'center-left', 'progressive', 'conservative', 'nationalist'] },
      { id: 'past_failed', label: 'Places that did not work', keywords: ['tried', 'lived in', 'visited', 'rejected', 'hated', 'did not work', 'not the right fit', 'left because', 'moved from'] },
    ],
    welcomeMessage: "This is your elimination round. What are your absolute dealbreakers — climate, safety, legal, cultural, political, bureaucracy? Anything you write here becomes a hard wall.",
    templateInterjections: {
      climate_dnw: "What climate would be completely unacceptable? Extreme humidity, freezing winters, desert heat?",
      safety_dnw: "Any safety-related dealbreakers? Certain crime levels, political instability, or conflict zones?",
      region_dnw: "Are there specific countries or regions you absolutely refuse to consider?",
      bureaucracy_dnw: "How do you feel about bureaucracy? Some countries are notoriously slow — is that a dealbreaker?",
      past_failed: "Have you tried living somewhere that didn't work out? That experience is incredibly valuable.",
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
    welcomeMessage: "What absolutely must be there? Internet speed, hospital access, visa pathways — these are your non-negotiable requirements.",
    templateInterjections: {
      internet_mh: "What's the minimum internet speed your life requires? If you work remotely, this is a hard filter.",
      medical_mh: "Any medical must-haves? Specific specialists, medications, or hospital standards?",
      visa_mh: "What visa pathway must be available? Not all countries offer digital nomad visas.",
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
      { id: 'bureaucracy_tolerance', label: 'Bureaucracy tolerance', keywords: ['bureaucracy', 'bureaucratic', 'red tape', 'paperwork', 'administrative', 'efficient', 'slow process', 'detest', 'HOA'] },
    ],
    welcomeMessage: "Life is trade-offs. Would you pay more for safety? Accept worse weather for a better social scene? Tell me what you'd sacrifice and what you'd never give up.",
    templateInterjections: {
      cost_vs_quality: "Would you pay significantly more rent for a safer, better-located neighborhood?",
      language_barrier: "How much of a language barrier can you tolerate? Some amazing cities require learning a new language.",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 1: Survival ═══
  {
    paragraphId: 6,
    heading: 'Safety & Security',
    coverageTargets: [
      { id: 'crime', label: 'Crime concerns', keywords: ['crime', 'theft', 'robbery', 'violence', 'murder', 'pickpocket', 'assault', 'safe', 'dangerous'] },
      { id: 'political', label: 'Political stability', keywords: ['political', 'government', 'corrupt', 'stable', 'democracy', 'protest', 'coup', 'conflict'] },
      { id: 'emergency', label: 'Emergency services', keywords: ['police', 'ambulance', 'hospital', 'fire', 'emergency', '911', 'response time'] },
      { id: 'personal_safety', label: 'Personal safety specifics', keywords: ['walk at night', 'solo', 'woman', 'lgbtq', 'minority', 'discrimination', 'harass'] },
      { id: 'gun_laws', label: 'Gun laws', keywords: ['gun', 'guns', 'firearm', 'weapon', 'armed', 'gun-free', 'gun control', 'concealed carry', 'open carry'] },
      { id: 'political_ideology', label: 'Political ideology preference', keywords: ['progressive', 'liberal', 'left', 'center-left', 'conservative', 'right wing', 'moderate', 'social democrat', 'multicultural'] },
      { id: 'neighborhood', label: 'Neighborhood feel', keywords: ['neighborhood', 'street', 'walk', 'night', 'comfortable', 'vibe', 'friendly', 'quiet'] },
    ],
    welcomeMessage: "How safe do you need to feel? Think about crime, political ideology, gun laws, walking at night, and personal safety concerns.",
    templateInterjections: {
      political: "What about political stability? Some cities feel safe day-to-day but have underlying instability.",
      personal_safety: "Any specific personal safety concerns? Walking alone at night, LGBTQ+ friendliness?",
    },
  },
  {
    paragraphId: 7,
    heading: 'Health & Wellness',
    coverageTargets: [
      { id: 'conditions', label: 'Medical conditions', keywords: ['condition', 'chronic', 'diabetes', 'asthma', 'allergy', 'disability', 'mental health', 'anxiety', 'depression', 'thyroid', 'cancer', 'heart'] },
      { id: 'medication', label: 'Medication needs', keywords: ['medication', 'medicine', 'prescription', 'drug', 'pharmacy', 'refill', 'insulin', 'Ozempic', 'GLP-1'] },
      { id: 'specialists', label: 'Specialist access', keywords: ['specialist', 'doctor', 'surgeon', 'therapist', 'psychiatrist', 'dentist', 'cardiologist', 'teaching hospital'] },
      { id: 'partner_health', label: 'Partner/family health needs', keywords: ["wife's", "partner's", "husband's", 'their health', 'their condition', 'both of us'] },
      { id: 'insurance', label: 'Healthcare system/insurance', keywords: ['insurance', 'healthcare', 'public health', 'private', 'cost', 'coverage', 'universal'] },
      { id: 'english_doctors', label: 'English-speaking doctors', keywords: ['english', 'speak english', 'communicate', 'understand', 'english-speaking'] },
      { id: 'wellness', label: 'Wellness infrastructure', keywords: ['wellness', 'spa', 'yoga', 'gym', 'retreat', 'meditation', 'fitness', 'holistic'] },
    ],
    welcomeMessage: "Healthcare can make or break a relocation. Tell me about medical conditions, medications, specialist needs, and wellness priorities.",
    templateInterjections: {
      medication: "Do you take any regular medications? Pharmacy access varies wildly between countries.",
      insurance: "How would you handle health insurance abroad? Some countries have excellent public systems.",
    },
  },
  {
    paragraphId: 8,
    heading: 'Climate & Weather',
    coverageTargets: [
      { id: 'temperature', label: 'Temperature preference', keywords: ['hot', 'cold', 'warm', 'cool', 'degrees', 'celsius', 'fahrenheit', 'temperature', 'heat', 'mild'] },
      { id: 'humidity', label: 'Humidity tolerance', keywords: ['humid', 'humidity', 'dry', 'moisture', 'sticky', 'arid', 'tropical', 'muggy'] },
      { id: 'seasons', label: 'Seasonal preference', keywords: ['seasons', 'winter', 'summer', 'spring', 'autumn', 'year-round', 'seasonal', 'snow', 'four seasons'] },
      { id: 'sunshine', label: 'Sunshine needs', keywords: ['sun', 'sunny', 'sunshine', 'overcast', 'cloudy', 'rain', 'rainy', 'gloomy', 'bright'] },
      { id: 'disasters', label: 'Natural disaster tolerance', keywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'typhoon', 'wildfire', 'disaster', 'storm'] },
      { id: 'air_quality', label: 'Air quality', keywords: ['air quality', 'pollution', 'smog', 'clean air', 'asthma', 'allergies'] },
    ],
    welcomeMessage: "Let's talk weather! Temperature, humidity, seasons, sunshine — be specific for better matching.",
    templateInterjections: {
      humidity: "Are you more of a dry-heat person or do you handle humidity okay? That single factor eliminates about 40% of cities.",
      disasters: "Have you thought about natural disaster risk? Some dream-weather cities sit in earthquake or hurricane zones.",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 2: Foundation ═══
  {
    paragraphId: 9,
    heading: 'Legal & Immigration',
    coverageTargets: [
      { id: 'passport', label: 'Passport', keywords: ['passport', 'citizen', 'dual', 'nationality', 'visa-free', 'eu', 'us', 'uk'] },
      { id: 'visa_type', label: 'Visa interest', keywords: ['visa', 'digital nomad', 'retirement', 'investor', 'work permit', 'golden visa', 'freelance'] },
      { id: 'residency', label: 'Residency pathway', keywords: ['residency', 'permanent', 'citizenship', 'naturalize', 'path', 'timeline', 'temporary'] },
      { id: 'rule_of_law', label: 'Rule of law', keywords: ['rule of law', 'judicial', 'contract', 'enforcement', 'legal system', 'courts', 'corruption'] },
    ],
    welcomeMessage: "Visas and legal pathways are the gatekeepers. What passport do you hold, what visa type interests you?",
    templateInterjections: {
      visa_type: "What type of visa pathway interests you? Digital nomad, retirement, investor?",
      rule_of_law: "How important is rule of law? Contract enforcement and corruption levels vary dramatically.",
    },
  },
  {
    paragraphId: 10,
    heading: 'Financial & Banking',
    coverageTargets: [
      { id: 'income', label: 'Monthly income', keywords: ['income', 'salary', 'earn', 'make', 'revenue', 'pension', 'per month'] },
      { id: 'cost_of_living', label: 'Cost of living tolerance', keywords: ['cost of living', 'afford', 'expenses', 'monthly', 'budget', 'comfortable'] },
      { id: 'taxes', label: 'Tax sensitivity', keywords: ['tax', 'income tax', 'capital gains', 'property tax', 'tax-free', 'low tax', 'effective rate'] },
      { id: 'banking', label: 'Banking needs', keywords: ['bank', 'banking', 'transfer', 'crypto', 'international', 'account', 'currency'] },
    ],
    welcomeMessage: "Money matters! Tell me about your income, cost-of-living expectations, tax sensitivity, and banking needs.",
    templateInterjections: {
      taxes: "Tax structure can make or break a budget. Some countries won't tax your foreign income at all.",
      banking: "How important is banking access for foreigners? Some countries make it very difficult.",
    },
  },
  {
    paragraphId: 11,
    heading: 'Housing & Property Preferences',
    coverageTargets: [
      { id: 'type', label: 'Property type', keywords: ['apartment', 'house', 'villa', 'condo', 'loft', 'studio', 'penthouse', 'flat'] },
      { id: 'size', label: 'Size requirements', keywords: ['bedroom', 'bathroom', 'sqm', 'sqft', 'space', 'big', 'small', 'spacious'] },
      { id: 'rent_buy', label: 'Rent vs buy', keywords: ['rent', 'buy', 'purchase', 'own', 'lease', 'mortgage', 'invest'] },
      { id: 'budget', label: 'Housing budget', keywords: ['budget', 'afford', 'cost', 'price', 'per month', 'rent for', 'spend'] },
      { id: 'neighborhood_char', label: 'Neighborhood character', keywords: ['urban', 'suburban', 'rural', 'quiet', 'lively', 'downtown', 'central', 'walkable'] },
      { id: 'foreign_ownership', label: 'Foreign property ownership', keywords: ['foreign ownership', 'foreigners can buy', 'property rights', 'freehold', 'leasehold'] },
      { id: 'accessibility', label: 'Disability/accessibility', keywords: ['wheelchair', 'accessible', 'disability', 'mobility', 'elevator', 'ramp'] },
      { id: 'sound_quality', label: 'Sound insulation', keywords: ['noise', 'sound', 'soundproof', 'quiet building', 'music', 'neighbors', 'insulation'] },
      { id: 'rental_income', label: 'Short-term rental potential', keywords: ['rent out', 'rental income', 'short-term rental', 'Airbnb', 'investment'] },
      { id: 'natural_light', label: 'Natural light/views', keywords: ['natural light', 'bright', 'light', 'view', 'overlooking', 'riverfront', 'city view'] },
    ],
    welcomeMessage: "Describe your ideal home — apartment or house, budget, neighborhood vibe, foreign ownership needs.",
    templateInterjections: {
      rent_buy: "Renting or buying? Some countries restrict foreign ownership entirely.",
      budget: "What's your housing budget? A range lets us find cities where your dream home is affordable.",
      foreign_ownership: "Can foreigners buy property where you want to live? Some countries restrict this.",
    },
  },
  {
    paragraphId: 12,
    heading: 'Professional & Career',
    coverageTargets: [
      { id: 'work_type', label: 'Work type', keywords: ['remote', 'freelance', 'business', 'startup', 'agency', 'consulting', 'employed'] },
      { id: 'coworking', label: 'Coworking needs', keywords: ['coworking', 'co-working', 'workspace', 'office', 'cafe', 'desk', 'nomad'] },
      { id: 'business_reg', label: 'Business registration', keywords: ['register', 'llc', 'company', 'incorporate', 'business', 'corporate tax', 'license'] },
      { id: 'networking', label: 'Professional networking', keywords: ['network', 'community', 'meetup', 'conference', 'professional', 'ecosystem'] },
      { id: 'existing_business', label: 'Existing businesses', keywords: ['existing business', 'brokerage', 'tech company', 'UK company', 'US company', 'international business', 'already have'] },
      { id: 'ai_tech_scene', label: 'AI/tech ecosystem', keywords: ['AI', 'artificial intelligence', 'tech scene', 'startup ecosystem', 'tech hub', 'innovation'] },
    ],
    welcomeMessage: "How do you work and earn? Tell me about your professional needs, AI/tech ecosystem, and business registration plans.",
    templateInterjections: {
      coworking: "Do you need coworking spaces or good cafe-working culture?",
      business_reg: "Planning to register a business locally? Corporate tax and regulations vary enormously.",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 3: Infrastructure ═══
  {
    paragraphId: 13,
    heading: 'Technology & Connectivity',
    coverageTargets: [
      { id: 'internet_speed', label: 'Internet speed needs', keywords: ['mbps', 'speed', 'fast', 'fiber', 'broadband', 'download', 'upload', 'gigabit'] },
      { id: 'mobile', label: '5G/mobile coverage', keywords: ['5g', '4g', 'mobile', 'cell', 'coverage', 'signal', 'data', 'sim'] },
      { id: 'power_grid', label: 'Power reliability', keywords: ['power', 'outage', 'blackout', 'reliable', 'electric', 'grid', 'backup', 'generator'] },
      { id: 'cloud_services', label: 'Cloud/service access', keywords: ['aws', 'cloud', 'google', 'vpn', 'latency', 'service', 'platform'] },
    ],
    welcomeMessage: "Tech infrastructure is critical. What internet speeds do you need, how important is 5G, and can you tolerate power outages?",
    templateInterjections: {
      internet_speed: "What internet speed do you actually need? Download AND upload?",
      power_grid: "How reliable does the power grid need to be? Some tropical paradises have daily outages.",
    },
  },
  {
    paragraphId: 14,
    heading: 'Transportation & Mobility',
    coverageTargets: [
      { id: 'car', label: 'Car ownership', keywords: ['car', 'drive', 'driving', 'parking', 'vehicle', 'motorcycle', 'scooter'] },
      { id: 'transit', label: 'Public transit', keywords: ['transit', 'bus', 'metro', 'subway', 'train', 'tram', 'public transport'] },
      { id: 'walkability', label: 'Walkability', keywords: ['walk', 'walkable', 'pedestrian', 'foot', 'walkability', 'sidewalk'] },
      { id: 'rail_network', label: 'Rail/train network', keywords: ['train', 'rail', 'high-speed', 'TGV', 'intercity', 'rail network', 'regional travel'] },
      { id: 'airport', label: 'Airport proximity', keywords: ['airport', 'fly', 'flight', 'international', 'travel', 'airline', 'hub', 'direct'] },
      { id: 'flight_routes', label: 'Specific flight routes', keywords: ['direct to', 'flights to', 'nonstop', 'specific destinations'] },
      { id: 'rideshare', label: 'Ride-sharing', keywords: ['uber', 'lyft', 'grab', 'taxi', 'rideshare', 'cab'] },
      { id: 'ebike', label: 'E-bike/cycling', keywords: ['e-bike', 'ebike', 'electric bike', 'cycling', 'bike lane', 'bicycle'] },
    ],
    welcomeMessage: "How do you want to get around? Car, public transit, walking, e-biking? List the specific flight routes you need.",
    templateInterjections: {
      airport: "How often do you travel internationally? Airport proximity matters.",
      car: "Car or car-free? It's a major lifestyle and cost difference.",
    },
  },
  {
    paragraphId: 15,
    heading: 'Education & Learning',
    coverageTargets: [
      { id: 'kids_ed', label: "Children's education", keywords: ['school', 'kids', 'children', 'international school', 'ib', 'curriculum', 'preschool'] },
      { id: 'personal_ed', label: 'Personal education', keywords: ['learn', 'study', 'degree', 'course', 'university', 'certification'] },
      { id: 'language_learning', label: 'Language learning', keywords: ['language', 'spanish', 'french', 'portuguese', 'mandarin', 'immersion', 'class'] },
      { id: 'intellectual_env', label: 'University/intellectual atmosphere', keywords: ['university', 'educated', 'academic', 'intellectual', 'college town', 'research'] },
      { id: 'ai_education', label: 'AI/tech education presence', keywords: ['AI', 'artificial intelligence', 'tech education', 'computer science'] },
      { id: 'no_ed_needs', label: 'No education needs', keywords: ['no kids', 'no children', 'not applicable', 'not a priority'] },
    ],
    welcomeMessage: "Education needs — for you or your children. If none, say so to help weight other priorities.",
    templateInterjections: {
      kids_ed: "Do your kids need schooling? International school quality varies enormously.",
      language_learning: "Interested in learning the local language? Cities with strong language schools make integration easier.",
    },
  },
  {
    paragraphId: 16,
    heading: 'Social Values & Governance',
    coverageTargets: [
      { id: 'speech', label: 'Freedom of speech/press', keywords: ['speech', 'press', 'expression', 'say', 'opinion', 'protest', 'journalism', 'media'] },
      { id: 'substances', label: 'Substance laws', keywords: ['alcohol', 'cannabis', 'marijuana', 'weed', 'drug', 'legal', 'decriminalized'] },
      { id: 'internet_freedom', label: 'Internet freedom', keywords: ['internet', 'censorship', 'vpn', 'blocked', 'surveillance', 'privacy', 'firewall'] },
      { id: 'governance', label: 'Government quality', keywords: ['government', 'transparency', 'civic', 'democratic', 'corruption', 'bureaucracy'] },
      { id: 'tolerance', label: 'Social tolerance', keywords: ['tolerant', 'multicultural', 'diverse', 'accepting', 'inclusive', 'progressive'] },
      { id: 'lifestyle', label: 'Lifestyle freedom', keywords: ['lifestyle', 'gambling', 'alternative', 'freedom', 'choice', 'autonomy', 'liberty'] },
    ],
    welcomeMessage: "Freedom looks different everywhere. Tell me about your expectations for speech, governance, tolerance, and personal liberty.",
    templateInterjections: {
      substances: "How do you feel about substance laws? Cannabis legality and alcohol availability vary wildly.",
      internet_freedom: "How important is unrestricted internet? Some countries block VPNs, social media, or news sites.",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 4: Lifestyle ═══
  {
    paragraphId: 17,
    heading: 'Food & Dining',
    coverageTargets: [
      { id: 'dietary', label: 'Dietary restrictions', keywords: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten', 'allergy', 'lactose', 'celiac'] },
      { id: 'cuisines', label: 'Cuisine preferences', keywords: ['cuisine', 'food', 'restaurant', 'sushi', 'italian', 'thai', 'mexican', 'indian', 'mediterranean'] },
      { id: 'grocery', label: 'Grocery expectations', keywords: ['grocery', 'supermarket', 'market', 'organic', 'farmers market', 'fresh', 'produce'] },
      { id: 'food_budget', label: 'Food budget', keywords: ['budget', 'spend', 'cost', 'expensive', 'cheap', 'monthly', 'per month'] },
    ],
    welcomeMessage: "Food is culture! Tell me about dietary needs, favorite cuisines, grocery expectations, and food budget.",
    templateInterjections: {
      dietary: "Do you have dietary restrictions? Vegan in Tokyo is very different from vegan in Berlin.",
      food_budget: "What do you expect to spend on food monthly? Costs can be 2-3x different between similar cities.",
    },
  },
  {
    paragraphId: 18,
    heading: 'Shopping & Services',
    coverageTargets: [
      { id: 'online_shopping', label: 'Online shopping/delivery', keywords: ['amazon', 'delivery', 'online', 'order', 'ship', 'package', 'prime'] },
      { id: 'international_brands', label: 'International brands', keywords: ['brand', 'international', 'imported', 'specific product', 'hard to find'] },
      { id: 'personal_services', label: 'Personal services', keywords: ['barber', 'salon', 'dry clean', 'laundry', 'tailor', 'repair'] },
      { id: 'retail_style', label: 'Retail preference', keywords: ['mall', 'boutique', 'market', 'local shop', 'convenience', 'superstore'] },
    ],
    welcomeMessage: "Shopping and daily services — online delivery, international brands, personal care services. What do you depend on?",
    templateInterjections: {
      online_shopping: "How important is fast online delivery? Amazon Prime equivalent isn't available everywhere.",
      international_brands: "Do you depend on specific international brands or products that might be hard to find abroad?",
    },
  },
  {
    paragraphId: 19,
    heading: 'Outdoor & Recreation',
    coverageTargets: [
      { id: 'landscape', label: 'Landscape preference', keywords: ['mountain', 'beach', 'ocean', 'sea', 'lake', 'river', 'coast', 'hills', 'forest'] },
      { id: 'proximity', label: 'Nature proximity', keywords: ['walk', 'drive', 'minutes', 'within', 'close', 'nearby', 'access', 'daily'] },
      { id: 'water_sports', label: 'Water activities', keywords: ['surf', 'dive', 'snorkel', 'kayak', 'sail', 'swim', 'paddle', 'kite'] },
      { id: 'green_space', label: 'Urban green space', keywords: ['park', 'garden', 'green', 'tree', 'nature', 'botanical'] },
      { id: 'fitness', label: 'Sports & fitness', keywords: ['gym', 'tennis', 'padel', 'yoga', 'crossfit', 'swimming', 'running', 'cycling', 'climbing'] },
    ],
    welcomeMessage: "Mountains, beaches, forests, or all three? How close does nature need to be? Tell me about sports and fitness too.",
    templateInterjections: {
      landscape: "Mountains or beaches? Or both? This is often the single biggest lifestyle factor.",
      proximity: "How close does nature need to be? Walkable daily parks vs. weekend drives are very different.",
    },
  },
  {
    paragraphId: 20,
    heading: 'Entertainment & Nightlife',
    coverageTargets: [
      { id: 'nightlife', label: 'Nightlife style', keywords: ['nightlife', 'bar', 'club', 'pub', 'cocktail', 'party', 'dance', 'late night'] },
      { id: 'festivals', label: 'Festivals/events', keywords: ['festival', 'event', 'carnival', 'concert', 'comedy', 'sporting event'] },
      { id: 'entertainment_budget', label: 'Entertainment budget', keywords: ['budget', 'spend', 'monthly', 'cost', 'afford'] },
      { id: 'hobbies', label: 'Hobbies/activities', keywords: ['hobby', 'gaming', 'cooking class', 'pottery', 'photography', 'reading', 'book'] },
    ],
    welcomeMessage: "Fun matters! Tell me about nightlife style, festivals, entertainment budget, and hobbies.",
    templateInterjections: {
      nightlife: "What's your nightlife vibe? Thriving bar scene or quiet evenings?",
      entertainment_budget: "How much do you spend monthly on entertainment?",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 5: Connection ═══
  {
    paragraphId: 21,
    heading: 'Family & Children',
    coverageTargets: [
      { id: 'who_comes', label: 'Who is relocating', keywords: ['partner', 'wife', 'husband', 'spouse', 'kids', 'children', 'parents', 'alone', 'solo', 'family'] },
      { id: 'partner_needs', label: "Partner's needs", keywords: ['partner', 'spouse', 'their job', 'their career', 'they need', 'they want'] },
      { id: 'kids_ages', label: "Children's ages/needs", keywords: ['baby', 'toddler', 'teenager', 'teen', 'school age', 'years old', 'daycare'] },
      { id: 'family_visits', label: 'Visiting family back home', keywords: ['visit', 'family', 'parents', 'fly back', 'home', 'times a year'] },
      { id: 'eldercare', label: 'Elderly parent care/visits', keywords: ['elderly', 'parent', 'mother', 'father', 'wheelchair', 'stroke', 'aging', 'care', 'disability'] },
      { id: 'solo', label: 'Solo/no dependents', keywords: ['solo', 'alone', 'no kids', 'no dependents', 'just me', 'single'] },
    ],
    welcomeMessage: "Who's coming with you? Tell me about everyone's needs, elderly parents, and how often you'd visit family.",
    templateInterjections: {
      partner_needs: "What does your partner need from the new city?",
      family_visits: "How often would you fly back to visit family?",
    },
  },
  {
    paragraphId: 22,
    heading: 'Neighborhood & Urban Design',
    coverageTargets: [
      { id: 'walkability', label: 'Walkability', keywords: ['walkable', 'pedestrian', 'sidewalk', 'walk to', 'on foot', 'car-free'] },
      { id: 'density', label: 'Urban density preference', keywords: ['urban', 'suburban', 'rural', 'dense', 'spread out', 'downtown', 'village'] },
      { id: 'public_spaces', label: 'Public spaces', keywords: ['plaza', 'square', 'park', 'bench', 'fountain', 'public space', 'gathering'] },
      { id: 'neighborhood_vibe', label: 'Neighborhood vibe', keywords: ['bohemian', 'artsy', 'upscale', 'family', 'trendy', 'quiet', 'lively', 'character'] },
      { id: 'noise', label: 'Noise levels', keywords: ['noise', 'quiet', 'loud', 'traffic noise', 'peaceful', 'sleep', 'construction'] },
      { id: 'community', label: 'Community feeling', keywords: ['community', 'neighbors', 'local shop', 'regular faces', 'belonging', 'friendly'] },
    ],
    welcomeMessage: "What should your neighborhood feel like? Walkability, density, public spaces, vibe, noise — paint the picture.",
    templateInterjections: {
      density: "Dense urban core, leafy suburb, or small-town feel? This shapes your entire daily experience.",
      neighborhood_vibe: "What neighborhood vibe are you looking for — bohemian, upscale, family-oriented, artsy?",
    },
  },
  {
    paragraphId: 23,
    heading: 'Environment & Community Appearance',
    coverageTargets: [
      { id: 'cleanliness', label: 'Street cleanliness', keywords: ['clean', 'dirty', 'trash', 'litter', 'garbage', 'tidy', 'maintained'] },
      { id: 'green_space', label: 'Green space / trees', keywords: ['trees', 'green', 'park', 'garden', 'nature', 'canopy', 'vegetation'] },
      { id: 'air_quality', label: 'Air quality', keywords: ['air quality', 'pollution', 'smog', 'clean air', 'breathing'] },
      { id: 'sustainability', label: 'Environmental sustainability', keywords: ['recycle', 'sustainability', 'renewable', 'solar', 'green initiative', 'eco'] },
      { id: 'aesthetics', label: 'Visual aesthetics', keywords: ['beautiful', 'ugly', 'architecture', 'maintained', 'run-down', 'graffiti', 'aesthetic'] },
    ],
    welcomeMessage: "How important is visual and environmental quality? Cleanliness, green space, air quality, sustainability?",
    templateInterjections: {
      cleanliness: "How important are clean streets to you? Some beautiful cities have serious litter problems.",
      sustainability: "Does environmental sustainability factor in? Recycling, green energy, eco-initiatives?",
    },
  },

  // ═══ PHASE 5: MODULE DEEP DIVES — Tier 6: Identity ═══
  {
    paragraphId: 24,
    heading: 'Religion & Spirituality',
    coverageTargets: [
      { id: 'religion', label: 'Specific religion', keywords: ['christian', 'muslim', 'jewish', 'buddhist', 'hindu', 'catholic', 'church', 'mosque', 'temple'] },
      { id: 'tolerance', label: 'Religious tolerance', keywords: ['tolerance', 'tolerant', 'secular', 'accepting', 'diverse', 'freedom of religion'] },
      { id: 'spiritual', label: 'Spiritual practice', keywords: ['spiritual', 'meditation', 'yoga', 'retreat', 'mindfulness', 'zen', 'community'] },
      { id: 'not_factor', label: 'Not a factor', keywords: ['not religious', 'atheist', 'agnostic', 'secular', 'not a factor'] },
    ],
    welcomeMessage: "Spiritual life — or the freedom from it. All answers are equally valid.",
    templateInterjections: {
      tolerance: "Whether religious or not — how important is religious tolerance?",
    },
  },
  {
    paragraphId: 25,
    heading: 'Sexual Beliefs, Practices & Laws',
    coverageTargets: [
      { id: 'lgbtq', label: 'LGBTQ+ rights', keywords: ['lgbtq', 'gay', 'lesbian', 'trans', 'queer', 'same-sex', 'marriage equality', 'pride'] },
      { id: 'legal_protections', label: 'Legal protections', keywords: ['anti-discrimination', 'protection', 'legal', 'law', 'rights', 'criminal'] },
      { id: 'dating_culture', label: 'Dating culture', keywords: ['dating', 'relationship', 'cohabitation', 'open', 'conservative', 'progressive'] },
      { id: 'reproductive', label: 'Reproductive healthcare', keywords: ['reproductive', 'abortion', 'contraception', 'family planning', 'healthcare'] },
      { id: 'not_factor', label: 'Not a factor', keywords: ['not a factor', 'not relevant', 'straight', 'not a concern'] },
    ],
    welcomeMessage: "Sexual freedom and legal protections vary enormously. Tell me what matters to you — or if this isn't a factor.",
    templateInterjections: {
      lgbtq: "LGBTQ+ rights range from full equality to criminal penalties. Where do your needs fall?",
      legal_protections: "Do you need specific anti-discrimination legal protections in your destination?",
    },
  },
  {
    paragraphId: 26,
    heading: 'Arts & Culture',
    coverageTargets: [
      { id: 'museums', label: 'Museums/galleries', keywords: ['museum', 'gallery', 'art', 'exhibit', 'collection'] },
      { id: 'music', label: 'Music scene', keywords: ['music', 'concert', 'live', 'jazz', 'classical', 'electronic', 'festival', 'venue'] },
      { id: 'theater', label: 'Theater/performing arts', keywords: ['theater', 'theatre', 'opera', 'ballet', 'dance', 'performance'] },
      { id: 'heritage', label: 'Historic character', keywords: ['history', 'historical', 'heritage', 'ancient', 'architecture', 'old town', 'culture'] },
    ],
    welcomeMessage: "Feed your soul! Museums, live music, theater, historic architecture — what cultural experiences do you need?",
    templateInterjections: {
      music: "What kind of music scene do you want?",
      heritage: "How important is architectural and historical richness?",
    },
  },
  {
    paragraphId: 27,
    heading: 'Cultural Heritage & Traditions',
    coverageTargets: [
      { id: 'local_customs', label: 'Local customs/traditions', keywords: ['tradition', 'custom', 'festival', 'holiday', 'celebration', 'local culture'] },
      { id: 'integration', label: 'Integration expectations', keywords: ['integrate', 'local', 'belong', 'fit in', 'outsider', 'accepted', 'foreigner'] },
      { id: 'expat_vs_local', label: 'Expat vs local community', keywords: ['expat', 'expatriate', 'foreigner', 'international', 'local community', 'bubble'] },
      { id: 'language_culture', label: 'Language & cultural barriers', keywords: ['language', 'barrier', 'cultural', 'understand', 'different', 'adjust'] },
      { id: 'diaspora', label: 'Cultural/ethnic community', keywords: ['Asian', 'Filipino', 'Latino', 'African', 'diaspora', 'ethnic community', 'cultural affinity'] },
    ],
    welcomeMessage: "How important is connecting with local culture? Do you want to deeply integrate or maintain your own identity?",
    templateInterjections: {
      integration: "Do you want to integrate with locals or stick with an expat community? Both are valid.",
      diaspora: "Is having a specific cultural or ethnic community nearby important to you?",
    },
  },
  {
    paragraphId: 28,
    heading: 'Pets & Animals',
    coverageTargets: [
      { id: 'pet_type', label: 'Pet type and breed', keywords: ['dog', 'cat', 'bird', 'reptile', 'breed', 'puppy', 'kitten', 'pet'] },
      { id: 'pet_housing', label: 'Pet-friendly housing', keywords: ['pet-friendly', 'allow pets', 'no pets', 'deposit', 'landlord', 'apartment'] },
      { id: 'vet', label: 'Veterinary care', keywords: ['vet', 'veterinary', 'animal hospital', 'checkup', 'emergency'] },
      { id: 'import', label: 'Pet import regulations', keywords: ['import', 'quarantine', 'microchip', 'rabies', 'vaccination', 'fly with'] },
      { id: 'no_pets', label: 'No pets', keywords: ['no pets', 'no animals', "don't have", 'no plans'] },
    ],
    welcomeMessage: "Furry family members! Tell me about your pets — or if no pets, just say so.",
    templateInterjections: {
      import: "Have you looked into pet import regulations? Some countries require months of quarantine.",
      pet_housing: "Pet-friendly housing can be very hard to find — it dramatically narrows options.",
    },
  },

  // ═══ PHASE 6: YOUR VISION ═══
  {
    paragraphId: 29,
    heading: 'Your Dream Day',
    coverageTargets: [
      { id: 'morning', label: 'Morning routine', keywords: ['morning', 'wake', 'coffee', 'breakfast', 'sunrise', 'gym', 'run', 'yoga'] },
      { id: 'afternoon', label: 'Afternoon activities', keywords: ['afternoon', 'lunch', 'work', 'cafe', 'siesta', 'walk', 'explore', 'coworking'] },
      { id: 'evening', label: 'Evening plans', keywords: ['evening', 'dinner', 'sunset', 'restaurant', 'friends', 'nightlife', 'cook'] },
      { id: 'transport_mode', label: 'How you get around', keywords: ['walk', 'drive', 'bike', 'bus', 'metro', 'taxi', 'stroll'] },
      { id: 'weather_feel', label: 'Weather in the scene', keywords: ['sun', 'warm', 'breeze', 'cool', 'weather', 'outdoor', 'terrace'] },
    ],
    welcomeMessage: "Close your eyes and imagine your perfect day in your new city. Walk me through morning to night.",
    templateInterjections: {
      evening: "What does the evening look like? This tells us a lot about what you need from a city.",
      transport_mode: "In your dream day, how are you getting around? This confirms what city infrastructure you need.",
    },
  },
  {
    paragraphId: 30,
    heading: 'Anything Else',
    coverageTargets: [
      { id: 'dealbreakers', label: 'Missed dealbreakers', keywords: ['dealbreaker', 'never', 'refuse', 'absolutely not', "can't", "won't", 'non-negotiable'] },
      { id: 'niche', label: 'Niche requirements', keywords: ['specific', 'niche', 'unusual', 'rare', 'unique', 'important to me'] },
      { id: 'past_experience', label: 'Past relocation experience', keywords: ['visited', 'lived in', 'tried', 'loved', 'hated', 'experience', 'before'] },
      { id: 'future_plans', label: 'Future plans', keywords: ['plan', 'future', 'start a family', 'retire', 'build', 'business', 'eventually'] },
    ],
    welcomeMessage: "Last chance! Missed dealbreakers, niche requirements, past experience, future plans — this is your safety net.",
    templateInterjections: {
      dealbreakers: "Any dealbreakers you forgot? Even small things can make or break a relocation.",
      past_experience: "Have you visited or lived in cities you loved or hated? That experience is incredibly valuable.",
    },
  },
];

/** Quick lookup by paragraph ID */
export function getTargetsForParagraph(paragraphId: number): ParagraphTargets | undefined {
  return PARAGRAPH_TARGETS.find(t => t.paragraphId === paragraphId);
}

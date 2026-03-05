/**
 * Paragraph Coverage Targets
 * Defines what each of the 24 paragraphs should cover.
 * Used by the Olivia Tutor (useOliviaTutor hook) for real-time guidance.
 *
 * Each paragraph has:
 * - coverageTargets: the key topics Gemini needs to extract from
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
  // ─── OPENING ────────────────────────────────────────────────
  {
    paragraphId: 1,
    heading: 'Who You Are',
    coverageTargets: [
      { id: 'age', label: 'Age bracket', keywords: ['age', 'years old', 'born in', 'turning', 'mid-', 'early ', 'late ', '20s', '30s', '40s', '50s', '60s', '70s'] },
      { id: 'nationality', label: 'Nationality/passport', keywords: ['passport', 'citizen', 'nationality', 'born in', 'from', 'american', 'british', 'canadian', 'australian', 'european'] },
      { id: 'household', label: 'Household composition', keywords: ['single', 'married', 'partner', 'wife', 'husband', 'kids', 'children', 'family', 'alone', 'couple', 'solo', 'daughter', 'son'] },
      { id: 'languages', label: 'Languages spoken', keywords: ['speak', 'language', 'fluent', 'english', 'spanish', 'french', 'german', 'bilingual', 'native', 'learning'] },
      { id: 'identity', label: 'Cultural identity', keywords: ['culture', 'heritage', 'background', 'identity', 'roots', 'tradition', 'community', 'ethnic', 'religion'] },
    ],
    templateInterjections: {
      age: "Great start! One thing that helps us a lot: your age bracket. Healthcare, nightlife, and even visa options vary hugely by age — mind sharing roughly how old you are?",
      nationality: "Love the detail! What passport(s) do you hold? It's one of the biggest factors for visa pathways and where you can actually move to.",
      household: "Nice picture of who you are! Are you moving solo, with a partner, or with family? It changes the recommendations dramatically.",
      languages: "This is helpful! What languages do you speak? It affects how easily you'll integrate and which cities are realistic for you.",
    },
  },
  {
    paragraphId: 2,
    heading: 'Your Life Right Now',
    coverageTargets: [
      { id: 'current_location', label: 'Current city/country', keywords: ['live in', 'living in', 'based in', 'currently in', 'hometown', 'home city', 'my city'] },
      { id: 'push_factors', label: 'Push factors (what\'s wrong)', keywords: ['hate', 'tired of', 'frustrated', 'can\'t stand', 'sick of', 'problem', 'issue', 'expensive', 'crime', 'traffic', 'weather', 'boring', 'leaving because', 'escape'] },
      { id: 'pull_factors', label: 'Pull factors (what you seek)', keywords: ['dream', 'want', 'looking for', 'seeking', 'hope', 'wish', 'ideal', 'better', 'freedom', 'adventure', 'quality of life', 'opportunity'] },
      { id: 'timeline', label: 'Timeline urgency', keywords: ['soon', 'asap', 'next year', 'months', 'ready', 'planning', 'years', 'timeline', 'when', 'urgent', 'no rush', 'flexible', 'retire'] },
    ],
    templateInterjections: {
      current_location: "Good context! Where are you living right now? Knowing your current city helps us measure what you'd gain (or trade off) by moving.",
      push_factors: "You're painting a nice picture of what you want — but what are you trying to get away from? The things that bother you about your current situation are just as important for finding the right city.",
      timeline: "Quick thought — what's your timeline? Moving next month versus next year changes which visa pathways and cities are realistic.",
    },
  },

  // ─── SURVIVAL & FOUNDATION ──────────────────────────────────
  {
    paragraphId: 3,
    heading: 'Your Ideal Climate',
    coverageTargets: [
      { id: 'temperature', label: 'Temperature preference', keywords: ['hot', 'cold', 'warm', 'cool', 'degrees', 'celsius', 'fahrenheit', 'temperature', 'heat', 'freezing', 'mild', 'temperate'] },
      { id: 'humidity', label: 'Humidity tolerance', keywords: ['humid', 'humidity', 'dry', 'moisture', 'sticky', 'arid', 'tropical', 'desert', 'muggy', 'sweat'] },
      { id: 'seasons', label: 'Seasonal preference', keywords: ['seasons', 'winter', 'summer', 'spring', 'autumn', 'fall', 'year-round', 'seasonal', 'snow', 'four seasons', 'eternal'] },
      { id: 'disasters', label: 'Natural disaster tolerance', keywords: ['earthquake', 'hurricane', 'tornado', 'flood', 'typhoon', 'wildfire', 'tsunami', 'volcano', 'disaster', 'storm'] },
      { id: 'sunshine', label: 'Sunshine importance', keywords: ['sun', 'sunny', 'sunshine', 'overcast', 'gray', 'grey', 'cloudy', 'rain', 'rainy', 'gloomy', 'bright'] },
      { id: 'air_quality', label: 'Air quality', keywords: ['air quality', 'pollution', 'smog', 'clean air', 'asthma', 'allergies', 'breathing', 'haze'] },
    ],
    templateInterjections: {
      humidity: "Love how specific you are about temperature! Quick thought — are you more of a dry-heat person or do you handle humidity okay? That single factor eliminates about 40% of cities.",
      disasters: "Great detail on the climate vibe! Have you thought about natural disaster risk? Some dream-weather cities sit in earthquake or hurricane zones.",
      air_quality: "Nice climate vision! How sensitive are you to air quality? Some beautiful warm cities have serious smog issues that affect daily life.",
    },
  },
  {
    paragraphId: 4,
    heading: 'Safety & Peace of Mind',
    coverageTargets: [
      { id: 'crime', label: 'Crime concerns', keywords: ['crime', 'theft', 'robbery', 'violence', 'murder', 'pickpocket', 'scam', 'steal', 'assault', 'gang', 'cartel', 'safe', 'dangerous'] },
      { id: 'political', label: 'Political stability', keywords: ['political', 'government', 'corrupt', 'stable', 'democracy', 'dictatorship', 'protest', 'coup', 'war', 'conflict', 'instability'] },
      { id: 'emergency', label: 'Emergency services', keywords: ['police', 'ambulance', 'hospital', 'fire', 'emergency', '911', 'response time', 'first responder'] },
      { id: 'personal_safety', label: 'Personal safety specifics', keywords: ['walk at night', 'solo', 'woman', 'women', 'lgbtq', 'gay', 'trans', 'minority', 'race', 'discrimination', 'harass'] },
      { id: 'neighborhood', label: 'Neighborhood feel', keywords: ['neighborhood', 'street', 'walk', 'night', 'comfortable', 'vibe', 'friendly', 'quiet', 'peaceful'] },
    ],
    templateInterjections: {
      political: "Good safety awareness! What about political stability? Some cities feel safe day-to-day but have underlying political instability that affects long-term planning.",
      personal_safety: "Solid safety priorities! Any specific personal safety concerns? Things like walking alone at night, LGBTQ+ friendliness, or being a visible minority vary enormously between cities.",
      emergency: "Have you thought about emergency services quality? Response times and hospital access matter a lot — especially if you're far from home.",
    },
  },
  {
    paragraphId: 5,
    heading: 'Your Health & Wellness',
    coverageTargets: [
      { id: 'conditions', label: 'Medical conditions', keywords: ['condition', 'chronic', 'diabetes', 'asthma', 'allergy', 'disability', 'disorder', 'disease', 'mental health', 'anxiety', 'depression', 'adhd'] },
      { id: 'medication', label: 'Medication needs', keywords: ['medication', 'medicine', 'prescription', 'drug', 'pharmacy', 'refill', 'pill', 'treatment', 'blood thinner', 'insulin'] },
      { id: 'specialists', label: 'Specialist access', keywords: ['specialist', 'doctor', 'surgeon', 'therapist', 'psychiatrist', 'dentist', 'dermatologist', 'cardiologist', 'oncologist'] },
      { id: 'insurance', label: 'Healthcare system/insurance', keywords: ['insurance', 'healthcare', 'public health', 'private', 'nhs', 'cost', 'coverage', 'affordable', 'universal'] },
      { id: 'hospital', label: 'Hospital quality', keywords: ['hospital', 'clinic', 'accredited', 'jci', 'international', 'quality', 'modern', 'facility'] },
      { id: 'wellness', label: 'Wellness & prevention', keywords: ['wellness', 'yoga', 'meditation', 'spa', 'holistic', 'alternative', 'prevention', 'fitness', 'mental'] },
    ],
    templateInterjections: {
      medication: "Great that you're thinking about health! Just in case — do you take any regular medications? Pharmacy access varies wildly between countries, and some medications that are over-the-counter at home need prescriptions abroad.",
      specialists: "Good health overview! Do you see any specialists regularly? Access to specific medical specialists is one of the most overlooked relocation factors.",
      insurance: "Have you thought about how you'd handle health insurance abroad? Some countries have excellent public systems, others require expensive private coverage.",
    },
  },
  {
    paragraphId: 6,
    heading: 'Your Dream Home',
    coverageTargets: [
      { id: 'type', label: 'Property type', keywords: ['apartment', 'house', 'villa', 'condo', 'loft', 'studio', 'penthouse', 'flat', 'townhouse', 'cottage'] },
      { id: 'size', label: 'Size requirements', keywords: ['bedroom', 'bathroom', 'sqm', 'sqft', 'square', 'space', 'room', 'big', 'small', 'spacious', 'cozy'] },
      { id: 'rent_buy', label: 'Rent vs buy', keywords: ['rent', 'buy', 'purchase', 'own', 'lease', 'mortgage', 'invest', 'property'] },
      { id: 'budget', label: 'Housing budget', keywords: ['budget', 'afford', 'cost', 'price', 'expensive', 'cheap', 'per month', 'rent for', 'spend'] },
      { id: 'neighborhood_char', label: 'Neighborhood character', keywords: ['urban', 'suburban', 'rural', 'quiet', 'lively', 'vibrant', 'residential', 'downtown', 'central', 'outskirts'] },
      { id: 'amenities', label: 'Home amenities', keywords: ['garden', 'pool', 'parking', 'elevator', 'balcony', 'terrace', 'view', 'gym', 'doorman', 'security'] },
    ],
    templateInterjections: {
      rent_buy: "Great home vision! Are you thinking of renting or buying? It's a huge factor — some countries restrict foreign ownership entirely.",
      budget: "Love the detail on your dream home! What's your housing budget? Knowing a number (even a rough range) lets us find cities where your dream home is actually affordable.",
      neighborhood_char: "What kind of neighborhood vibe are you going for? Urban buzz with cafes on every corner, or quiet residential streets? This changes which areas within a city we recommend.",
    },
  },

  // ─── LEGAL & FINANCIAL ──────────────────────────────────────
  {
    paragraphId: 7,
    heading: 'Your Legal Reality',
    coverageTargets: [
      { id: 'passport', label: 'Passport strength', keywords: ['passport', 'citizen', 'dual', 'nationality', 'visa-free', 'travel', 'eu', 'us', 'uk'] },
      { id: 'visa_type', label: 'Visa interest', keywords: ['visa', 'digital nomad', 'retirement', 'investor', 'work permit', 'residency', 'golden visa', 'freelance', 'student'] },
      { id: 'residency', label: 'Residency pathway', keywords: ['residency', 'permanent', 'citizenship', 'naturalize', 'path', 'timeline', 'years', 'temporary'] },
      { id: 'bureaucracy', label: 'Bureaucracy tolerance', keywords: ['bureaucracy', 'paperwork', 'process', 'complicated', 'easy', 'straightforward', 'red tape', 'waiting', 'appointment'] },
      { id: 'tax_treaty', label: 'Tax awareness', keywords: ['tax', 'double taxation', 'treaty', 'tax-free', 'income tax', 'capital gains'] },
    ],
    templateInterjections: {
      visa_type: "Good legal picture! What type of visa pathway interests you? Digital nomad visa, retirement visa, investor visa — each opens different countries.",
      bureaucracy: "How much bureaucracy can you handle? Some countries make residency straightforward; others involve months of paperwork and appointments.",
      tax_treaty: "Quick thought on taxes — does your home country have tax treaties with your target destinations? This can mean the difference between paying taxes once or twice.",
    },
  },
  {
    paragraphId: 8,
    heading: 'Your Financial Picture',
    coverageTargets: [
      { id: 'income', label: 'Monthly income', keywords: ['income', 'salary', 'earn', 'make', 'revenue', 'pension', 'savings', 'per month', 'annually', 'per year'] },
      { id: 'budget', label: 'Monthly budget', keywords: ['budget', 'spend', 'cost of living', 'afford', 'expenses', 'monthly', 'allowance'] },
      { id: 'income_source', label: 'Income source type', keywords: ['remote', 'freelance', 'business', 'investment', 'pension', 'rental', 'passive', 'employed', 'self-employed', 'retired'] },
      { id: 'taxes', label: 'Tax sensitivity', keywords: ['tax', 'income tax', 'capital gains', 'property tax', 'tax-free', 'low tax', 'tax haven', 'territorial'] },
      { id: 'banking', label: 'Banking needs', keywords: ['bank', 'banking', 'transfer', 'crypto', 'international', 'account', 'currency', 'exchange', 'wise', 'swift'] },
      { id: 'cost_specifics', label: 'Specific cost expectations', keywords: ['rent', 'groceries', 'food', 'transport', 'healthcare', 'utilities', 'internet', 'dining'] },
    ],
    templateInterjections: {
      taxes: "Good picture of your income! One thing that can make or break a relocation budget: taxes. Some countries won't tax your foreign income at all, others take 30%+. Any thoughts on your tax tolerance?",
      income_source: "How do you earn your income? Remote work, local employment, investments, pension? It affects both visa options and which cities make financial sense.",
      cost_specifics: "You've got the big picture — can you get more specific? What do you expect to spend on rent, food, and transport monthly? Even ballpark numbers help us match cities to your budget.",
    },
  },
  {
    paragraphId: 9,
    heading: 'Freedom & Autonomy',
    coverageTargets: [
      { id: 'personal_freedom', label: 'Personal freedoms', keywords: ['freedom', 'liberty', 'speech', 'press', 'expression', 'religion', 'belief', 'lifestyle', 'choice'] },
      { id: 'substances', label: 'Substance laws', keywords: ['alcohol', 'cannabis', 'marijuana', 'weed', 'drug', 'legal', 'decriminalized', 'dry', 'prohibited'] },
      { id: 'lgbtq', label: 'LGBTQ+ rights', keywords: ['lgbtq', 'gay', 'lesbian', 'trans', 'queer', 'same-sex', 'marriage equality', 'pride', 'acceptance'] },
      { id: 'internet', label: 'Internet freedom', keywords: ['internet', 'censorship', 'vpn', 'blocked', 'surveillance', 'privacy', 'firewall', 'free internet'] },
      { id: 'business_freedom', label: 'Business freedom', keywords: ['business', 'startup', 'regulation', 'license', 'incorporation', 'ease of doing', 'entrepreneurship'] },
    ],
    templateInterjections: {
      substances: "Interesting take on freedom! How do you feel about substance laws? Alcohol availability, cannabis legality — these vary wildly and some people don't realize until they arrive.",
      internet: "Good freedom priorities! How important is unrestricted internet? Some countries block VPNs, social media, or news sites. If you work online, this is critical.",
    },
  },

  // ─── LIVELIHOOD & GROWTH ────────────────────────────────────
  {
    paragraphId: 10,
    heading: 'Your Work & Career',
    coverageTargets: [
      { id: 'work_type', label: 'Remote vs local', keywords: ['remote', 'local', 'office', 'hybrid', 'work from home', 'on-site', 'commute', 'freelance', 'contract'] },
      { id: 'industry', label: 'Industry/sector', keywords: ['tech', 'finance', 'creative', 'healthcare', 'education', 'consulting', 'engineering', 'design', 'marketing', 'legal', 'real estate'] },
      { id: 'coworking', label: 'Coworking needs', keywords: ['coworking', 'co-working', 'workspace', 'office', 'cafe', 'wifi', 'desk', 'nomad'] },
      { id: 'timezone', label: 'Time zone compatibility', keywords: ['timezone', 'time zone', 'hours', 'overlap', 'client', 'team', 'meeting', 'schedule', 'gmt', 'utc', 'est', 'pst'] },
      { id: 'networking', label: 'Professional community', keywords: ['network', 'community', 'meetup', 'conference', 'professional', 'industry', 'ecosystem', 'startup'] },
    ],
    templateInterjections: {
      timezone: "Great work picture! What time zones do your clients or team work in? A 12-hour time zone gap means meetings at midnight — it's a dealbreaker for many remote workers.",
      coworking: "Do you need coworking spaces or a good cafe-working culture? Some cities have incredible nomad infrastructure; others have nothing.",
      industry: "What industry are you in? Certain cities have strong ecosystems for tech, finance, or creative work — it affects networking, opportunities, and even visa options.",
    },
  },
  {
    paragraphId: 11,
    heading: 'Staying Connected',
    coverageTargets: [
      { id: 'internet_speed', label: 'Internet speed needs', keywords: ['mbps', 'speed', 'fast', 'slow', 'fiber', 'broadband', 'bandwidth', 'download', 'upload', 'lag', 'gigabit'] },
      { id: 'mobile', label: '5G/mobile coverage', keywords: ['5g', '4g', 'mobile', 'cell', 'coverage', 'signal', 'data', 'sim', 'carrier'] },
      { id: 'infrastructure', label: 'Digital infrastructure', keywords: ['infrastructure', 'power', 'outage', 'blackout', 'reliable', 'electric', 'grid', 'backup'] },
      { id: 'remote_work', label: 'Remote work setup', keywords: ['remote', 'work from home', 'video call', 'zoom', 'teams', 'slack', 'vpn', 'upload speed'] },
    ],
    templateInterjections: {
      internet_speed: "What internet speed do you actually need? If you do video calls or upload large files, you need 50+ Mbps minimum. Some cities that look great on paper have terrible internet.",
      infrastructure: "How reliable does the power grid need to be? Some tropical paradises have daily outages. If you work remotely, that's a serious issue.",
    },
  },
  {
    paragraphId: 12,
    heading: 'Getting Around',
    coverageTargets: [
      { id: 'car', label: 'Car ownership', keywords: ['car', 'drive', 'driving', 'own a car', 'license', 'parking', 'vehicle', 'motorcycle', 'scooter'] },
      { id: 'transit', label: 'Public transit', keywords: ['transit', 'bus', 'metro', 'subway', 'train', 'tram', 'public transport', 'commute'] },
      { id: 'walkability', label: 'Walkability', keywords: ['walk', 'walkable', 'pedestrian', 'foot', 'stroll', 'walkability', 'sidewalk'] },
      { id: 'bike', label: 'Bike infrastructure', keywords: ['bike', 'bicycle', 'cycling', 'bike lane', 'cycle', 'e-bike', 'scooter'] },
      { id: 'airport', label: 'Airport proximity', keywords: ['airport', 'fly', 'flight', 'international', 'travel', 'plane', 'airline', 'hub'] },
      { id: 'rideshare', label: 'Ride-sharing', keywords: ['uber', 'lyft', 'grab', 'taxi', 'rideshare', 'ride', 'cab'] },
    ],
    templateInterjections: {
      airport: "Love the walkable vision! How often do you travel internationally? Airport proximity matters a lot for some people — a beautiful walkable city that's 3 hours from an airport changes the equation.",
      car: "Are you planning to own a car or go car-free? It's a major lifestyle and cost difference. Some cities are impossible without one; others make cars unnecessary.",
    },
  },
  {
    paragraphId: 13,
    heading: 'Learning & Growth',
    coverageTargets: [
      { id: 'personal_ed', label: 'Personal education goals', keywords: ['learn', 'study', 'degree', 'course', 'skill', 'language', 'university', 'mba', 'certification'] },
      { id: 'kids_ed', label: 'Children\'s education', keywords: ['school', 'kids', 'children', 'international school', 'ib', 'curriculum', 'preschool', 'kindergarten', 'tutor'] },
      { id: 'language_learning', label: 'Language learning', keywords: ['language', 'learn', 'spanish', 'french', 'portuguese', 'mandarin', 'immersion', 'class', 'tutor'] },
      { id: 'professional', label: 'Professional development', keywords: ['conference', 'workshop', 'networking', 'professional', 'development', 'career', 'growth', 'training'] },
    ],
    templateInterjections: {
      kids_ed: "Do you have kids who need schooling? International school quality and availability varies enormously — and costs can range from free to $30,000/year.",
      language_learning: "Are you interested in learning the local language? Cities with strong language school infrastructure make integration much easier.",
    },
  },

  // ─── PEOPLE & RELATIONSHIPS ─────────────────────────────────
  {
    paragraphId: 14,
    heading: 'Your Family',
    coverageTargets: [
      { id: 'who_comes', label: 'Who is relocating', keywords: ['partner', 'wife', 'husband', 'spouse', 'kids', 'children', 'parents', 'alone', 'solo', 'family', 'together'] },
      { id: 'partner_needs', label: 'Partner\'s needs', keywords: ['partner', 'spouse', 'wife', 'husband', 'their job', 'their career', 'they need', 'they want'] },
      { id: 'kids_ages', label: 'Children\'s ages/needs', keywords: ['baby', 'toddler', 'teenager', 'teen', 'young', 'school age', 'years old', 'daycare', 'nursery'] },
      { id: 'family_activities', label: 'Family activities', keywords: ['family', 'playground', 'park', 'activities', 'kid-friendly', 'family-friendly', 'fun', 'weekend'] },
      { id: 'elderly', label: 'Elderly care', keywords: ['parents', 'elderly', 'aging', 'care', 'retirement', 'assisted', 'grandparent', 'medical care'] },
    ],
    templateInterjections: {
      partner_needs: "You mentioned your partner — what do they need from the new city? Their career needs, social preferences, or dealbreakers might be different from yours.",
      kids_ages: "How old are your kids? A toddler's needs (daycare, playgrounds) are completely different from a teenager's (schools, social scene, safety).",
      elderly: "Are any parents or elderly family members coming or will you need to visit them frequently? That affects both location choice and airport access needs.",
    },
  },
  {
    paragraphId: 15,
    heading: 'Your Social World',
    coverageTargets: [
      { id: 'expat', label: 'Expat community', keywords: ['expat', 'expatriate', 'foreigner', 'international', 'community', 'english-speaking', 'immigrant'] },
      { id: 'dating', label: 'Dating scene', keywords: ['dating', 'single', 'relationship', 'meet people', 'tinder', 'apps', 'romance', 'partner'] },
      { id: 'social_clubs', label: 'Social activities', keywords: ['meetup', 'club', 'group', 'social', 'hobby', 'sport', 'volunteer', 'event'] },
      { id: 'cultural_openness', label: 'Cultural openness', keywords: ['open', 'welcoming', 'tolerant', 'friendly', 'accepting', 'diverse', 'multicultural', 'racism', 'xenophobia'] },
      { id: 'integration', label: 'Integration ease', keywords: ['integrate', 'belong', 'local', 'friends', 'connect', 'community', 'fit in', 'outsider', 'lonely'] },
    ],
    templateInterjections: {
      expat: "Great social picture! How important is an existing expat community? Some cities have thousands of English-speaking expats with weekly meetups; others you'll be the only foreigner in town.",
      cultural_openness: "How welcoming does the culture need to be toward foreigners? Some places are incredibly open; others can be quite closed to outsiders.",
    },
  },
  {
    paragraphId: 16,
    heading: 'Your Animals',
    coverageTargets: [
      { id: 'pet_type', label: 'Pet type and breed', keywords: ['dog', 'cat', 'bird', 'reptile', 'fish', 'breed', 'puppy', 'kitten', 'pet', 'animal'] },
      { id: 'housing', label: 'Pet-friendly housing', keywords: ['pet-friendly', 'allow pets', 'no pets', 'deposit', 'landlord', 'apartment', 'rental'] },
      { id: 'vet', label: 'Veterinary care', keywords: ['vet', 'veterinary', 'animal hospital', 'checkup', 'emergency', 'vaccination'] },
      { id: 'import', label: 'Pet import regulations', keywords: ['import', 'quarantine', 'microchip', 'rabies', 'vaccination', 'certificate', 'documentation', 'fly with'] },
      { id: 'parks', label: 'Pet-friendly spaces', keywords: ['park', 'off-leash', 'dog park', 'walk', 'trail', 'outdoor', 'beach'] },
      { id: 'breed_laws', label: 'Breed-specific laws', keywords: ['ban', 'banned', 'restricted', 'breed', 'pit bull', 'rottweiler', 'legislation', 'bsl'] },
    ],
    templateInterjections: {
      pet_type: "A fellow pet person! What breed? It matters more than you'd think — some countries ban specific breeds, and size affects housing options and airline transport rules.",
      import: "Have you looked into pet import regulations? Some countries require months of quarantine. Others need specific vaccinations done 6+ months in advance. Start early on this one.",
      housing: "How easy is it to find pet-friendly housing where you want to go? In some cities, landlords almost never allow pets — it dramatically narrows your options.",
    },
  },

  // ─── NOURISHMENT & LIFESTYLE ────────────────────────────────
  {
    paragraphId: 17,
    heading: 'Food & Dining',
    coverageTargets: [
      { id: 'dietary', label: 'Dietary restrictions', keywords: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten', 'allergy', 'lactose', 'celiac', 'dairy-free', 'nut-free', 'paleo', 'keto'] },
      { id: 'cuisines', label: 'Cuisine preferences', keywords: ['cuisine', 'food', 'restaurant', 'sushi', 'italian', 'thai', 'mexican', 'indian', 'chinese', 'korean', 'mediterranean'] },
      { id: 'grocery_budget', label: 'Grocery expectations', keywords: ['grocery', 'supermarket', 'market', 'organic', 'farmers market', 'fresh', 'produce', 'cost', 'budget'] },
      { id: 'dining_culture', label: 'Restaurant culture', keywords: ['dining', 'eating out', 'restaurant', 'cafe', 'coffee', 'brunch', 'fine dining', 'street food', 'food scene'] },
      { id: 'delivery', label: 'Food delivery', keywords: ['delivery', 'uber eats', 'takeout', 'take-away', 'order', 'app'] },
    ],
    templateInterjections: {
      dietary: "Love the food enthusiasm! Do you have any dietary restrictions? Vegan in Tokyo is very different from vegan in Berlin — availability varies wildly.",
      grocery_budget: "What do you expect to spend on groceries monthly? Food costs can be 2-3x different between cities that otherwise seem similar.",
    },
  },
  {
    paragraphId: 18,
    heading: 'Fitness & Activity',
    coverageTargets: [
      { id: 'gym', label: 'Gym access', keywords: ['gym', 'fitness', 'membership', 'weightlifting', 'strength', 'treadmill', 'equipment'] },
      { id: 'sports', label: 'Specific sports', keywords: ['tennis', 'golf', 'surfing', 'yoga', 'crossfit', 'martial arts', 'swimming', 'basketball', 'football', 'soccer', 'boxing', 'climbing'] },
      { id: 'outdoor_fitness', label: 'Outdoor exercise', keywords: ['running', 'jogging', 'cycling', 'hiking', 'outdoor', 'path', 'trail', 'beach', 'park'] },
      { id: 'wellness', label: 'Wellness/spa', keywords: ['spa', 'wellness', 'sauna', 'massage', 'retreat', 'pilates', 'meditation', 'recovery'] },
      { id: 'leagues', label: 'Sports leagues/clubs', keywords: ['league', 'club', 'team', 'play', 'competition', 'join', 'group', 'recreational'] },
    ],
    templateInterjections: {
      sports: "What specific activities or sports do you do? Not every city has good surfing, climbing gyms, or tennis courts — knowing your specific activities helps a lot.",
      outdoor_fitness: "Do you exercise outdoors? Running paths, cycling lanes, and beachside fitness — some cities are built for it and others aren't.",
    },
  },
  {
    paragraphId: 19,
    heading: 'Nature & Outdoors',
    coverageTargets: [
      { id: 'landscape', label: 'Mountain vs beach', keywords: ['mountain', 'beach', 'ocean', 'sea', 'lake', 'river', 'coast', 'hills', 'forest', 'desert', 'island'] },
      { id: 'hiking', label: 'Hiking/trails', keywords: ['hike', 'hiking', 'trail', 'trek', 'walk', 'path', 'backpack', 'nature walk'] },
      { id: 'water_sports', label: 'Water activities', keywords: ['surf', 'dive', 'diving', 'snorkel', 'kayak', 'sail', 'sailing', 'swim', 'paddle', 'kite'] },
      { id: 'green_space', label: 'Urban green space', keywords: ['park', 'garden', 'green', 'tree', 'nature', 'botanical', 'reserve', 'wildlife'] },
      { id: 'national_parks', label: 'National parks/reserves', keywords: ['national park', 'reserve', 'wilderness', 'wildlife', 'safari', 'conservation', 'protected'] },
    ],
    templateInterjections: {
      landscape: "Mountains or beaches? Or both? This is often the single biggest lifestyle factor people care about. Some cities let you surf in the morning and ski in the afternoon.",
      water_sports: "Do you do any water sports? Surfing, diving, sailing — not every coastal city has the right conditions.",
    },
  },

  // ─── SOUL & MEANING ─────────────────────────────────────────
  {
    paragraphId: 20,
    heading: 'Arts & Culture',
    coverageTargets: [
      { id: 'museums', label: 'Museums/galleries', keywords: ['museum', 'gallery', 'art', 'exhibit', 'exhibition', 'collection'] },
      { id: 'music', label: 'Music scene', keywords: ['music', 'concert', 'live', 'jazz', 'classical', 'electronic', 'band', 'festival', 'venue'] },
      { id: 'theater', label: 'Theater/performing arts', keywords: ['theater', 'theatre', 'opera', 'ballet', 'dance', 'performance', 'show', 'play'] },
      { id: 'heritage', label: 'Historical richness', keywords: ['history', 'historical', 'heritage', 'ancient', 'architecture', 'old town', 'culture', 'tradition'] },
      { id: 'creative', label: 'Creative community', keywords: ['creative', 'artist', 'writer', 'filmmaker', 'photographer', 'designer', 'scene', 'community'] },
    ],
    templateInterjections: {
      music: "What kind of music scene do you want? Some cities are world-class for jazz, others for electronic music, others for live indie — it varies enormously.",
      heritage: "How important is historical and architectural richness? Some people need that old-world European charm; others prefer modern, purpose-built cities.",
    },
  },
  {
    paragraphId: 21,
    heading: 'Fun & Entertainment',
    coverageTargets: [
      { id: 'nightlife', label: 'Nightlife style', keywords: ['nightlife', 'bar', 'club', 'pub', 'lounge', 'cocktail', 'party', 'dance', 'dj', 'late night'] },
      { id: 'festivals', label: 'Festivals/events', keywords: ['festival', 'event', 'carnival', 'parade', 'celebration', 'annual', 'cultural'] },
      { id: 'cinema', label: 'Cinema/theater', keywords: ['cinema', 'movie', 'film', 'theater', 'screen', 'imax', 'english'] },
      { id: 'hobbies', label: 'Hobbies/activities', keywords: ['hobby', 'board game', 'gaming', 'esports', 'cooking class', 'pottery', 'photography', 'reading', 'book'] },
      { id: 'weekend', label: 'Weekend activities', keywords: ['weekend', 'saturday', 'sunday', 'brunch', 'market', 'explore', 'day trip', 'adventure'] },
    ],
    templateInterjections: {
      nightlife: "What's your nightlife vibe? Some people need a thriving bar and club scene; others specifically want a quiet city with early evenings. Both are valid — it just changes the recommendations.",
      hobbies: "Any specific hobbies or interests? Niche activities like board gaming cafes, pottery studios, or photography clubs aren't available everywhere.",
    },
  },
  {
    paragraphId: 22,
    heading: 'Faith & Spirituality',
    coverageTargets: [
      { id: 'religion', label: 'Specific religion', keywords: ['christian', 'muslim', 'jewish', 'buddhist', 'hindu', 'sikh', 'catholic', 'protestant', 'orthodox', 'church', 'mosque', 'temple', 'synagogue'] },
      { id: 'worship', label: 'Place of worship', keywords: ['church', 'mosque', 'temple', 'synagogue', 'chapel', 'worship', 'pray', 'service', 'mass', 'friday prayer'] },
      { id: 'tolerance', label: 'Religious tolerance', keywords: ['tolerance', 'tolerant', 'interfaith', 'secular', 'accepting', 'diverse', 'freedom of religion', 'respectful'] },
      { id: 'spiritual', label: 'Spiritual community', keywords: ['spiritual', 'meditation', 'yoga', 'retreat', 'mindfulness', 'ashram', 'zen', 'community', 'sangha'] },
      { id: 'secular', label: 'Secular preference', keywords: ['atheist', 'agnostic', 'secular', 'non-religious', 'not religious', 'don\'t practice', 'no religion'] },
    ],
    templateInterjections: {
      tolerance: "Whether you're religious or not — how important is religious tolerance in your new city? Some places are wonderfully diverse; others can be quite restrictive.",
      worship: "Do you need regular access to a specific place of worship? In some cities, your denomination might be everywhere; in others, the nearest one could be hours away.",
    },
  },

  // ─── CLOSING ────────────────────────────────────────────────
  {
    paragraphId: 23,
    heading: 'Your Dream Day',
    coverageTargets: [
      { id: 'morning', label: 'Morning routine', keywords: ['morning', 'wake', 'coffee', 'breakfast', 'sunrise', 'gym', 'run', 'yoga', 'start'] },
      { id: 'afternoon', label: 'Afternoon activities', keywords: ['afternoon', 'lunch', 'work', 'cafe', 'siesta', 'walk', 'explore', 'meeting', 'coworking'] },
      { id: 'evening', label: 'Evening plans', keywords: ['evening', 'dinner', 'sunset', 'restaurant', 'friends', 'family', 'nightlife', 'movie', 'walk', 'cook'] },
      { id: 'transport_mode', label: 'How you get around', keywords: ['walk', 'drive', 'bike', 'bus', 'metro', 'taxi', 'ride', 'stroll'] },
      { id: 'weather_feel', label: 'Weather in the scene', keywords: ['sun', 'warm', 'breeze', 'cool', 'rain', 'weather', 'temperature', 'outdoor', 'terrace'] },
    ],
    templateInterjections: {
      evening: "Love your morning and afternoon! What does the evening look like? Dinner at home, dining out, nightlife, a sunset walk? This tells us a lot about what you need from a city.",
      transport_mode: "In your dream day, how are you getting around? Walking everywhere, driving, biking? This confirms what kind of city infrastructure you actually need.",
    },
  },
  {
    paragraphId: 24,
    heading: 'Anything Else',
    coverageTargets: [
      { id: 'dealbreakers', label: 'Absolute dealbreakers', keywords: ['dealbreaker', 'never', 'refuse', 'absolutely not', 'can\'t', 'won\'t', 'non-negotiable', 'must not'] },
      { id: 'niche', label: 'Niche requirements', keywords: ['specific', 'niche', 'unusual', 'rare', 'unique', 'particular', 'important to me'] },
      { id: 'emotional', label: 'Emotional needs', keywords: ['feel', 'emotion', 'happy', 'safe', 'home', 'belong', 'peace', 'anxiety', 'stress', 'calm', 'excited'] },
      { id: 'partner_separate', label: 'Partner\'s separate needs', keywords: ['partner', 'spouse', 'wife', 'husband', 'they', 'their', 'we differ', 'compromise'] },
    ],
    templateInterjections: {
      dealbreakers: "This is your safety net — anything you've been thinking about that didn't fit neatly into the other sections? Dealbreakers you forgot to mention? Things your partner cares about that are different from your priorities? Even small things can matter.",
      niche: "Any niche or unusual requirements? A specific hobby, a rare medical need, a cultural community? The weird stuff is often what makes or breaks a relocation.",
    },
  },
];

/** Quick lookup by paragraph ID */
export function getTargetsForParagraph(paragraphId: number): ParagraphTargets | undefined {
  return PARAGRAPH_TARGETS.find(t => t.paragraphId === paragraphId);
}

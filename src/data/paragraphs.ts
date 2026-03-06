/**
 * 27 Paragraph Definitions
 *
 * Follows the CLUES decision pipeline:
 *   Phase 1: Your Profile (Demographics)        — P1-P2
 *   Phase 2: Do Not Wants (Dealbreakers)         — P3
 *   Phase 3: Must Haves (Non-Negotiables)        — P4
 *   Phase 4: Trade-offs                          — P5
 *   Phase 5: Module Deep Dives (20 paragraphs)   — P6-P25
 *   Phase 6: Your Vision                         — P26-P27
 *
 * Phase 5 maps 1:1 to the 20 modules in Human Existence Flow order
 * (Survival -> Soul). Each paragraph is the narrative equivalent of
 * that module's multiple-choice questionnaire — users answer in
 * their own writing style instead of Likerts/true-false/rank.
 *
 * This ordering ensures Gemini receives data in the same logical
 * sequence the evaluation pipeline expects: demographics first,
 * then hard walls (DNW), then requirements (MH), then flexibility
 * (trade-offs), then rich module-specific detail, then vision.
 */

export interface ParagraphDef {
  id: number;
  heading: string;
  section: string;
  prompt: string;
  placeholder: string;
  /** Which module this paragraph maps to (Phase 5 only) */
  moduleId?: string;
}

export const PARAGRAPH_DEFS: ParagraphDef[] = [
  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: YOUR PROFILE (Demographics)
  // Hard data Gemini needs for metric filtering and personalization
  // ═══════════════════════════════════════════════════════════════
  {
    id: 1,
    heading: 'Who You Are',
    section: 'Your Profile',
    prompt:
      'Tell us about yourself. Include your age, gender, nationality, and citizenship(s). ' +
      'Are you single, married, partnered? If you have a partner, include their age, nationality, ' +
      'citizenship(s), and languages they speak. Do you have children — how many and what ages? ' +
      'What languages do you speak? What is your employment type — remote worker, business owner, ' +
      'retired, student? This is the foundation Gemini uses to filter every recommendation.',
    placeholder:
      "I'm a 34-year-old American, single, no kids. I speak English and basic Spanish. " +
      "I work remotely as a software engineer. I hold a US passport only...",
  },
  {
    id: 2,
    heading: 'Your Life Right Now',
    section: 'Your Profile',
    prompt:
      'Where do you currently live and what is your monthly income or budget in your currency? ' +
      'What is pushing you to consider relocating — cost of living, quality of life, safety, ' +
      'career, relationships, climate, politics? How soon do you want to move — are we talking ' +
      'months or years? Be specific about numbers where you can.',
    placeholder:
      "I live in Austin, Texas. I earn about $8,000/month after taxes. I'm thinking about " +
      "moving within the next 6-12 months. The main push is cost of living and heat...",
  },

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: DO NOT WANTS (Dealbreakers)
  // Hard walls that eliminate cities before scoring begins
  // ═══════════════════════════════════════════════════════════════
  {
    id: 3,
    heading: 'Your Dealbreakers',
    section: 'Do Not Wants',
    prompt:
      'What would make a place absolutely unacceptable to you? Think about: climate extremes ' +
      'you cannot tolerate, crime levels, political instability or ideology (right-wing, authoritarian), ' +
      'lack of healthcare, internet too slow for your work, no visa pathway, religious or cultural ' +
      'intolerance, excessive bureaucracy, specific countries or regions you refuse to consider, ' +
      'languages you cannot function in. Have you tried living somewhere that did not work out? Tell us what failed. ' +
      'These are HARD walls — if a city hits any of these, it is eliminated regardless of score.',
    placeholder:
      "I absolutely cannot live somewhere with humidity above 80%. I refuse to consider " +
      "any country without a path to legal residency. I won't live where violent crime is...",
  },

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: MUST HAVES (Non-Negotiables)
  // Requirements that a city MUST meet to stay in consideration
  // ═══════════════════════════════════════════════════════════════
  {
    id: 4,
    heading: 'Your Non-Negotiables',
    section: 'Must Haves',
    prompt:
      'What must your new home absolutely have? Think about: minimum internet speed for your work, ' +
      'specific medical facilities or specialists you need access to, airport within X hours, ' +
      'English widely spoken, specific visa type available, minimum safety rating, type of housing ' +
      'that must exist, proximity to family, specific legal rights you require. ' +
      'Unlike dealbreakers (what you reject), these are what you REQUIRE to be present.',
    placeholder:
      "I must have at least 100 Mbps internet — my job depends on it. I need an international " +
      "airport within 2 hours. English needs to be widely spoken. I require access to...",
  },

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: TRADE-OFFS
  // What the user would sacrifice — reveals priority weighting
  // ═══════════════════════════════════════════════════════════════
  {
    id: 5,
    heading: 'Your Trade-offs',
    section: 'Trade-offs',
    prompt:
      'No place is perfect. What are you willing to sacrifice to get what matters most? ' +
      'Would you pay more rent for better safety? Accept slower internet for beach access? ' +
      'Live farther from an airport for lower cost of living? Give up nightlife for nature? ' +
      'Accept language barriers for better weather? Tolerate bureaucracy for tax advantages? ' +
      'How important is low bureaucracy vs. other benefits? ' +
      'This tells us how to WEIGHT your priorities when cities score differently on different metrics.',
    placeholder:
      "I'd happily pay 20% more rent for a safer neighborhood. I could sacrifice nightlife " +
      "entirely if the nature and outdoor access is great. I'd tolerate learning a new language...",
  },

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: MODULE DEEP DIVES (20 paragraphs)
  // One per module, Human Existence Flow order (Survival -> Soul)
  // Each paragraph IS the narrative version of that module's questionnaire
  // ═══════════════════════════════════════════════════════════════

  // --- SURVIVAL ---
  {
    id: 6,
    heading: 'Climate & Weather',
    section: 'Survival',
    moduleId: 'climate_weather',
    prompt:
      'Describe your ideal climate in detail. What temperature range do you want in summer and winter? ' +
      'How do you feel about humidity, rain, snow, wind? Do you need four seasons or prefer year-round ' +
      'warmth? How important is sunshine — how many cloudy days can you tolerate? ' +
      'Do natural disasters (earthquakes, hurricanes, flooding) factor into your thinking? ' +
      'What climate are you escaping from and what specifically bothers you about it?',
    placeholder:
      "I want winter temps around 15-22C and summers no higher than 32C. I hate humidity — " +
      "anything above 65% makes me miserable. I need at least 250 sunny days per year...",
  },
  {
    id: 7,
    heading: 'Safety & Security',
    section: 'Survival',
    moduleId: 'safety_security',
    prompt:
      'What does feeling safe mean to you specifically? Think about: violent crime rates, ' +
      'property crime, political stability and ideology (progressive, moderate, conservative), ' +
      'corruption levels, police reliability, gun laws and gun culture, ' +
      'neighborhood safety for walking at night, safety for women/LGBTQ+/minorities, ' +
      'emergency services quality (ambulance response times, fire services). ' +
      'What is your current safety situation and how does it compare to what you want?',
    placeholder:
      "I want to feel safe walking alone at night. Low violent crime is critical — I'd want " +
      "a city with rates below the US average. Political stability matters more to me than...",
  },
  {
    id: 8,
    heading: 'Healthcare & Medical',
    section: 'Survival',
    moduleId: 'healthcare',
    prompt:
      'Describe your health needs and medical priorities — for you AND your partner/family. ' +
      'Do you have chronic conditions, take regular medications (name them), need specialist access ' +
      '(cardiologist, therapist, dentist)? Does your partner have separate medical needs? ' +
      'How important is public vs. private healthcare? What about health insurance availability ' +
      'and cost for expats? Do you need English-speaking doctors? Mental health services? ' +
      'Pharmacy access for specific medications (Ozempic, insulin, etc.)? ' +
      'Do you need world-class teaching hospitals or multidisciplinary medical centers?',
    placeholder:
      "I take daily medication for blood pressure — I need reliable pharmacy access. " +
      "I see a therapist monthly so mental health services in English are important. " +
      "I'd prefer a country with affordable private health insurance...",
  },
  {
    id: 9,
    heading: 'Housing & Real Estate',
    section: 'Survival',
    moduleId: 'housing',
    prompt:
      'What does your ideal home look like and what can you afford? Apartment, house, villa? ' +
      'How many bedrooms and bathrooms? Urban high-rise, suburban house, rural property? ' +
      'What is your monthly rent budget or purchase budget? Do you want to rent or buy? ' +
      'Can foreigners legally buy property — is that important to you? Furnished or unfurnished? ' +
      'Do you need wheelchair/disability accessibility in the building? ' +
      'Sound insulation for music or work calls? Natural light requirements? Views? ' +
      'Would you want to rent out the property short-term when traveling? ' +
      'Gated community, walkable neighborhood, near the beach, near a city center?',
    placeholder:
      "I want a modern 2-bedroom apartment in a walkable neighborhood. My rent budget is " +
      "$1,500-2,000/month. I'd prefer to rent for the first year then possibly buy. " +
      "I need reliable hot water, AC, and a decent kitchen...",
  },

  // --- FOUNDATION ---
  {
    id: 10,
    heading: 'Legal & Immigration',
    section: 'Foundation',
    moduleId: 'legal_immigration',
    prompt:
      'What is your passport and visa situation? Which visa pathways interest you — digital nomad visa, ' +
      'freelancer visa, investor visa, retirement visa, employment visa? How long do you want to stay — ' +
      'short-term (3-6 months), long-term residency, permanent residency, eventual citizenship? ' +
      'How important is rule of law, judicial independence, and contract enforcement? ' +
      'Any legal concerns about property ownership, business registration, or tax treaties?',
    placeholder:
      "I have a US passport. I'm looking for a digital nomad visa initially, with a path to " +
      "permanent residency within 3-5 years. I want a country with strong rule of law...",
  },
  {
    id: 11,
    heading: 'Financial & Banking',
    section: 'Foundation',
    moduleId: 'financial',
    prompt:
      'Break down your financial picture. What is your monthly income and in what currency? ' +
      'What monthly cost of living would feel comfortable vs. stretched? How important are: ' +
      'tax optimization (income tax, capital gains, wealth tax), banking access for foreigners, ' +
      'ability to receive international transfers, cryptocurrency friendliness, ' +
      'cost of groceries/dining/transport relative to your income? ' +
      'Do you have savings, investments, or rental income to factor in?',
    placeholder:
      "I earn EUR 6,500/month from remote work. I'd like my total cost of living under " +
      "EUR 3,000/month including rent. Tax structure matters — I want to keep my effective " +
      "rate under 25%. I need easy international banking...",
  },
  {
    id: 12,
    heading: 'Legal Independence & Freedom',
    section: 'Foundation',
    moduleId: 'lifescore',
    prompt:
      'What personal freedoms matter most to you? Think about: freedom of speech and press, ' +
      'LGBTQ+ rights, cannabis/alcohol laws, gun rights, religious freedom, privacy laws, ' +
      'government surveillance, internet censorship, protest rights, lifestyle choices ' +
      '(gambling, adult entertainment, alternative lifestyles). ' +
      'Are there freedoms you currently enjoy that you are NOT willing to give up? ' +
      'Are there restrictions in your current country you want to escape?',
    placeholder:
      "Freedom of speech is non-negotiable for me. I want to live somewhere with legal " +
      "cannabis. LGBTQ+ rights matter even though I'm straight — I want a tolerant society. " +
      "I don't want government censoring the internet...",
  },

  // --- GROWTH ---
  {
    id: 13,
    heading: 'Business & Entrepreneurship',
    section: 'Growth',
    moduleId: 'business',
    prompt:
      'What is your professional situation and ambition? Are you a remote employee, freelancer, ' +
      'business owner, or looking to start something new? Do you already have businesses registered ' +
      'in other countries? How important is the local startup ecosystem, coworking spaces, ' +
      'networking events, access to talent, and the local AI/tech scene? ' +
      'Do you need to register a business locally? How important are business-friendly regulations, ' +
      'low corporate tax, ease of hiring, and intellectual property protection?',
    placeholder:
      "I'm a freelance designer who may start an agency. I need good coworking spaces and " +
      "a community of other remote workers. Ideally I'd register an LLC locally with low " +
      "corporate tax. Networking events and startup meetups would be a big plus...",
  },
  {
    id: 14,
    heading: 'Technology & Connectivity',
    section: 'Growth',
    moduleId: 'technology',
    prompt:
      'How critical is tech infrastructure to your daily life and work? What minimum internet speed ' +
      'do you need (download AND upload)? How important is fiber availability, 5G coverage, ' +
      'reliable power grid (no blackouts)? Do you need access to specific tech services ' +
      '(AWS, Google Cloud, VPN-friendly)? Coworking with high-speed connections? ' +
      'How important is the local tech/digital nomad scene?',
    placeholder:
      "I need minimum 200 Mbps download and 50 Mbps upload for my video calls and file " +
      "transfers. Power outages would be a disaster — I need a reliable grid. 5G coverage " +
      "matters for mobile work. I use AWS and need low-latency connections...",
  },
  {
    id: 15,
    heading: 'Transportation & Mobility',
    section: 'Growth',
    moduleId: 'transportation',
    prompt:
      'How do you want to get around daily? Walk, bike, e-bike, public transit, car, scooter, rideshare? ' +
      'How important is walkability score? Do you plan to own a car — how important are road quality, ' +
      'traffic, parking, and gas prices? How critical is public transit quality and coverage? ' +
      'How important is a high-speed rail network for regional travel and exploring? ' +
      'How far can you be from an international airport? List specific destinations you need ' +
      'direct flights to (family, clients, favorite countries). Which flight routes are essential?',
    placeholder:
      "I want to walk or bike for daily errands. I don't want to need a car. Good public " +
      "transit is important. I need an international airport within 1 hour with direct " +
      "flights to New York and London. Rideshare apps should be reliable...",
  },
  {
    id: 16,
    heading: 'Education & Learning',
    section: 'Growth',
    moduleId: 'education',
    prompt:
      'What are your education needs — for yourself or your family? Do children need international ' +
      'schools, specific curricula (IB, American, British), or local language immersion? ' +
      'Are you pursuing continuing education, certifications, or university courses? ' +
      'How important is living near a university or in an intellectually stimulating environment ' +
      'with well-educated residents? Is the local AI/tech education scene important? ' +
      'How important is access to libraries, language schools, professional development? ' +
      'If you have no education needs, say so — this helps Gemini weight other priorities higher.',
    placeholder:
      "My kids (ages 8 and 11) need an international school with an IB curriculum in English. " +
      "I'd like to take language classes myself. Access to a good library system would be nice...",
  },

  // --- CONNECTION ---
  {
    id: 17,
    heading: 'Family & Children',
    section: 'Connection',
    moduleId: 'family',
    prompt:
      'Who is relocating with you? Partner, children, elderly parents, extended family? ' +
      'What does each family member need? Think about: childcare and daycare quality, ' +
      'playgrounds and parks, family-friendly neighborhoods, eldercare facilities, ' +
      'disability and wheelchair accessibility for visiting family, activities for teens, ' +
      'partner employment opportunities. Do you have elderly parents who may visit or need care? ' +
      'How important is proximity to family back home — how often would you fly back? ' +
      'If you are solo with no dependents, say so clearly.',
    placeholder:
      "It's just me and my partner — no kids, no plans for kids. My parents are in " +
      "Florida and I'd want to visit 2-3 times a year, so flight connections to the US " +
      "matter. My partner needs to find remote work or a local job in marketing...",
  },
  {
    id: 18,
    heading: 'Dating & Social Life',
    section: 'Connection',
    moduleId: 'dating_social',
    prompt:
      'What kind of social life do you want? If single — how important is the dating scene, ' +
      'dating apps, meeting people organically? How important is an expat community vs. ' +
      'integrating with locals? Do you need English-speaking friend groups? ' +
      'Is having a specific cultural or ethnic diaspora community important to you ' +
      '(Asian, Latino, African, European)? ' +
      'How important are social activities — meetup groups, writers clubs, hobby groups, ' +
      'community events, networking? Do you prefer a big social city or a quieter community?',
    placeholder:
      "I'm single and the dating scene matters to me — I want a city where it's easy to " +
      "meet people in their 30s. A strong expat community would help me settle in. " +
      "I love going to social events and meetups. Nightlife is nice but not critical...",
  },

  // --- NOURISHMENT ---
  {
    id: 19,
    heading: 'Food & Cuisine',
    section: 'Nourishment',
    moduleId: 'food_cuisine',
    prompt:
      'What are your food needs and preferences? Do you have dietary restrictions ' +
      '(vegan, gluten-free, halal, kosher, allergies)? How important is restaurant variety ' +
      'and quality? Do you cook at home — how important is grocery store quality and access ' +
      'to specific ingredients? What cuisines do you love? How important is local food culture, ' +
      'farmers markets, food delivery apps? What is your monthly food/dining budget?',
    placeholder:
      "I'm vegetarian and need a city with lots of meat-free options. I cook at home " +
      "most days so good grocery stores with fresh produce are essential. I love Thai, " +
      "Indian, and Mediterranean food. My food budget is about $600/month...",
  },
  {
    id: 20,
    heading: 'Sports & Fitness',
    section: 'Nourishment',
    moduleId: 'sports_fitness',
    prompt:
      'How do you stay active and what fitness infrastructure do you need? Gym membership, ' +
      'CrossFit box, yoga studio, swimming pool, running paths, tennis/padel courts? ' +
      'Do you play team sports — are local leagues available for expats? ' +
      'How important is fitness culture in the city? What is your budget for fitness? ' +
      'Do you need outdoor exercise options year-round? ' +
      'If fitness is not a priority, say so.',
    placeholder:
      "I go to the gym 5x/week and play padel twice a week. I need a well-equipped gym " +
      "within walking distance. Outdoor running paths are important. I'd like to find " +
      "a padel club with English-speaking players. Budget: $100-150/month for gym...",
  },
  {
    id: 21,
    heading: 'Outdoor & Nature',
    section: 'Nourishment',
    moduleId: 'outdoor_nature',
    prompt:
      'How important is access to nature in your daily and weekly life? Do you want beach access, ' +
      'mountains for hiking, forests, lakes, rivers? How close does nature need to be — walkable, ' +
      'short drive, weekend trips? Do you do water sports (surfing, sailing, diving), ' +
      'hiking, camping, skiing? How important are city parks and green spaces for daily life? ' +
      'Is natural beauty a core reason for your relocation?',
    placeholder:
      "I want to be within 30 minutes of a beach and within an hour of hiking trails. " +
      "I surf recreationally and want decent waves accessible on weekends. Daily access " +
      "to city parks for walks is important. Nature is a top-3 priority for me...",
  },

  // --- SOUL ---
  {
    id: 22,
    heading: 'Arts & Culture',
    section: 'Soul',
    moduleId: 'arts_culture',
    prompt:
      'How important is cultural richness in your ideal city? Do you attend museums, galleries, ' +
      'theater, live music, film festivals? How important is architectural beauty and historic ' +
      'character vs. modern development? Do you create art yourself — do you need studio space, ' +
      'creative communities, art supplies? How important is the city\'s cultural identity and ' +
      'heritage? Would you choose a culturally vibrant but more expensive city over a cheaper but bland one?',
    placeholder:
      "I go to museums and galleries monthly. Live music is a big part of my social life. " +
      "I want a city with genuine cultural character — not a soulless modern development. " +
      "Historic architecture makes me happy. I'd pay more for cultural vibrancy...",
  },
  {
    id: 23,
    heading: 'Entertainment & Nightlife',
    section: 'Soul',
    moduleId: 'entertainment',
    prompt:
      'What does your ideal entertainment and nightlife scene look like? Do you go out to bars, clubs, ' +
      'restaurants on weekends? How important are concerts, festivals, comedy shows, sporting events? ' +
      'Do you prefer a city that is alive at night or one that quiets down early? ' +
      'How much do you spend monthly on entertainment? What about home entertainment — ' +
      'streaming services, gaming, home theater? Specific entertainment you cannot live without?',
    placeholder:
      "I love going out on weekends — good cocktail bars and live music venues are essential. " +
      "I attend 3-4 concerts a year and love food festivals. I don't need clubs but " +
      "I want the city to feel alive on weekend nights. Budget: $300-400/month...",
  },
  {
    id: 24,
    heading: 'Spiritual & Religious',
    section: 'Soul',
    moduleId: 'spiritual',
    prompt:
      'Do you have religious or spiritual needs that affect where you live? Do you need a specific ' +
      'place of worship (church, mosque, synagogue, temple, meditation center)? How important is ' +
      'religious tolerance and diversity? Would you avoid a country with a dominant religion different ' +
      'from yours? Do you practice yoga, meditation, or alternative spirituality that needs community? ' +
      'If religion/spirituality is not a factor, say so — it helps weight other priorities.',
    placeholder:
      "I'm not religious but I practice meditation daily and would love access to a " +
      "meditation center or Buddhist temple. Religious tolerance is important to me — " +
      "I want a society that respects all beliefs. This is not a top priority though...",
  },
  {
    id: 25,
    heading: 'Pets & Animals',
    section: 'Soul',
    moduleId: 'pets',
    prompt:
      'Do you have pets or plan to get any? What animals and breeds? What pet infrastructure matters: ' +
      'pet-friendly rental housing, veterinary quality and cost, off-leash parks and dog beaches, ' +
      'pet import regulations and quarantine requirements, breed-specific legislation? ' +
      'How important is the general attitude toward pets in the culture? ' +
      'If you have no pets and no plans for any, say so clearly.',
    placeholder:
      "I have a 4-year-old golden retriever. Pet-friendly apartments are essential — " +
      "many places reject large dogs. I need a good vet within 20 minutes. Off-leash " +
      "parks are important for daily exercise. I'd need to research import requirements...",
  },

  // ═══════════════════════════════════════════════════════════════
  // PHASE 6: YOUR VISION
  // Emotional/aspirational — catches anything the structured phases missed
  // ═══════════════════════════════════════════════════════════════
  {
    id: 26,
    heading: 'Your Dream Day',
    section: 'Your Vision',
    prompt:
      'Describe your perfect ordinary day in your new city — not a vacation day, but a regular ' +
      'Tuesday. Morning to night: where do you wake up, what do you see, how do you get your ' +
      'coffee, where do you work, what do you do for lunch, how do you spend the afternoon, ' +
      'what does the evening look like? Paint the picture so vividly that Gemini can extract ' +
      'lifestyle metrics you might not have mentioned explicitly.',
    placeholder:
      "I wake up in my apartment with a balcony overlooking the water. I walk 5 minutes " +
      "to a local cafe for coffee and a pastry. I work from a coworking space with ocean " +
      "views until noon. Lunch is at a small local restaurant — maybe fresh fish and salad...",
  },
  {
    id: 27,
    heading: 'Anything Else',
    section: 'Your Vision',
    prompt:
      'What did we miss? This is your wildcard. Dealbreakers that did not fit, quirky preferences, ' +
      'things deeply important to you that no questionnaire ever asks about. Past relocation ' +
      'experiences (good or bad), specific cities you have visited and loved or hated and WHY, ' +
      'relationship dynamics that affect location, future plans (starting a family, retiring, ' +
      'building a business) that should influence the recommendation. Anything.',
    placeholder:
      "One thing nobody asks about: I'm a light sleeper and noise pollution is a real " +
      "issue for me. I visited Lisbon last year and loved the vibe but hated the hills. " +
      "I've also been to Bali — amazing nature but too humid. I plan to start a family...",
  },
];

/** Group paragraphs by section for sidebar navigation */
export const PARAGRAPH_SECTIONS = [
  { name: 'Your Profile', ids: [1, 2] },
  { name: 'Do Not Wants', ids: [3] },
  { name: 'Must Haves', ids: [4] },
  { name: 'Trade-offs', ids: [5] },
  { name: 'Survival', ids: [6, 7, 8, 9] },
  { name: 'Foundation', ids: [10, 11, 12] },
  { name: 'Growth', ids: [13, 14, 15, 16] },
  { name: 'Connection', ids: [17, 18] },
  { name: 'Nourishment', ids: [19, 20, 21] },
  { name: 'Soul', ids: [22, 23, 24, 25] },
  { name: 'Your Vision', ids: [26, 27] },
];

/** Total paragraph count */
export const PARAGRAPH_COUNT = PARAGRAPH_DEFS.length; // 27

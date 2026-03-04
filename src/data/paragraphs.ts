/**
 * 24 Paragraph Definitions
 * Maps the Human Existence Flow to paragraph prompts.
 * Each paragraph has an ID, heading, section group, and writing prompt.
 */

export interface ParagraphDef {
  id: number;
  heading: string;
  section: string;
  prompt: string;
  placeholder: string;
}

export const PARAGRAPH_DEFS: ParagraphDef[] = [
  // OPENING (Your Story)
  {
    id: 1,
    heading: 'Who You Are',
    section: 'Opening',
    prompt: 'Tell us about yourself — your name, age, background, where you come from, and what makes you, you.',
    placeholder: 'My name is... I\'m originally from... What defines me is...',
  },
  {
    id: 2,
    heading: 'Your Life Right Now',
    section: 'Opening',
    prompt: 'Describe your current situation. What\'s working? What isn\'t? What made you start thinking about relocating?',
    placeholder: 'Right now I\'m living in... The thing that\'s pushing me to consider a move is...',
  },

  // SURVIVAL & FOUNDATION
  {
    id: 3,
    heading: 'Your Ideal Climate',
    section: 'Survival & Foundation',
    prompt: 'What weather and environment do you dream of? Seasons, temperature, humidity — paint the picture.',
    placeholder: 'My ideal climate would be... I love/hate... The seasons I want are...',
  },
  {
    id: 4,
    heading: 'Safety & Peace of Mind',
    section: 'Survival & Foundation',
    prompt: 'What does feeling safe mean to you? Think about crime, political stability, emergency services, neighborhood vibes.',
    placeholder: 'Feeling safe to me means... I need to feel secure about...',
  },
  {
    id: 5,
    heading: 'Your Health & Wellness',
    section: 'Survival & Foundation',
    prompt: 'Describe your health priorities. Any medical needs, chronic conditions, or wellness goals that matter for where you live?',
    placeholder: 'My health priorities include... I need access to...',
  },
  {
    id: 6,
    heading: 'Your Dream Home',
    section: 'Survival & Foundation',
    prompt: 'What does your ideal home look like? Apartment, house, villa? Urban, suburban, rural? How much space do you need?',
    placeholder: 'My dream home would be... In a neighborhood that feels...',
  },

  // LEGAL & FINANCIAL
  {
    id: 7,
    heading: 'Your Legal Reality',
    section: 'Legal & Financial',
    prompt: 'What\'s your citizenship and visa situation? Any passport advantages or limitations? What legal pathways interest you?',
    placeholder: 'I hold a passport from... My visa situation is... I\'m interested in...',
  },
  {
    id: 8,
    heading: 'Your Financial Picture',
    section: 'Legal & Financial',
    prompt: 'What\'s your budget for relocation? Monthly cost of living tolerance? Income sources — remote work, savings, investments?',
    placeholder: 'My budget range is... I can afford a monthly cost of living around...',
  },
  {
    id: 9,
    heading: 'Freedom & Autonomy',
    section: 'Legal & Financial',
    prompt: 'What freedoms matter most to you? Think about personal liberty, press freedom, business freedom, lifestyle choices.',
    placeholder: 'The freedoms that matter most to me are... I couldn\'t live somewhere that...',
  },

  // LIVELIHOOD & GROWTH
  {
    id: 10,
    heading: 'Your Work & Career',
    section: 'Livelihood & Growth',
    prompt: 'What do you do for work? Remote or local? What are your career ambitions? What professional ecosystem do you need?',
    placeholder: 'I work as... My career goals are... I need a place where...',
  },
  {
    id: 11,
    heading: 'Staying Connected',
    section: 'Livelihood & Growth',
    prompt: 'How important is internet speed and tech infrastructure? What about coworking spaces, startup ecosystems, digital nomad communities?',
    placeholder: 'I need internet speeds of at least... Tech-wise, I rely on...',
  },
  {
    id: 12,
    heading: 'Getting Around',
    section: 'Livelihood & Growth',
    prompt: 'How do you want to get around? Car, public transit, bike, walk? How important is international airport access?',
    placeholder: 'My ideal way to get around is... I need to be within... of an airport...',
  },
  {
    id: 13,
    heading: 'Learning & Growth',
    section: 'Livelihood & Growth',
    prompt: 'Any education goals for you or your family? Language learning, universities, schools, professional development?',
    placeholder: 'Education-wise, I\'m looking for... My learning goals include...',
  },

  // PEOPLE & RELATIONSHIPS
  {
    id: 14,
    heading: 'Your Family',
    section: 'People & Relationships',
    prompt: 'Who comes with you? Partner, kids, parents? What do they need from the new location? Family-friendly services?',
    placeholder: 'I\'m moving with... They need... Family considerations include...',
  },
  {
    id: 15,
    heading: 'Your Social World',
    section: 'People & Relationships',
    prompt: 'What kind of social life do you want? Expat communities, local friends, dating scene? How important is nightlife and social activities?',
    placeholder: 'Socially, I thrive when... I\'m looking for a community that...',
  },
  {
    id: 16,
    heading: 'Your Animals',
    section: 'People & Relationships',
    prompt: 'Do you have pets? What animals? Pet-friendliness of housing, parks, vet access — what matters?',
    placeholder: 'I have... pets. I need a place where... Pet priorities include...',
  },

  // NOURISHMENT & LIFESTYLE
  {
    id: 17,
    heading: 'Food & Dining',
    section: 'Nourishment & Lifestyle',
    prompt: 'What are your dietary needs and food preferences? Cuisines you love, dietary restrictions, food culture importance?',
    placeholder: 'Food-wise, I need... My favorite cuisines are... I follow a... diet',
  },
  {
    id: 18,
    heading: 'Fitness & Activity',
    section: 'Nourishment & Lifestyle',
    prompt: 'How do you stay active? Gym, sports, yoga, hiking? What fitness infrastructure matters to you?',
    placeholder: 'I stay active by... I need access to... My fitness priorities are...',
  },
  {
    id: 19,
    heading: 'Nature & Outdoors',
    section: 'Nourishment & Lifestyle',
    prompt: 'Mountains or beaches? Parks, trails, water sports? How important is access to nature in your daily life?',
    placeholder: 'I love being near... My outdoor activities include... Nature means... to me',
  },

  // SOUL & MEANING
  {
    id: 20,
    heading: 'Arts & Culture',
    section: 'Soul & Meaning',
    prompt: 'Museums, galleries, music, theater — how important is cultural richness? What cultural scene excites you?',
    placeholder: 'Culturally, I\'m drawn to... I love attending... The arts scene I want...',
  },
  {
    id: 21,
    heading: 'Fun & Entertainment',
    section: 'Soul & Meaning',
    prompt: 'What\'s your idea of fun? Nightlife, events, festivals, hobbies? What entertainment options matter?',
    placeholder: 'For fun, I love... My ideal weekend involves... I need access to...',
  },
  {
    id: 22,
    heading: 'Faith & Spirituality',
    section: 'Soul & Meaning',
    prompt: 'Do you have religious or spiritual needs? Places of worship, spiritual communities, religious tolerance?',
    placeholder: 'My spiritual/religious needs include... I practice... I need a community that...',
  },

  // CLOSING (Your Vision)
  {
    id: 23,
    heading: 'Your Dream Day',
    section: 'Closing',
    prompt: 'Describe your perfect day in your new city. Morning to night — what does it look like, feel like, taste like?',
    placeholder: 'My perfect day starts with... In the afternoon I... The evening looks like...',
  },
  {
    id: 24,
    heading: 'Anything Else',
    section: 'Closing',
    prompt: 'Anything we missed? Dealbreakers, wild cards, things that don\'t fit neatly into categories but matter deeply to you.',
    placeholder: 'One thing I haven\'t mentioned... My absolute dealbreaker is... I also want to say...',
  },
];

/** Group paragraphs by section for sidebar navigation */
export const PARAGRAPH_SECTIONS = [
  { name: 'Opening', ids: [1, 2] },
  { name: 'Survival & Foundation', ids: [3, 4, 5, 6] },
  { name: 'Legal & Financial', ids: [7, 8, 9] },
  { name: 'Livelihood & Growth', ids: [10, 11, 12, 13] },
  { name: 'People & Relationships', ids: [14, 15, 16] },
  { name: 'Nourishment & Lifestyle', ids: [17, 18, 19] },
  { name: 'Soul & Meaning', ids: [20, 21, 22] },
  { name: 'Closing', ids: [23, 24] },
];

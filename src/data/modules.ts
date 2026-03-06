/**
 * CLUES Main Module - 20 Module Definitions
 * Each module is a freestanding app contributing 10 general questions
 *
 * Clues Intelligence LTD
 */

export type ModuleStatus = 'locked' | 'not_started' | 'in_progress' | 'completed' | 'recommended';

export interface ModuleDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  status: ModuleStatus;
  score?: number;          // 0-100 completion/SMART score
  questionCount: number;   // Always 10 for general questions
  url?: string;            // Link to freestanding module app
}

export const MODULES: ModuleDefinition[] = [
  // ═══════════════════════════════════════════════════════════════
  // SURVIVAL (P6-P9) — The basics of staying alive and sheltered
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'climate_weather',
    name: 'Climate & Weather',
    shortName: 'Climate',
    description: 'Temperature, humidity, sunshine, natural disasters, and seasons',
    icon: '\u{1F326}\uFE0F',  // Sun behind rain cloud
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'safety_security',
    name: 'Safety & Security',
    shortName: 'Safety',
    description: 'Crime rates, political stability, emergency services, and personal safety',
    icon: '\u{1F6E1}\uFE0F',  // Shield
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    shortName: 'Healthcare',
    description: 'System quality, insurance, specialists, and medical infrastructure',
    icon: '\u{1F3E5}',  // Hospital
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'housing',
    name: 'Housing & Real Estate',
    shortName: 'Housing',
    description: 'Cost, availability, quality, property rights, and neighborhoods',
    icon: '\u{1F3E0}',  // House
    status: 'not_started',
    questionCount: 10
  },

  // ═══════════════════════════════════════════════════════════════
  // FOUNDATION (P10-P12) — Legal, financial, and personal freedom
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'legal_immigration',
    name: 'Legal & Immigration',
    shortName: 'Legal',
    description: 'Visa pathways, residency programs, rule of law, and legal system',
    icon: '\u{2696}\uFE0F',  // Scales
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'financial',
    name: 'Financial & Banking',
    shortName: 'Finance',
    description: 'Banking access, tax structure, cost of living, and financial services',
    icon: '\u{1F4B0}',  // Money bag
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'lifescore',
    name: 'Legal Independence & Freedom',
    shortName: 'LifeScore',
    description: 'Legal freedom, personal autonomy, and civil liberties',
    icon: '\u{1F5FD}',  // Statue of Liberty
    status: 'completed',
    score: 100,
    questionCount: 10,
    url: 'https://clueslifescore.com'
  },

  // ═══════════════════════════════════════════════════════════════
  // GROWTH (P13-P16) — Career, tech, transport, education
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'business',
    name: 'Business & Entrepreneurship',
    shortName: 'Business',
    description: 'Startup ecosystem, regulations, coworking, and business climate',
    icon: '\u{1F4BC}',  // Briefcase
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'technology',
    name: 'Technology & Connectivity',
    shortName: 'Tech',
    description: 'Internet speed, tech ecosystem, digital infrastructure, and innovation',
    icon: '\u{1F4F1}',  // Mobile phone
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'transportation',
    name: 'Transportation & Mobility',
    shortName: 'Transport',
    description: 'Transit systems, walkability, car dependency, and commute quality',
    icon: '\u{1F687}',  // Metro
    status: 'recommended',
    questionCount: 10
  },
  {
    id: 'education',
    name: 'Education & Learning',
    shortName: 'Education',
    description: 'Schools, universities, continuing education, and learning culture',
    icon: '\u{1F393}',  // Graduation cap
    status: 'not_started',
    questionCount: 10
  },

  // ═══════════════════════════════════════════════════════════════
  // CONNECTION (P17-P18) — Family and social bonds
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'family',
    name: 'Family & Children',
    shortName: 'Family',
    description: 'Family services, kid-friendly amenities, schools, and family life',
    icon: '\u{1F46A}',  // Family
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'dating_social',
    name: 'Dating & Social Life',
    shortName: 'Social',
    description: 'Dating scene, social communities, expat networks, and nightlife',
    icon: '\u{1F496}',  // Sparkling heart
    status: 'not_started',
    questionCount: 10
  },

  // ═══════════════════════════════════════════════════════════════
  // NOURISHMENT (P19-P21) — Food, fitness, nature
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'food_cuisine',
    name: 'Food & Cuisine',
    shortName: 'Food',
    description: 'Restaurant scene, grocery access, dietary options, and food culture',
    icon: '\u{1F37D}\uFE0F',  // Fork and knife with plate
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'sports_fitness',
    name: 'Sports & Fitness',
    shortName: 'Sports',
    description: 'Gyms, sports leagues, fitness culture, and athletic facilities',
    icon: '\u{1F3CB}\uFE0F',  // Weight lifter
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'outdoor_nature',
    name: 'Outdoor & Nature',
    shortName: 'Outdoors',
    description: 'Parks, recreation, hiking, beaches, and natural geography',
    icon: '\u{1F3D4}\uFE0F',  // Snow-capped mountain
    status: 'not_started',
    questionCount: 10
  },

  // ═══════════════════════════════════════════════════════════════
  // SOUL (P22-P25) — Culture, entertainment, spirituality, pets
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'arts_culture',
    name: 'Arts & Culture',
    shortName: 'Arts',
    description: 'Museums, galleries, heritage sites, and cultural identity',
    icon: '\u{1F3A8}',  // Artist palette
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'entertainment',
    name: 'Entertainment & Nightlife',
    shortName: 'Entertainment',
    description: 'Cultural venues, events, concerts, and entertainment options',
    icon: '\u{1F3AD}',  // Performing arts
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'spiritual',
    name: 'Spiritual & Religious',
    shortName: 'Spiritual',
    description: 'Places of worship, religious tolerance, and spiritual communities',
    icon: '\u{1F54C}',  // Mosque (representing all faiths)
    status: 'not_started',
    questionCount: 10
  },
  {
    id: 'pets',
    name: 'Pets & Animals',
    shortName: 'Pets',
    description: 'Pet-friendly policies, veterinary care, and animal welfare',
    icon: '\u{1F43E}',  // Paw prints
    status: 'not_started',
    questionCount: 10
  }
];

export const MODULES_MAP: Record<string, ModuleDefinition> = MODULES.reduce(
  (acc, mod) => ({ ...acc, [mod.id]: mod }),
  {} as Record<string, ModuleDefinition>
);

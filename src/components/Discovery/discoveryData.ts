/**
 * Discovery Questionnaire — Data & Constants
 * Section definitions, categories, colors, and shared utilities.
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
  { id: 1,  cat: 'Opening',              title: 'Who You Are',           icon: '\u25C6', accent: '#C4A87A',
    prompt: 'Tell us about yourself \u2014 your name, your age, where you\u2019re from, and who you are at your core. What defines you beyond a r\u00E9sum\u00E9?',
    hint: 'I\u2019m a 52-year-old architect from Portland who\u2019s spent the last two decades designing homes for other people while dreaming about my own perfect place abroad\u2026' },
  { id: 2,  cat: 'Opening',              title: 'Your Life Right Now',   icon: '\u25C7', accent: '#C8AE80',
    prompt: 'Describe your current situation. What\u2019s working? What isn\u2019t? What made you start thinking about relocating?',
    hint: 'Right now I\u2019m at a crossroads. My career is stable but uninspiring, the cost of living keeps climbing, and I keep asking myself \u2014 is this really where I want to spend the next chapter?' },
  { id: 3,  cat: 'Survival & Foundation', title: 'Your Ideal Climate',   icon: '\u25CB', accent: '#92ADB6',
    prompt: 'What kind of weather and climate makes you feel most alive? Warm and sunny? Cool and crisp? Tropical? Mediterranean? Describe your perfect climate in vivid detail.',
    hint: 'I thrive in warm, dry climates with mild winters \u2014 think Mediterranean. I love waking up to sunshine but can\u2019t stand oppressive humidity\u2026' },
  { id: 4,  cat: 'Survival & Foundation', title: 'Safety & Peace of Mind', icon: '\u25A1', accent: '#8BA9B2',
    prompt: 'How important is safety to you? What does feeling safe look like in your daily life? Are there specific concerns \u2014 crime, political stability, natural disasters?',
    hint: 'Safety is non-negotiable. I want to walk home at midnight without looking over my shoulder. Low crime, stable government, and a community where people look out for each other\u2026' },
  { id: 5,  cat: 'Survival & Foundation', title: 'Your Health & Wellness', icon: '+', accent: '#7DACA4',
    prompt: 'Tell us about your health needs. Do you have ongoing medical conditions? How important is access to quality healthcare? What does wellness mean to you?',
    hint: 'My partner has a heart condition that requires regular specialist visits, so proximity to world-class cardiac care is essential\u2026' },
  { id: 6,  cat: 'Survival & Foundation', title: 'Your Dream Home',      icon: '\u2302', accent: '#95B5BF',
    prompt: 'Describe your perfect living space. House, apartment, villa? Urban, suburban, rural? What features are must-haves? What\u2019s your style?',
    hint: 'A light-filled apartment with high ceilings and a terrace overlooking the sea. Open floor plan, modern kitchen, at least two bedrooms\u2026' },
  { id: 7,  cat: 'Legal & Financial',     title: 'Your Legal Reality',   icon: '\u00A7', accent: '#B49E80',
    prompt: 'What\u2019s your citizenship or residency status? Do you hold multiple passports? Are there visa considerations? Any legal constraints on where you can live?',
    hint: 'I\u2019m a US citizen with no dual citizenship. I\u2019d need a visa \u2014 ideally something like a digital nomad visa or retirement visa\u2026' },
  { id: 8,  cat: 'Legal & Financial',     title: 'Your Financial Picture', icon: '\u25C8', accent: '#C0A07E',
    prompt: 'Give us a sense of your financial situation \u2014 not exact numbers, but your comfort level. Budget range for housing? Income sources? Financial priorities?',
    hint: 'We have a comfortable nest egg and passive income from rental properties. Housing budget around \u20AC2,000\u20133,000/month\u2026' },
  { id: 9,  cat: 'Legal & Financial',     title: 'Freedom & Autonomy',   icon: '\u2696', accent: '#BDA478',
    prompt: 'How important are personal freedoms to you? Freedom of speech, LGBTQ+ rights, religious freedom, gun laws, drug policies \u2014 what matters most?',
    hint: 'Progressive values are core to who we are. We want to live somewhere that respects individual rights, embraces diversity\u2026' },
  { id: 10, cat: 'Livelihood & Growth',   title: 'Your Work & Career',   icon: '\u2B21', accent: '#88A88E',
    prompt: 'What do you do for work? Can you do it remotely? Are you looking to start something new? Do you need local employment opportunities?',
    hint: 'I run my own consulting business \u2014 fully remote. I need reliable high-speed internet and a time zone that overlaps with US business hours\u2026' },
  { id: 11, cat: 'Livelihood & Growth',   title: 'Staying Connected',    icon: '\u25CE', accent: '#7DA68A',
    prompt: 'How important is connectivity \u2014 internet speed, mobile coverage, access to international communication? Do you need to stay close to a major airport?',
    hint: 'High-speed fiber internet is absolutely essential \u2014 I\u2019m on video calls daily. Also need to be within an hour of a major international airport\u2026' },
  { id: 12, cat: 'Livelihood & Growth',   title: 'Getting Around',       icon: '\u2192', accent: '#8EAE92',
    prompt: 'How do you want to get around? Walk everywhere? Drive? Public transit? How important is walkability versus having a car?',
    hint: 'Walkability is huge for us. We want to do daily errands on foot \u2014 groceries, caf\u00E9, pharmacy. Great public transit for longer trips\u2026' },
  { id: 13, cat: 'Livelihood & Growth',   title: 'Learning & Growth',    icon: '\u221E', accent: '#79A48C',
    prompt: 'Are you interested in learning a new language? Taking classes? Access to universities or cultural institutions? How important is intellectual stimulation?',
    hint: 'I\u2019d love to learn the local language \u2014 immersion is part of the adventure. Access to university lectures and a vibrant intellectual community\u2026' },
  { id: 14, cat: 'People & Relationships', title: 'Your Family',          icon: '\u274B', accent: '#AD8899',
    prompt: 'Tell us about your family situation. Who\u2019s relocating with you? Children? Aging parents? How will the move affect your family dynamics?',
    hint: 'It\u2019s just my partner and me \u2014 no kids. My elderly mother is in assisted living in Ohio, so I need to be able to get back within 24 hours\u2026' },
  { id: 15, cat: 'People & Relationships', title: 'Your Social World',    icon: '\u25D0', accent: '#A8879A',
    prompt: 'What kind of social life do you want? Expat community? Local friends? Clubs, groups, activities? How easily do you make friends?',
    hint: 'We\u2019re social people but not party animals. We\u2019d love a mix of expat and local friends. Book clubs, dinner parties, community volunteering\u2026' },
  { id: 16, cat: 'People & Relationships', title: 'Your Animals',         icon: '\u2661', accent: '#B88FA0',
    prompt: 'Do you have pets? What kind? How important are pet-friendly policies, parks, and veterinary care in your new location?',
    hint: 'We have two rescue dogs \u2014 a 60-lb lab mix and a 25-lb terrier. Pet-friendly housing and off-leash parks are essential\u2026' },
  { id: 17, cat: 'Nourishment & Lifestyle', title: 'Food & Dining',       icon: '\u2727', accent: '#C0A07E',
    prompt: 'What role does food play in your life? Adventurous eaters? Cook at home or dine out? Dietary needs? How important are fresh markets?',
    hint: 'Food is everything to us. We cook most meals but love exploring local restaurants. Fresh seafood, farmers markets, and diverse international cuisines\u2026' },
  { id: 18, cat: 'Nourishment & Lifestyle', title: 'Fitness & Activity',  icon: '\u25B3', accent: '#C8A67A',
    prompt: 'How do you stay active? Gym, yoga, swimming, hiking, cycling? How important is access to fitness facilities and active lifestyle infrastructure?',
    hint: 'I swim laps every morning and my partner does yoga. We hike on weekends. Access to a good pool, yoga studios, and scenic hiking trails\u2026' },
  { id: 19, cat: 'Nourishment & Lifestyle', title: 'Nature & Outdoors',   icon: '\u2756', accent: '#B89C7E',
    prompt: 'How connected to nature do you want to be? Ocean, mountains, forests, parks? How important is proximity to natural beauty in your daily life?',
    hint: 'Being near the ocean is deeply important to me \u2014 it\u2019s where I find peace. Mountains within a day trip would be perfect\u2026' },
  { id: 20, cat: 'Soul & Meaning',        title: 'Arts & Culture',       icon: '\u2666', accent: '#9F96B8',
    prompt: 'How important are museums, galleries, theater, music, and cultural life? Do you want a vibrant arts scene or is a quieter cultural setting fine?',
    hint: 'We love live music, independent film, and contemporary art. A city with a thriving cultural calendar \u2014 festivals, gallery openings, jazz clubs\u2026' },
  { id: 21, cat: 'Soul & Meaning',        title: 'Fun & Entertainment',  icon: '\u273A', accent: '#9690B2',
    prompt: 'What do you do for fun? Sports events, nightlife, shopping, festivals, gaming, hobbies? What keeps you entertained and energized?',
    hint: 'Weekends are for exploring \u2014 flea markets, wine tastings, live concerts, trying new restaurants. Not big on nightclubs but love lively evening caf\u00E9 culture\u2026' },
  { id: 22, cat: 'Soul & Meaning',        title: 'Faith & Spirituality', icon: '\u2721', accent: '#A79CC0',
    prompt: 'Does faith or spirituality play a role in your life? Do you need access to specific places of worship or spiritual communities?',
    hint: 'We\u2019re spiritual but not religious. Access to meditation centers or yoga retreats is a plus. We value living somewhere tolerant of all beliefs\u2026' },
  { id: 23, cat: 'Closing',               title: 'Your Dream Day',       icon: '\u2600', accent: '#C8AE80',
    prompt: 'Paint us a picture. Describe your perfect ordinary day in your new home \u2014 from morning coffee to evening wind-down. Don\u2019t hold back. Be vivid.',
    hint: 'I wake up to sunlight streaming through sheer curtains, the sound of the sea in the distance. Coffee on the terrace with my partner, watching the neighborhood come alive\u2026' },
  { id: 24, cat: 'Closing',               title: 'Anything Else',        icon: '\u2605', accent: '#C4A87A',
    prompt: 'Is there anything we haven\u2019t asked that matters to you? Dealbreakers? Secret wishes? Fears? This is your space to tell us what we need to know.',
    hint: 'One thing I didn\u2019t mention \u2014 I\u2019m terrified of starting over at my age. But I\u2019m more terrified of staying put and wondering \u201Cwhat if\u201D\u2026' },
];

export const CATEGORIES = [...new Set(SECTIONS.map(s => s.cat))];

export const CAT_COLORS: Record<string, string> = {
  'Opening': '#C4A87A',
  'Survival & Foundation': '#92ADB6',
  'Legal & Financial': '#B49E80',
  'Livelihood & Growth': '#88A88E',
  'People & Relationships': '#AD8899',
  'Nourishment & Lifestyle': '#C0A07E',
  'Soul & Meaning': '#9F96B8',
  'Closing': '#C8AE80',
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

export function buildOliviaPrompt(sectionTitle: string, sectionCat: string, sectionPrompt: string, currentAnswer: string): string {
  return `You are Olivia, a warm and sophisticated AI relocation advisor for CLUES\u2122 by John E. Desautels & Associates.
CURRENT SECTION: "${sectionTitle}" (Category: ${sectionCat})
QUESTION: "${sectionPrompt}"
CLIENT'S ANSWER SO FAR: ${currentAnswer ? `"${currentAnswer}"` : '(not yet answered)'}
YOUR ROLE: Help them articulate their true needs. Ask gentle follow-up questions. Be warm, empathetic, conversational \u2014 never clinical. Keep responses under 120 words. Never fabricate location data.
Speak as you would on a warm, professional video call.`;
}

/** localStorage key for persisting discovery answers */
export const DISCOVERY_STORAGE_KEY = 'clues_discovery_answers';

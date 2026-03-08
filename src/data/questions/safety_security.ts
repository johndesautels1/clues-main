import type { QuestionModule } from './types';

// Safety & Security — 100 questions
// Module ID: safety_security

export const safetySecurityQuestions: QuestionModule = {
  "moduleId": "safety_security",
  "moduleName": "Safety & Security",
  "fileName": "SAFETY_SECURITY_QUESTIONS.md",
  "structure": "10 sections × 10 questions, each ending with a ranking question + 1 final master ranking (Q100)",
  "totalQuestions": 100,
  "sections": [
    {
      "title": "Crime & Personal Safety",
      "questionRange": "Q1-Q10",
      "questions": [
        {
          "number": 1,
          "question": "What is the maximum overall crime rate you would tolerate in your destination city?",
          "type": "Likert-Concern"
        },
        {
          "number": 2,
          "question": "Which types of crime are most concerning to you? (Select all that apply: violent crime, property crime, petty theft, organized crime, cybercrime, drug-related crime, hate crime, white-collar crime)",
          "type": "Multi-select"
        },
        {
          "number": 3,
          "question": "How important is it that crime rates in your destination have been declining over the past 5 years?",
          "type": "Likert-Importance"
        },
        {
          "number": 4,
          "question": "How important is it that your specific neighborhood has a lower crime rate than the city average?",
          "type": "Likert-Importance"
        },
        {
          "number": 5,
          "question": "How comfortable are you walking alone in your neighborhood after dark?",
          "type": "Likert-Comfort"
        },
        {
          "number": 6,
          "question": "Which home security features do you require? (Select all that apply: gated community, security cameras, alarm system, doorman/concierge, reinforced doors/windows, safe room, smart locks)",
          "type": "Multi-select"
        },
        {
          "number": 7,
          "question": "How important is access to personal safety technology (emergency apps, GPS tracking, smart home security) in your daily life?",
          "type": "Likert-Importance"
        },
        {
          "number": 8,
          "question": "How important are community-based crime prevention programs (neighborhood watch, community policing) in your area?",
          "type": "Likert-Importance"
        },
        {
          "number": 9,
          "question": "How concerned are you about safety differences between daytime and nighttime in your area?",
          "type": "Likert-Concern"
        },
        {
          "number": 10,
          "question": "Rank these crime and personal safety factors from most to least important: Overall crime rate, Neighborhood-specific safety, Night safety, Home security features, Crime trend direction",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Emergency Services",
      "questionRange": "Q11-Q20",
      "questions": [
        {
          "number": 11,
          "question": "What is the maximum acceptable emergency medical response time for your area?",
          "type": "Range"
        },
        {
          "number": 12,
          "question": "What is the maximum acceptable distance from your home to the nearest emergency room?",
          "type": "Range"
        },
        {
          "number": 13,
          "question": "How important is the quality and reliability of fire department services in your area?",
          "type": "Likert-Importance"
        },
        {
          "number": 14,
          "question": "How important is reliable and responsive police service in your neighborhood?",
          "type": "Likert-Importance"
        },
        {
          "number": 15,
          "question": "How important are multilingual emergency communication systems (e.g., 911/112 operators who speak your language)?",
          "type": "Likert-Importance"
        },
        {
          "number": 16,
          "question": "How important is access to advanced emergency services (helicopter medevac, specialized rescue teams, hazmat response)?",
          "type": "Likert-Importance"
        },
        {
          "number": 17,
          "question": "How important is your destination's proven capability to respond to natural disasters?",
          "type": "Likert-Importance"
        },
        {
          "number": 18,
          "question": "How important is a well-funded and organized government emergency management agency (like FEMA)?",
          "type": "Likert-Importance"
        },
        {
          "number": 19,
          "question": "How important is access to community emergency preparedness resources (evacuation plans, shelters, disaster kits)?",
          "type": "Likert-Importance"
        },
        {
          "number": 20,
          "question": "Rank these emergency service factors from most to least important: Medical response time, ER proximity, Fire services, Police reliability, Disaster response capability",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Medical Emergency Infrastructure",
      "questionRange": "Q21-Q30",
      "questions": [
        {
          "number": 21,
          "question": "How important is proximity to a Level I or Level II trauma center?",
          "type": "Likert-Importance"
        },
        {
          "number": 22,
          "question": "How important is 24/7 access to pharmacies and emergency medication in your area?",
          "type": "Likert-Importance"
        },
        {
          "number": 23,
          "question": "How important is the availability of medical specialists on-call for emergencies (cardiologist, neurologist, surgeon)?",
          "type": "Likert-Importance"
        },
        {
          "number": 24,
          "question": "How important is access to mental health crisis services (crisis hotlines, psychiatric emergency rooms, mobile crisis teams)?",
          "type": "Likert-Importance"
        },
        {
          "number": 25,
          "question": "How important is the availability of medical evacuation options (air ambulance, international medical transport) in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 26,
          "question": "How important is community access to first aid training and self-care preparedness programs?",
          "type": "Likert-Importance"
        },
        {
          "number": 27,
          "question": "How important is access to telemedicine and virtual emergency consultations?",
          "type": "Likert-Importance"
        },
        {
          "number": 28,
          "question": "How important is it that hospitals in your area are internationally accredited (e.g., JCI accreditation)?",
          "type": "Likert-Importance"
        },
        {
          "number": 29,
          "question": "Does anyone in your household have specific emergency medical needs (chronic conditions, disabilities, allergies) that require specialized nearby care?",
          "type": "Yes/No"
        },
        {
          "number": 30,
          "question": "Rank these medical emergency factors from most to least important: Trauma center proximity, Pharmacy access, Specialist availability, Mental health crisis services, Hospital accreditation",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Law Enforcement & Legal Protection",
      "questionRange": "Q31-Q40",
      "questions": [
        {
          "number": 31,
          "question": "Which police force characteristics are most important to you? (Select all that apply: community-oriented policing, low corruption, accountability/body cameras, diversity, professionalism, non-militarized, multilingual officers)",
          "type": "Multi-select"
        },
        {
          "number": 32,
          "question": "How important is the reliability and fairness of the local legal system?",
          "type": "Likert-Importance"
        },
        {
          "number": 33,
          "question": "How important is easy access to legal representation, including English-speaking lawyers?",
          "type": "Likert-Importance"
        },
        {
          "number": 34,
          "question": "How important is the availability of private security services (personal guards, private patrol, executive protection)?",
          "type": "Likert-Importance"
        },
        {
          "number": 35,
          "question": "How important are legal rights and protections specifically for foreign residents and expatriates?",
          "type": "Likert-Importance"
        },
        {
          "number": 36,
          "question": "How concerned are you about the availability of witness protection and whistleblower programs?",
          "type": "Likert-Concern"
        },
        {
          "number": 37,
          "question": "How important is access to reliable background check services for hiring domestic staff or business partners?",
          "type": "Likert-Importance"
        },
        {
          "number": 38,
          "question": "How important are victim support services (counseling, legal aid, financial assistance) for crime victims?",
          "type": "Likert-Importance"
        },
        {
          "number": 39,
          "question": "How concerned are you about white-collar crime protections (fraud, identity theft, financial scams targeting foreigners)?",
          "type": "Likert-Concern"
        },
        {
          "number": 40,
          "question": "Rank these law enforcement factors from most to least important: Police quality, Legal system fairness, Foreigner protections, Private security access, Crime victim support",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Community Safety",
      "questionRange": "Q41-Q50",
      "questions": [
        {
          "number": 41,
          "question": "How important are active neighborhood watch or community safety programs in your area?",
          "type": "Likert-Importance"
        },
        {
          "number": 42,
          "question": "How important is a strong sense of social cohesion and mutual trust among neighbors?",
          "type": "Likert-Importance"
        },
        {
          "number": 43,
          "question": "How important are school safety measures (security personnel, anti-bullying programs, safe school zones)?",
          "type": "Likert-Importance"
        },
        {
          "number": 44,
          "question": "How important is robust cyber safety infrastructure (identity theft protection, online fraud prevention, data privacy laws)?",
          "type": "Likert-Importance"
        },
        {
          "number": 45,
          "question": "How important are enforced workplace safety standards (OSHA-equivalent regulations, worker protections)?",
          "type": "Likert-Importance"
        },
        {
          "number": 46,
          "question": "How important is safety and security at public events and venues (concerts, sports, festivals)?",
          "type": "Likert-Importance"
        },
        {
          "number": 47,
          "question": "How important is child safety infrastructure (playground standards, child-proofing of public spaces, amber alert systems)?",
          "type": "Likert-Importance"
        },
        {
          "number": 48,
          "question": "How important are senior safety programs (fall prevention, elder abuse protections, senior-focused emergency services)?",
          "type": "Likert-Importance"
        },
        {
          "number": 49,
          "question": "How concerned are you about gender-based safety issues (harassment, domestic violence rates, gender-based violence protections)?",
          "type": "Likert-Concern"
        },
        {
          "number": 50,
          "question": "Rank these community safety factors from most to least important: Neighborhood cohesion, School safety, Cyber safety, Child safety infrastructure, Gender-based safety",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Transportation Safety",
      "questionRange": "Q51-Q60",
      "questions": [
        {
          "number": 51,
          "question": "How important is road safety (low accident rates, well-maintained roads, enforced traffic laws) in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 52,
          "question": "How important is security on public transportation (cameras, staff presence, well-lit stations, emergency call points)?",
          "type": "Likert-Importance"
        },
        {
          "number": 53,
          "question": "How important are airport security and safety standards in your destination country?",
          "type": "Likert-Importance"
        },
        {
          "number": 54,
          "question": "How important is the safety and regulation of taxi and rideshare services (licensed drivers, GPS tracking, regulated fares)?",
          "type": "Likert-Importance"
        },
        {
          "number": 55,
          "question": "How important is pedestrian safety infrastructure (crosswalks, sidewalks, pedestrian zones, traffic calming)?",
          "type": "Likert-Importance"
        },
        {
          "number": 56,
          "question": "How concerned are you about motorcycle and scooter safety (helmet laws, lane discipline, accident rates)?",
          "type": "Likert-Concern"
        },
        {
          "number": 57,
          "question": "How important is maritime and water safety (coast guard, lifeguards, regulated water activities)?",
          "type": "Likert-Importance"
        },
        {
          "number": 58,
          "question": "How important is the safety record of alternative transportation (cable cars, trams, funiculars, ferries)?",
          "type": "Likert-Importance"
        },
        {
          "number": 59,
          "question": "How important are highway and interstate safety standards (guardrails, signage, emergency pull-offs, speed enforcement)?",
          "type": "Likert-Importance"
        },
        {
          "number": 60,
          "question": "Rank these transportation safety factors from most to least important: Road safety, Public transit security, Pedestrian safety, Rideshare safety, Maritime/water safety",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Environmental & Natural Hazards",
      "questionRange": "Q61-Q70",
      "questions": [
        {
          "number": 61,
          "question": "How concerned are you about living in an area prone to natural disasters (earthquakes, hurricanes, floods, wildfires)?",
          "type": "Likert-Concern"
        },
        {
          "number": 62,
          "question": "Which specific natural hazards are you most concerned about? (Select all that apply: earthquakes, tsunamis, hurricanes/typhoons, tornadoes, flooding, wildfires, volcanic activity, landslides, drought)",
          "type": "Multi-select"
        },
        {
          "number": 63,
          "question": "How important are strict building safety codes and seismic standards in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 64,
          "question": "How concerned are you about industrial and environmental hazards (chemical plants, pollution, toxic waste sites) near residential areas?",
          "type": "Likert-Concern"
        },
        {
          "number": 65,
          "question": "How concerned are you about endemic diseases and health hazards (malaria, dengue, waterborne illness) in your destination?",
          "type": "Likert-Concern"
        },
        {
          "number": 66,
          "question": "How concerned are you about wildlife and animal hazards (venomous snakes, dangerous predators, stray dogs, insect-borne diseases)?",
          "type": "Likert-Concern"
        },
        {
          "number": 67,
          "question": "How concerned are you about climate-related safety issues (extreme heat, severe storms, rising sea levels, air quality crises)?",
          "type": "Likert-Concern"
        },
        {
          "number": 68,
          "question": "How important is safe and clean drinking water quality and infrastructure?",
          "type": "Likert-Importance"
        },
        {
          "number": 69,
          "question": "How important are recreational safety standards (regulated adventure sports, lifeguarded beaches, safe hiking trails)?",
          "type": "Likert-Importance"
        },
        {
          "number": 70,
          "question": "Rank these environmental safety factors from most to least important: Natural disaster risk, Building codes, Disease/health hazards, Water quality, Climate-related safety",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Technology & Cybersecurity",
      "questionRange": "Q71-Q80",
      "questions": [
        {
          "number": 71,
          "question": "How important is reliable communication infrastructure during emergencies (cell service, internet, radio)?",
          "type": "Likert-Importance"
        },
        {
          "number": 72,
          "question": "How important are government emergency alert systems (text alerts, sirens, broadcast warnings)?",
          "type": "Likert-Importance"
        },
        {
          "number": 73,
          "question": "How important is national cybersecurity infrastructure (government cyber defense, regulated internet, anti-hacking laws)?",
          "type": "Likert-Importance"
        },
        {
          "number": 74,
          "question": "How important are strong data privacy protection laws (GDPR-equivalent, personal data rights, consent requirements)?",
          "type": "Likert-Importance"
        },
        {
          "number": 75,
          "question": "How important is network security and reliability (encrypted communications, secure banking, protected WiFi networks)?",
          "type": "Likert-Importance"
        },
        {
          "number": 76,
          "question": "How do you feel about the balance between public surveillance (CCTV, facial recognition) and personal privacy?",
          "type": "Slider"
        },
        {
          "number": 77,
          "question": "How important is access to emergency safety apps and technology (local emergency apps, safety check-in features, panic buttons)?",
          "type": "Likert-Importance"
        },
        {
          "number": 78,
          "question": "How important is reliable GPS and location services for personal safety and navigation?",
          "type": "Likert-Importance"
        },
        {
          "number": 79,
          "question": "How important is the security of financial transactions (chip+pin, two-factor authentication, fraud protection laws)?",
          "type": "Likert-Importance"
        },
        {
          "number": 80,
          "question": "Rank these technology safety factors from most to least important: Emergency communications, Cybersecurity laws, Data privacy, Surveillance-privacy balance, Financial transaction security",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Cultural & Social Safety",
      "questionRange": "Q81-Q90",
      "questions": [
        {
          "number": 81,
          "question": "How important is cultural acceptance and safety for people of your background in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 82,
          "question": "How important are LGBTQ+ safety protections and rights in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 83,
          "question": "How important are women's safety protections and gender equality rights?",
          "type": "Likert-Importance"
        },
        {
          "number": 84,
          "question": "How important is religious freedom and safety to practice your faith openly?",
          "type": "Likert-Importance"
        },
        {
          "number": 85,
          "question": "How concerned are you about safety for ethnic and racial minorities in your destination?",
          "type": "Likert-Concern"
        },
        {
          "number": 86,
          "question": "How important are child protection services and laws (mandatory reporting, child welfare agencies, anti-exploitation laws)?",
          "type": "Likert-Importance"
        },
        {
          "number": 87,
          "question": "How concerned are you about alcohol and substance abuse culture and its impact on community safety?",
          "type": "Likert-Concern"
        },
        {
          "number": 88,
          "question": "How important is political stability and the absence of political violence or civil unrest?",
          "type": "Likert-Importance"
        },
        {
          "number": 89,
          "question": "How important is press freedom and access to reliable, uncensored information for your sense of safety?",
          "type": "Likert-Importance"
        },
        {
          "number": 90,
          "question": "Rank these cultural safety factors from most to least important: Cultural acceptance, LGBTQ+ safety, Women's safety, Religious freedom, Political stability",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Overall Safety Priorities & Deal-Breakers",
      "questionRange": "Q91-Q100",
      "questions": [
        {
          "number": 91,
          "question": "How much are you willing to invest personally in security measures (home security systems, private guards, insurance) per month?",
          "type": "Range"
        },
        {
          "number": 92,
          "question": "How important is access to safety training and education programs (self-defense, first aid, disaster preparedness) in your area?",
          "type": "Likert-Importance"
        },
        {
          "number": 93,
          "question": "On a scale of 0-100, how would you rank overall safety as a priority compared to all other relocation factors?",
          "type": "Slider"
        },
        {
          "number": 94,
          "question": "How frequently would you review and adjust your personal safety measures after relocating?",
          "type": "Likert-Frequency"
        },
        {
          "number": 95,
          "question": "How important is it that your destination meets international safety and security standards (Global Peace Index top 30, low terrorism risk)?",
          "type": "Likert-Importance"
        },
        {
          "number": 96,
          "question": "Which safety issues are absolute dealbreakers that would eliminate a destination? (Select all that apply: active conflict/war, high violent crime, terrorism risk, police corruption, no emergency services, political instability, no foreigner protections)",
          "type": "Multi-select"
        },
        {
          "number": 97,
          "question": "Which safety features are non-negotiable must-haves? (Select all that apply: reliable emergency services, low violent crime, stable government, safe public transit, clean drinking water, enforced building codes, data privacy laws)",
          "type": "Multi-select"
        },
        {
          "number": 98,
          "question": "How willing are you to accept slightly lower safety standards in exchange for other benefits (lower cost of living, better climate, cultural richness)?",
          "type": "Likert-Willingness"
        },
        {
          "number": 99,
          "question": "How important is it that your destination is trending toward improved safety and security over the next 5-10 years?",
          "type": "Likert-Importance"
        },
        {
          "number": 100,
          "question": "Rank these overall safety categories from most to least important for your relocation: Crime & personal safety, Emergency services, Law enforcement, Community safety, Transportation safety, Environmental hazards, Cybersecurity, Cultural & social safety, Medical emergency infrastructure, Overall safety investment",
          "type": "Ranking"
        }
      ]
    }
  ]
};

import type { QuestionModule } from './types';

// General Questions — 50 questions
// Module ID: general_questions

export const generalQuestionsQuestions: QuestionModule = {
  "moduleId": "general_questions",
  "moduleName": "General Questions",
  "fileName": "GENERAL_QUESTIONS_REFERENCE.md",
  "structure": "",
  "totalQuestions": 50,
  "sections": [
    {
      "title": "Household & Decision Dynamics",
      "questionRange": "Q1-Q5",
      "questions": [
        {
          "number": 1,
          "question": "Who is the primary decision-maker for this relocation? (Select one: myself alone, myself and partner equally, primarily my partner, family consensus, other)",
          "type": "Single-select"
        },
        {
          "number": 2,
          "question": "How aligned is your partner/household on relocation priorities?",
          "type": "Slider",
          "sliderLeft": "Not at all aligned",
          "sliderRight": "Perfectly aligned"
        },
        {
          "number": 3,
          "question": "What regions, countries, or cities are you most drawn to — and which have you already visited or lived in?",
          "type": "Text"
        },
        {
          "number": 4,
          "question": "Do you have family obligations that affect where you can relocate?",
          "type": "Yes/No"
        },
        {
          "number": 5,
          "question": "What type of family obligations do you have, and how often must you travel for them?",
          "type": "Text"
        }
      ]
    },
    {
      "title": "Personality & Psychology",
      "questionRange": "Q6-Q12",
      "questions": [
        {
          "number": 6,
          "question": "How do you approach risk in life decisions? (Select one: very cautious, somewhat cautious, balanced, somewhat adventurous, very adventurous)",
          "type": "Single-select"
        },
        {
          "number": 7,
          "question": "How do you handle uncertainty and change? (Select one: need stability, prefer predictability, adaptable, thrive on change, seek disruption)",
          "type": "Single-select"
        },
        {
          "number": 8,
          "question": "What is the PRIMARY reason driving your relocation? (Select one: career opportunity, lifestyle change, retirement, cost savings, family reunification, escape/fresh start, adventure, relationship, health/climate, safety, political instability, religious/cultural freedom, education, tax optimization, digital nomad lifestyle, other)",
          "type": "Single-select"
        },
        {
          "number": 9,
          "question": "What is your overall risk tolerance for major life changes?",
          "type": "Slider",
          "sliderLeft": "Very risk-averse",
          "sliderRight": "Very risk-tolerant"
        },
        {
          "number": 10,
          "question": "What is your openness to lifestyle experimentation?",
          "type": "Slider",
          "sliderLeft": "Not open at all",
          "sliderRight": "Completely open"
        },
        {
          "number": 11,
          "question": "What pace of life do you prefer? (Select one: very slow/relaxed, slow/easygoing, moderate, fast-paced, intense/high-energy)",
          "type": "Single-select"
        },
        {
          "number": 12,
          "question": "What is your preferred social style? (Select one: mostly solitary, small intimate circle, moderate social life, very social/outgoing, extroverted/always connecting)",
          "type": "Single-select"
        }
      ]
    },
    {
      "title": "Readiness & Key Priorities",
      "questionRange": "Q13-Q17",
      "questions": [
        {
          "number": 13,
          "question": "What is your international living experience? (Select one: never lived abroad, short stays only <6 months, lived abroad 1-3 years, lived abroad 3+ years, serial expat/multiple countries)",
          "type": "Single-select"
        },
        {
          "number": 14,
          "question": "How important is your religious or spiritual practice to your daily life?",
          "type": "Likert-Importance"
        },
        {
          "number": 15,
          "question": "If you could split your monthly budget any way you wanted, what percentage would go to housing, food, entertainment, travel, savings, and healthcare?",
          "type": "Text"
        },
        {
          "number": 16,
          "question": "What are your biggest relocation fears? (Select all that apply: loneliness/isolation, language barriers, career setback, financial loss, culture shock, safety concerns, healthcare access, missing family, bureaucracy, failure/regret)",
          "type": "Multi-select"
        },
        {
          "number": 17,
          "question": "Do you prefer the familiar or the adventurous?",
          "type": "Slider",
          "sliderLeft": "Strongly prefer familiar",
          "sliderRight": "Strongly prefer adventurous"
        }
      ]
    },
    {
      "title": "Cultural Adaptation & Integration",
      "questionRange": "Q18-Q23",
      "questions": [
        {
          "number": 18,
          "question": "What is your tolerance for cultural differences?",
          "type": "Slider",
          "sliderLeft": "Low tolerance",
          "sliderRight": "Very high tolerance"
        },
        {
          "number": 19,
          "question": "What is your comfort level with language barriers?",
          "type": "Slider",
          "sliderLeft": "Very uncomfortable",
          "sliderRight": "Very comfortable"
        },
        {
          "number": 20,
          "question": "Do you prefer expat communities or full local integration?",
          "type": "Slider",
          "sliderLeft": "Expat community",
          "sliderRight": "Full local integration"
        },
        {
          "number": 21,
          "question": "What is your expected timeline for feeling socially integrated? (Select one: 1-3 months, 3-6 months, 6-12 months, 1-2 years, 2+ years)",
          "type": "Single-select"
        },
        {
          "number": 22,
          "question": "How interested are you in cultural bridge-building and exchange?",
          "type": "Slider",
          "sliderLeft": "Not interested",
          "sliderRight": "Extremely interested"
        },
        {
          "number": 23,
          "question": "How willing are you to adapt to different social norms?",
          "type": "Slider",
          "sliderLeft": "Not willing at all",
          "sliderRight": "Completely willing"
        }
      ]
    },
    {
      "title": "Social Identity & Community",
      "questionRange": "Q24-Q30",
      "questions": [
        {
          "number": 24,
          "question": "How would you describe your ideal social environment? (Select one: quiet/private, small close-knit community, active neighborhood, bustling urban life, cosmopolitan hub)",
          "type": "Single-select"
        },
        {
          "number": 25,
          "question": "How comfortable are you attending large social events versus intimate gatherings?",
          "type": "Slider",
          "sliderLeft": "Prefer intimate gatherings",
          "sliderRight": "Prefer large social events"
        },
        {
          "number": 26,
          "question": "What specific communities, hobbies, or subcultures do you NEED access to in order to feel fulfilled?",
          "type": "Text"
        },
        {
          "number": 27,
          "question": "How important is it that your neighborhood has people in a similar life stage to yours (young professionals, families, retirees)?",
          "type": "Likert-Importance"
        },
        {
          "number": 28,
          "question": "How private or open do you prefer to be within your community?",
          "type": "Slider",
          "sliderLeft": "Very private",
          "sliderRight": "Very open"
        },
        {
          "number": 29,
          "question": "What social support systems do you need to thrive? (Select all that apply: religious community, professional network, parent groups, hobby/interest clubs, expat community, mental health support, volunteer organizations, none specific)",
          "type": "Multi-select"
        },
        {
          "number": 30,
          "question": "How important is building local community roots versus maintaining a transient/flexible lifestyle?",
          "type": "Likert-Importance"
        }
      ]
    },
    {
      "title": "Lifestyle Philosophy",
      "questionRange": "Q31-Q36",
      "questions": [
        {
          "number": 31,
          "question": "What is your stance on work-life balance?",
          "type": "Slider",
          "sliderLeft": "Work-focused",
          "sliderRight": "Life-focused"
        },
        {
          "number": 32,
          "question": "How do you prefer to spend your weekends? (Select one: relaxing at home, outdoor activities, social events, cultural exploration, travel/day trips, mix of everything)",
          "type": "Single-select"
        },
        {
          "number": 33,
          "question": "What is your ideal noise level environment?",
          "type": "Slider",
          "sliderLeft": "Very quiet",
          "sliderRight": "Very lively"
        },
        {
          "number": 34,
          "question": "What is your ideal community size? (Select one: village <5,000, small town 5K-50K, mid-size city 50K-500K, large city 500K-2M, mega city 2M+)",
          "type": "Single-select"
        },
        {
          "number": 35,
          "question": "How do seasonal changes affect your mood and activity level?",
          "type": "Likert-Concern"
        },
        {
          "number": 36,
          "question": "How important is environmental sustainability to your lifestyle?",
          "type": "Likert-Importance"
        }
      ]
    },
    {
      "title": "Vision, Planning & Living Preferences",
      "questionRange": "Q37-Q44",
      "questions": [
        {
          "number": 37,
          "question": "What are your long-term settlement plans? (Select one: permanent relocation, 5-10 years, 2-5 years, 1-2 years, exploring/undecided)",
          "type": "Single-select"
        },
        {
          "number": 38,
          "question": "Are your intentions temporary or permanent? (Select one: definitely permanent, leaning permanent, truly undecided, leaning temporary, definitely temporary)",
          "type": "Single-select"
        },
        {
          "number": 39,
          "question": "How important is having an exit strategy or reversible plan?",
          "type": "Likert-Importance"
        },
        {
          "number": 40,
          "question": "What is your retirement timeline consideration? (Select one: already retired, retiring within 5 years, 5-15 years, 15+ years, not a factor)",
          "type": "Single-select"
        },
        {
          "number": 41,
          "question": "How important is access to cuisine and food culture that matches your preferences?",
          "type": "Likert-Importance"
        },
        {
          "number": 42,
          "question": "What is your settling period tolerance — how long before you expect to feel at home? (Select one: 1-3 months, 3-6 months, 6-12 months, 1-2 years, 2+ years)",
          "type": "Single-select"
        },
        {
          "number": 43,
          "question": "What is your backup plan approach if things don't work out? (Select one: return home, try another country, move to a different city, adapt and stay, no backup plan)",
          "type": "Single-select"
        },
        {
          "number": 44,
          "question": "What type of dwelling do you prefer to live in? (Select one: detached house, townhouse/row house, apartment/condo, villa/estate, tiny home/alternative, no strong preference)",
          "type": "Single-select"
        }
      ]
    },
    {
      "title": "Lifestyle & Values Preferences",
      "questionRange": "Q45-Q50",
      "questions": [
        {
          "number": 45,
          "question": "What setting do you prefer to live in? (Select one: urban core/city center, inner suburb, outer suburb, small town/rural, remote/off-grid)",
          "type": "Single-select"
        },
        {
          "number": 46,
          "question": "How important is it that local firearm and weapon laws align with your personal views?",
          "type": "Likert-Importance"
        },
        {
          "number": 47,
          "question": "How important is access to live music, performing arts, and entertainment or nightlife?",
          "type": "Likert-Importance"
        },
        {
          "number": 48,
          "question": "How important is access to sports, fitness facilities, and outdoor recreation?",
          "type": "Likert-Importance"
        },
        {
          "number": 49,
          "question": "How important is LGBTQ+ acceptance and legal protections in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 50,
          "question": "How important is it that your destination's political and social values broadly align with your own?",
          "type": "Likert-Importance"
        }
      ]
    }
  ]
};

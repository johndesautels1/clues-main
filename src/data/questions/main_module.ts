import type { QuestionModule } from './types';

// Main Module — 100 questions
// Module ID: main_module

export const mainModuleQuestions: QuestionModule = {
  "moduleId": "main_module",
  "moduleName": "Main Module",
  "fileName": "MAIN_MODULE_QUESTIONS.md",
  "structure": "3 sections — Demographics (34Q), Do Not Wants (33Q), Must Haves (33Q)",
  "totalQuestions": 100,
  "sections": [
    {
      "title": "Demographics",
      "questionRange": "Q1-Q34",
      "questions": [
        {
          "number": 1,
          "question": "What is your nationality or primary citizenship? (Select one: United States, United Kingdom, Canada, Australia, Germany, France, Italy, Spain, Portugal, Ireland, Netherlands, Sweden, Switzerland, Mexico, Brazil, Argentina, Israel, South Africa, New Zealand, India, Japan, South Korea, Singapore, Other)",
          "type": "Single-select"
        },
        {
          "number": 2,
          "question": "Do you hold dual or multiple citizenships? If yes, which countries? (Select all that apply: United States, United Kingdom, Canada, Australia, Germany, France, Italy, Spain, Portugal, Ireland, Netherlands, Sweden, Switzerland, Mexico, Brazil, Argentina, Israel, South Africa, New Zealand, India, Japan, South Korea, Singapore, Other)",
          "type": "Multi-select"
        },
        {
          "number": 3,
          "question": "What is your current country of residence? (Select one: United States, United Kingdom, Canada, Australia, Germany, France, Italy, Spain, Portugal, Ireland, Netherlands, Sweden, Switzerland, Mexico, Brazil, Argentina, Israel, South Africa, New Zealand, India, Japan, South Korea, Singapore, Other)",
          "type": "Single-select"
        },
        {
          "number": 4,
          "question": "What is your age range? (Select one: 18-24, 25-34, 35-44, 45-54, 55-64, 65-74, 75+)",
          "type": "Single-select"
        },
        {
          "number": 5,
          "question": "What is your current relationship status? (Select one: single, in a relationship, married, domestic partnership, divorced, widowed)",
          "type": "Single-select"
        },
        {
          "number": 6,
          "question": "Will your partner/spouse relocate with you?",
          "type": "Yes/No"
        },
        {
          "number": 7,
          "question": "Does your partner/spouse need work authorization in the new location?",
          "type": "Yes/No"
        },
        {
          "number": 8,
          "question": "Do you have children?",
          "type": "Yes/No"
        },
        {
          "number": 9,
          "question": "What are your children's age ranges? (Select all that apply: infant 0-2, toddler 3-5, elementary 6-10, middle school 11-13, high school 14-17, adult 18+)",
          "type": "Multi-select"
        },
        {
          "number": 10,
          "question": "Will all children relocate with you?",
          "type": "Yes/No"
        },
        {
          "number": 11,
          "question": "Do any of your children have special educational or medical needs?",
          "type": "Yes/No"
        },
        {
          "number": 12,
          "question": "What is your highest level of education completed? (Select one: high school, trade/vocational, associate's, bachelor's, master's, doctorate, professional degree)",
          "type": "Single-select"
        },
        {
          "number": 13,
          "question": "Are you involved in a skilled trade? If so, select your trade area. (Select all that apply: electrician, plumber, carpenter, welder, HVAC, automotive, machinist, construction, culinary/chef, cosmetology, medical technician, not applicable)",
          "type": "Multi-select"
        },
        {
          "number": 14,
          "question": "Are you currently or formerly in the military?",
          "type": "Yes/No"
        },
        {
          "number": 15,
          "question": "Do you need access to military or veteran services in your new location?",
          "type": "Yes/No"
        },
        {
          "number": 16,
          "question": "What is your current employment status? (Select all that apply: employed full-time, employed part-time, self-employed, business owner, retired, unemployed, student)",
          "type": "Multi-select"
        },
        {
          "number": 17,
          "question": "What is your employment plan in your new location? (Select all that apply: seeking local employment, remote work, self-employed, business owner, retired, undecided)",
          "type": "Multi-select"
        },
        {
          "number": 18,
          "question": "What is your primary industry or professional field? (Select one: technology/IT, finance/banking, healthcare/medical, education, legal, engineering, real estate, hospitality/tourism, media/entertainment, marketing/advertising, consulting, manufacturing, retail/e-commerce, agriculture, government/public sector, non-profit, construction, transportation/logistics, energy/utilities, arts/creative, other)",
          "type": "Single-select"
        },
        {
          "number": 19,
          "question": "What is your preferred work arrangement? (Select one: fully remote, hybrid, in-office, freelance, retired)",
          "type": "Single-select"
        },
        {
          "number": 20,
          "question": "What is your annual household income in USD? (Select one: under $25k, $25k-$50k, $50k-$75k, $75k-$100k, $100k-$150k, $150k-$200k, $200k-$300k, $300k-$500k, $500k+, prefer not to say)",
          "type": "Single-select"
        },
        {
          "number": 21,
          "question": "What percentage of your current income could you maintain if you relocated internationally? (Select one: 0-25%, 25-50%, 50-75%, 75-100%, 100%+, unsure)",
          "type": "Single-select"
        },
        {
          "number": 22,
          "question": "What is your current housing situation? (Select one: own, rent, live with family, other)",
          "type": "Single-select"
        },
        {
          "number": 23,
          "question": "What is your current monthly housing cost in USD? (Select one: under $500, $500-$1000, $1000-$1500, $1500-$2000, $2000-$3000, $3000-$5000, $5000-$7500, $7500-$10000, $10000+)",
          "type": "Single-select"
        },
        {
          "number": 24,
          "question": "How many bedrooms do you need in your new home? (Select one: studio, 1, 2, 3, 4, 5+)",
          "type": "Single-select"
        },
        {
          "number": 25,
          "question": "What type of area do you currently live in? (Select one: urban core, suburban, small town, rural)",
          "type": "Single-select"
        },
        {
          "number": 26,
          "question": "What is the approximate population of your current city or town? (Select one: under 10k, 10k-50k, 50k-100k, 100k-250k, 250k-500k, 500k-1 million, 1-5 million, 5 million+)",
          "type": "Single-select"
        },
        {
          "number": 27,
          "question": "Do you have any chronic health conditions or special medical requirements?",
          "type": "Yes/No"
        },
        {
          "number": 28,
          "question": "What specific medical conditions require ongoing treatment or specialist access? (Select all that apply: cardiovascular, respiratory, diabetes, autoimmune, neurological, orthopedic, mental health, cancer/oncology, none)",
          "type": "Multi-select"
        },
        {
          "number": 29,
          "question": "What is your primary mode of daily transportation today? (Select one: personal car, public transit, bicycle, walking, ride-hailing, motorcycle, combination)",
          "type": "Single-select"
        },
        {
          "number": 30,
          "question": "Do you have pets that would relocate with you?",
          "type": "Yes/No"
        },
        {
          "number": 31,
          "question": "What type and how many pets do you have? (Select all that apply: dog(s), cat(s), bird(s), reptile(s), fish, small mammals, exotic pets, none)",
          "type": "Multi-select"
        },
        {
          "number": 32,
          "question": "Are any of your pets a breed that faces import restrictions in certain countries?",
          "type": "Yes/No"
        },
        {
          "number": 33,
          "question": "Which languages do you speak fluently? (Select all that apply: English, Spanish, French, German, Portuguese, Italian, Dutch, Mandarin, Japanese, Korean, Arabic, Hindi, Russian, Turkish, Swedish, Polish, Thai, Vietnamese, Hebrew, Other)",
          "type": "Multi-select"
        },
        {
          "number": 34,
          "question": "What is your relocation timeline? (Select one: immediate, 6 months, 1-2 years, 2+ years, exploring/no timeline)",
          "type": "Single-select"
        }
      ]
    },
    {
      "title": "Do Not Wants — Deal-Breakers",
      "questionRange": "Q35-Q67",
      "questions": [
        {
          "number": 35,
          "question": "How much do you want to avoid extreme heat (regularly over 35C / 95F)?",
          "type": "Dealbreaker"
        },
        {
          "number": 36,
          "question": "How much do you want to avoid extreme cold (regularly below -10C / 14F)?",
          "type": "Dealbreaker"
        },
        {
          "number": 37,
          "question": "How much do you want to avoid high humidity and tropical climate conditions?",
          "type": "Dealbreaker"
        },
        {
          "number": 38,
          "question": "How much do you want to avoid significant natural disaster risks (earthquakes, hurricanes, floods, wildfires)?",
          "type": "Dealbreaker"
        },
        {
          "number": 39,
          "question": "How much do you want to avoid severe air pollution (regularly unhealthy air quality)?",
          "type": "Dealbreaker"
        },
        {
          "number": 40,
          "question": "How much do you want to avoid severe water quality or water shortage issues?",
          "type": "Dealbreaker"
        },
        {
          "number": 41,
          "question": "How much do you want to avoid language barriers you cannot overcome?",
          "type": "Dealbreaker"
        },
        {
          "number": 42,
          "question": "How much do you want to avoid living under restrictive social or religious laws?",
          "type": "Dealbreaker"
        },
        {
          "number": 43,
          "question": "How much do you want to avoid a lack of diversity or a monocultural environment?",
          "type": "Dealbreaker"
        },
        {
          "number": 44,
          "question": "How much do you want to avoid hostile attitudes toward foreigners or immigrants?",
          "type": "Dealbreaker"
        },
        {
          "number": 45,
          "question": "How much do you want to avoid gender-based or LGBTQ+ discrimination?",
          "type": "Dealbreaker"
        },
        {
          "number": 46,
          "question": "How much do you want to avoid religious intolerance or persecution?",
          "type": "Dealbreaker"
        },
        {
          "number": 47,
          "question": "How much do you want to avoid a poor or inaccessible healthcare system?",
          "type": "Dealbreaker"
        },
        {
          "number": 48,
          "question": "How much do you want to avoid unreliable infrastructure (power outages, poor roads, inconsistent utilities)?",
          "type": "Dealbreaker"
        },
        {
          "number": 49,
          "question": "How much do you want to avoid poor internet and telecommunications reliability?",
          "type": "Dealbreaker"
        },
        {
          "number": 50,
          "question": "How much do you want to avoid high taxes without adequate public services in return?",
          "type": "Dealbreaker"
        },
        {
          "number": 51,
          "question": "How much do you want to avoid a high cost of living that is not matched by quality of life?",
          "type": "Dealbreaker"
        },
        {
          "number": 52,
          "question": "How much do you want to avoid an unstable economy and volatile currency?",
          "type": "Dealbreaker"
        },
        {
          "number": 53,
          "question": "How much do you want to avoid living under an authoritarian or non-democratic government?",
          "type": "Dealbreaker"
        },
        {
          "number": 54,
          "question": "How much do you want to avoid systemic corruption and an unreliable legal system?",
          "type": "Dealbreaker"
        },
        {
          "number": 55,
          "question": "How much do you want to avoid political instability or civil unrest?",
          "type": "Dealbreaker"
        },
        {
          "number": 56,
          "question": "How much do you want to avoid high crime rates and personal safety concerns?",
          "type": "Dealbreaker"
        },
        {
          "number": 57,
          "question": "How much do you want to avoid a lack of personal safety for women and minorities?",
          "type": "Dealbreaker"
        },
        {
          "number": 58,
          "question": "How much do you want to avoid complex visa or residency complications?",
          "type": "Dealbreaker"
        },
        {
          "number": 59,
          "question": "How much do you want to avoid a car-dependent lifestyle with no viable alternatives?",
          "type": "Dealbreaker"
        },
        {
          "number": 60,
          "question": "How much do you want to avoid poor public transportation options?",
          "type": "Dealbreaker"
        },
        {
          "number": 61,
          "question": "How much do you want to avoid a lack of career or professional opportunities?",
          "type": "Dealbreaker"
        },
        {
          "number": 62,
          "question": "How much do you want to avoid lacking access to specific foods, products, or dietary needs?",
          "type": "Dealbreaker"
        },
        {
          "number": 63,
          "question": "How much do you want to avoid isolation from family and close friends?",
          "type": "Dealbreaker"
        },
        {
          "number": 64,
          "question": "How much do you want to avoid limited education options for your children?",
          "type": "Dealbreaker"
        },
        {
          "number": 65,
          "question": "How much do you want to avoid limited access to international airports and travel connectivity?",
          "type": "Dealbreaker"
        },
        {
          "number": 66,
          "question": "How much do you want to avoid excessive noise pollution or severe overcrowding?",
          "type": "Dealbreaker"
        },
        {
          "number": 67,
          "question": "How much do you want to avoid a lack of outdoor recreation, parks, and green spaces?",
          "type": "Dealbreaker"
        }
      ]
    },
    {
      "title": "Must Haves — Non-Negotiables",
      "questionRange": "Q68-Q100",
      "questions": [
        {
          "number": 68,
          "question": "How important is it that English (or your primary language) is widely spoken?",
          "type": "Likert-Importance"
        },
        {
          "number": 69,
          "question": "How important is a welcoming attitude toward newcomers and foreigners?",
          "type": "Likert-Importance"
        },
        {
          "number": 70,
          "question": "How important is having job opportunities available in your professional field?",
          "type": "Likert-Importance"
        },
        {
          "number": 71,
          "question": "How important is the ability to legally work in your new location?",
          "type": "Likert-Importance"
        },
        {
          "number": 72,
          "question": "How important is a reasonable and affordable cost of living?",
          "type": "Likert-Importance"
        },
        {
          "number": 73,
          "question": "How important is affordable housing availability (rent or purchase)?",
          "type": "Likert-Importance"
        },
        {
          "number": 74,
          "question": "How important is a stable economy and reliable currency?",
          "type": "Likert-Importance"
        },
        {
          "number": 75,
          "question": "How important is strong legal protection for foreigners and property rights?",
          "type": "Likert-Importance"
        },
        {
          "number": 76,
          "question": "How important is access to quality healthcare and medical facilities?",
          "type": "Likert-Importance"
        },
        {
          "number": 77,
          "question": "How important is a low crime rate and strong personal safety?",
          "type": "Likert-Importance"
        },
        {
          "number": 78,
          "question": "How important is political stability and democratic governance?",
          "type": "Likert-Importance"
        },
        {
          "number": 79,
          "question": "How important is a clean environment (air, water, streets)?",
          "type": "Likert-Importance"
        },
        {
          "number": 80,
          "question": "How important is good air quality for daily life and outdoor activities?",
          "type": "Likert-Importance"
        },
        {
          "number": 81,
          "question": "How important is reliable high-speed internet and modern telecommunications?",
          "type": "Likert-Importance"
        },
        {
          "number": 82,
          "question": "How important is reliable utilities infrastructure (electricity, water, gas)?",
          "type": "Likert-Importance"
        },
        {
          "number": 83,
          "question": "How important is good public transportation and transit options?",
          "type": "Likert-Importance"
        },
        {
          "number": 84,
          "question": "How important are walkable neighborhoods where daily needs are nearby?",
          "type": "Likert-Importance"
        },
        {
          "number": 85,
          "question": "How important is proximity to an international airport with good connections?",
          "type": "Likert-Importance"
        },
        {
          "number": 86,
          "question": "How important is access to outdoor recreation, nature, and green spaces?",
          "type": "Likert-Importance"
        },
        {
          "number": 87,
          "question": "How important is a vibrant food scene with diverse dining options?",
          "type": "Likert-Importance"
        },
        {
          "number": 88,
          "question": "How important is access to cultural activities (museums, theater, arts)?",
          "type": "Likert-Importance"
        },
        {
          "number": 89,
          "question": "How important is access to fitness facilities and sports infrastructure?",
          "type": "Likert-Importance"
        },
        {
          "number": 90,
          "question": "How important is nightlife and entertainment options?",
          "type": "Likert-Importance"
        },
        {
          "number": 91,
          "question": "How important is a good education system (for you or your children)?",
          "type": "Likert-Importance"
        },
        {
          "number": 92,
          "question": "How important is access to professional networking and career development?",
          "type": "Likert-Importance"
        },
        {
          "number": 93,
          "question": "How important is a family-friendly environment with child-oriented resources?",
          "type": "Likert-Importance"
        },
        {
          "number": 94,
          "question": "How important is an expat or international community in your new location?",
          "type": "Likert-Importance"
        },
        {
          "number": 95,
          "question": "How important is access to your religious or spiritual community?",
          "type": "Likert-Importance"
        },
        {
          "number": 96,
          "question": "How important is a pet-friendly environment (parks, vets, pet-friendly housing)?",
          "type": "Likert-Importance"
        },
        {
          "number": 97,
          "question": "How important is a climate and weather pattern that suits your lifestyle preferences?",
          "type": "Likert-Importance"
        },
        {
          "number": 98,
          "question": "How important is the overall happiness and life satisfaction of residents in your prospective city?",
          "type": "Likert-Importance"
        },
        {
          "number": 99,
          "question": "How important is it that the community actively embraces diversity and inclusion?",
          "type": "Likert-Importance"
        },
        {
          "number": 100,
          "question": "How important is proximity to family, friends, or an existing support network?",
          "type": "Likert-Importance"
        }
      ]
    }
  ]
};

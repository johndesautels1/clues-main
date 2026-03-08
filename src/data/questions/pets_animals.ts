import type { QuestionModule } from './types';

// Pets & Animals — 100 questions
// Module ID: pets_animals

export const petsAnimalsQuestions: QuestionModule = {
  "moduleId": "pets_animals",
  "moduleName": "Pets & Animals",
  "fileName": "PETS_ANIMALS_QUESTIONS.md",
  "structure": "10 sections x 10 questions, each ending with a ranking question + 1 final master ranking (Q100)",
  "totalQuestions": 100,
  "sections": [
    {
      "title": "Current Pet Ownership & Plans",
      "questionRange": "Q1-Q10",
      "questions": [
        {
          "number": 1,
          "question": "Do you currently own pets that will relocate with you?",
          "type": "Yes/No"
        },
        {
          "number": 2,
          "question": "What types of pets do you currently have? (Select all that apply)",
          "type": "Multi-select"
        },
        {
          "number": 3,
          "question": "How many pets will you be bringing to your new destination?",
          "type": "Range"
        },
        {
          "number": 4,
          "question": "Do you plan to adopt or purchase new pets after relocating?",
          "type": "Yes/No/Maybe"
        },
        {
          "number": 5,
          "question": "What dog breeds do you own or plan to own? (Relevant for breed-specific legislation)",
          "type": "Multi-select"
        },
        {
          "number": 6,
          "question": "Do any of your pets have special medical conditions requiring ongoing veterinary care?",
          "type": "Yes/No + details"
        },
        {
          "number": 7,
          "question": "Are any of your pets classified as exotic or non-traditional (reptiles, birds, ferrets, etc.)?",
          "type": "Yes/No"
        },
        {
          "number": 8,
          "question": "How would you describe your relationship with your pets?",
          "type": "Attachment scale"
        },
        {
          "number": 9,
          "question": "Would breed-specific legislation banning your dog's breed be a dealbreaker for a destination?",
          "type": "Dealbreaker"
        },
        {
          "number": 10,
          "question": "Rank these pet ownership factors from most to least important: Breed legality, Pet import ease, Veterinary access, Pet-friendly housing, Exotic pet regulations",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Pet Import & Relocation Logistics",
      "questionRange": "Q11-Q20",
      "questions": [
        {
          "number": 11,
          "question": "How concerned are you about the complexity of international pet import regulations?",
          "type": "Concern scale"
        },
        {
          "number": 12,
          "question": "Are your pets' vaccinations and health certificates up to date for international travel?",
          "type": "Yes/No/In progress"
        },
        {
          "number": 13,
          "question": "How important is a destination with straightforward, non-quarantine pet import policies?",
          "type": "Likert-Importance"
        },
        {
          "number": 14,
          "question": "Would a mandatory quarantine period (e.g., 30-180 days) for pets disqualify a destination?",
          "type": "Dealbreaker"
        },
        {
          "number": 15,
          "question": "Do you need professional pet relocation services (pet shipping companies)?",
          "type": "Yes/No/Maybe"
        },
        {
          "number": 16,
          "question": "What is the maximum you would spend on pet relocation costs?",
          "type": "Budget range"
        },
        {
          "number": 17,
          "question": "How important is direct flight availability (no layovers) for pet transport to your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 18,
          "question": "Do you need airlines that allow in-cabin pet travel versus cargo hold?",
          "type": "Single-select"
        },
        {
          "number": 19,
          "question": "How important is the availability of pet-specific customs brokers or relocation consultants?",
          "type": "Likert-Importance"
        },
        {
          "number": 20,
          "question": "Rank these import factors from most to least important: No quarantine policy, Import simplicity, Direct flight options, Relocation service availability, Cost of relocation",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Veterinary Care & Pet Health",
      "questionRange": "Q21-Q30",
      "questions": [
        {
          "number": 21,
          "question": "How important is access to high-quality veterinary clinics near your home?",
          "type": "Likert-Importance"
        },
        {
          "number": 22,
          "question": "Do you need veterinary specialists (oncology, orthopedics, cardiology, dermatology)?",
          "type": "Yes/No + specialties"
        },
        {
          "number": 23,
          "question": "How important is 24-hour emergency veterinary care availability?",
          "type": "Likert-Importance"
        },
        {
          "number": 24,
          "question": "Do you need access to veterinary dentistry services?",
          "type": "Yes/No"
        },
        {
          "number": 25,
          "question": "How important is the availability of modern veterinary diagnostic equipment (MRI, CT, ultrasound)?",
          "type": "Likert-Importance"
        },
        {
          "number": 26,
          "question": "Do you use holistic or alternative veterinary treatments (acupuncture, chiropractic, herbal)?",
          "type": "Yes/No"
        },
        {
          "number": 27,
          "question": "How important is affordable veterinary care in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 28,
          "question": "Do you carry pet health insurance? How important is pet insurance availability?",
          "type": "Likert-Importance"
        },
        {
          "number": 29,
          "question": "How important is the quality of preventive care (flea/tick treatment, heartworm prevention) for your region's climate?",
          "type": "Likert-Importance"
        },
        {
          "number": 30,
          "question": "Rank these veterinary factors from most to least important: Clinic proximity, Emergency 24/7 access, Specialist availability, Affordability, Pet insurance options",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Pet-Friendly Housing & Neighborhoods",
      "questionRange": "Q31-Q40",
      "questions": [
        {
          "number": 31,
          "question": "How difficult is it to find pet-friendly rental housing in your current area?",
          "type": "Difficulty scale"
        },
        {
          "number": 32,
          "question": "Do you need rental properties that accept large dogs (over 25 kg/55 lbs)?",
          "type": "Yes/No"
        },
        {
          "number": 33,
          "question": "How important is the absence of pet deposits, pet rent, or breed restrictions in housing?",
          "type": "Likert-Importance"
        },
        {
          "number": 34,
          "question": "Do you need a property with a private yard or garden for your pets?",
          "type": "Yes/No"
        },
        {
          "number": 35,
          "question": "How important is proximity to off-leash dog parks or designated pet exercise areas?",
          "type": "Likert-Importance"
        },
        {
          "number": 36,
          "question": "Do you need pet-friendly apartment buildings with amenities (pet washing stations, dog runs)?",
          "type": "Yes/No"
        },
        {
          "number": 37,
          "question": "How important is the overall pet-friendliness of the neighborhood (other pet owners, pet stores nearby)?",
          "type": "Likert-Importance"
        },
        {
          "number": 38,
          "question": "Would you accept a smaller or more expensive home to live in a more pet-friendly area?",
          "type": "Slider"
        },
        {
          "number": 39,
          "question": "How important is access to pet-sitting, dog-walking, or doggy daycare services?",
          "type": "Likert-Importance"
        },
        {
          "number": 40,
          "question": "Rank these housing factors from most to least important: Pet-friendly rental availability, Yard/garden space, Dog park proximity, Breed restriction freedom, Pet services nearby",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Pet-Friendly Public Spaces & Transportation",
      "questionRange": "Q41-Q50",
      "questions": [
        {
          "number": 41,
          "question": "How important is the ability to bring your dog to outdoor restaurants, cafes, and patios?",
          "type": "Likert-Importance"
        },
        {
          "number": 42,
          "question": "Do you need access to pet-friendly beaches, hiking trails, or nature areas?",
          "type": "Yes/No"
        },
        {
          "number": 43,
          "question": "How important is the ability to take pets on public transportation (buses, trains, metro)?",
          "type": "Likert-Importance"
        },
        {
          "number": 44,
          "question": "Do you need pet-friendly ride-sharing or taxi services?",
          "type": "Yes/No"
        },
        {
          "number": 45,
          "question": "How important is access to pet-friendly hotels and accommodations for domestic travel?",
          "type": "Likert-Importance"
        },
        {
          "number": 46,
          "question": "How do you feel about leash laws and muzzle requirements in public spaces?",
          "type": "Single-select"
        },
        {
          "number": 47,
          "question": "How important is the availability of dog-friendly shopping areas and stores?",
          "type": "Likert-Importance"
        },
        {
          "number": 48,
          "question": "Do you need access to swimming areas or water features safe for dogs?",
          "type": "Yes/No"
        },
        {
          "number": 49,
          "question": "How open are you to adapting to local pet culture (indoor vs. outdoor pets, attitudes toward animals)? CULTURAL FLEX",
          "type": "Slider"
        },
        {
          "number": 50,
          "question": "Rank these public space factors from most to least important: Restaurant/cafe pet access, Beach and trail access, Public transit pet policy, Dog-friendly retail, Leash law flexibility",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Pet Supplies & Services",
      "questionRange": "Q51-Q60",
      "questions": [
        {
          "number": 51,
          "question": "How important is access to premium pet food brands you currently use?",
          "type": "Likert-Importance"
        },
        {
          "number": 52,
          "question": "Do you need specialty pet food (raw diet, prescription, grain-free, organic)?",
          "type": "Yes/No + type"
        },
        {
          "number": 53,
          "question": "How important is the availability of large pet supply stores (PetSmart, Petco equivalents)?",
          "type": "Likert-Importance"
        },
        {
          "number": 54,
          "question": "Do you need professional pet grooming services? How often?",
          "type": "Likert-Frequency"
        },
        {
          "number": 55,
          "question": "How important is access to professional dog training and obedience classes?",
          "type": "Likert-Importance"
        },
        {
          "number": 56,
          "question": "Do you use doggy daycare or boarding facilities? How important is their availability?",
          "type": "Likert-Importance"
        },
        {
          "number": 57,
          "question": "How important is access to pet-specific e-commerce and home delivery for supplies?",
          "type": "Likert-Importance"
        },
        {
          "number": 58,
          "question": "Do you need access to specialized pet services (pet photography, pet massage, pet behaviorists)?",
          "type": "Yes/No"
        },
        {
          "number": 59,
          "question": "How important is the affordability of pet supplies compared to your current location?",
          "type": "Likert-Importance"
        },
        {
          "number": 60,
          "question": "Rank these supply factors from most to least important: Premium food availability, Grooming services, Training classes, Boarding/daycare, Online delivery options",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Animal Welfare & Local Attitudes",
      "questionRange": "Q61-Q70",
      "questions": [
        {
          "number": 61,
          "question": "How important are strong animal welfare and cruelty prevention laws in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 62,
          "question": "Would a country with weak animal protection laws be a dealbreaker for you?",
          "type": "Dealbreaker"
        },
        {
          "number": 63,
          "question": "How important is the local cultural attitude toward domestic pets (dogs and cats treated as family members)?",
          "type": "Likert-Importance"
        },
        {
          "number": 64,
          "question": "How concerned are you about stray animal populations and the local approach to managing them?",
          "type": "Concern scale"
        },
        {
          "number": 65,
          "question": "Do you support or volunteer with animal rescue organizations? How important is their presence locally?",
          "type": "Likert-Importance"
        },
        {
          "number": 66,
          "question": "How do you feel about countries where certain animals are consumed as food (cultural differences in animal use)?",
          "type": "Comfort scale"
        },
        {
          "number": 67,
          "question": "How important is it that your destination bans or restricts animal testing for cosmetics and products?",
          "type": "Likert-Importance"
        },
        {
          "number": 68,
          "question": "How concerned are you about local wildlife threats to your pets (snakes, coyotes, venomous insects)?",
          "type": "Concern scale"
        },
        {
          "number": 69,
          "question": "How important is the existence of animal shelters and rescue adoption networks in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 70,
          "question": "Rank these welfare factors from most to least important: Animal cruelty laws, Cultural attitude toward pets, Stray animal management, Wildlife threats, Rescue organizations",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Climate & Environmental Impact on Pets",
      "questionRange": "Q71-Q80",
      "questions": [
        {
          "number": 71,
          "question": "How concerned are you about extreme heat affecting your pet's health and outdoor time?",
          "type": "Concern scale"
        },
        {
          "number": 72,
          "question": "Does your pet have a thick coat or breed characteristics that make certain climates dangerous?",
          "type": "Yes/No"
        },
        {
          "number": 73,
          "question": "How important is year-round outdoor access for your pets?",
          "type": "Likert-Importance"
        },
        {
          "number": 74,
          "question": "Are you concerned about tropical diseases or parasites that affect pets (leishmaniasis, heartworm, tick-borne illnesses)?",
          "type": "Concern scale"
        },
        {
          "number": 75,
          "question": "How important is the availability of air-conditioned or climate-controlled pet facilities?",
          "type": "Likert-Importance"
        },
        {
          "number": 76,
          "question": "Does your pet need access to specific terrain (beaches, forests, open fields) for exercise and well-being?",
          "type": "Yes/No + type"
        },
        {
          "number": 77,
          "question": "How concerned are you about air pollution effects on your pet's respiratory health?",
          "type": "Concern scale"
        },
        {
          "number": 78,
          "question": "Do you need a destination where your pet can safely drink tap water?",
          "type": "Yes/No"
        },
        {
          "number": 79,
          "question": "How important is seasonal pest control (fleas, ticks, mosquitoes) infrastructure in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 80,
          "question": "Rank these climate factors from most to least important: Heat safety, Tropical disease risk, Year-round outdoor access, Air quality, Pest control availability",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Exotic Pets, Livestock & Special Animals",
      "questionRange": "Q81-Q90",
      "questions": [
        {
          "number": 81,
          "question": "Do you own or plan to own exotic pets (reptiles, amphibians, birds, small mammals)?",
          "type": "Yes/No"
        },
        {
          "number": 82,
          "question": "How important is the legality of keeping your specific exotic species in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 83,
          "question": "Do you own or plan to own horses or equestrian animals?",
          "type": "Yes/No"
        },
        {
          "number": 84,
          "question": "How important is access to equestrian facilities (stables, riding schools, trails)?",
          "type": "Likert-Importance"
        },
        {
          "number": 85,
          "question": "Do you keep or plan to keep chickens, goats, or small-scale hobby livestock?",
          "type": "Yes/No"
        },
        {
          "number": 86,
          "question": "How important is the legality of urban or suburban hobby farming and livestock keeping?",
          "type": "Likert-Importance"
        },
        {
          "number": 87,
          "question": "Do you need access to specialist exotic animal veterinarians?",
          "type": "Yes/No"
        },
        {
          "number": 88,
          "question": "How important is the availability of specialty feed, habitats, and supplies for exotic pets?",
          "type": "Likert-Importance"
        },
        {
          "number": 89,
          "question": "Do you breed animals or participate in animal shows and competitions?",
          "type": "Yes/No"
        },
        {
          "number": 90,
          "question": "Rank these specialty factors from most to least important: Exotic pet legality, Equestrian facilities, Hobby farming rules, Specialist exotic vets, Breeding and show access",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Pet Deal-Breakers & Overall Priorities",
      "questionRange": "Q91-Q100",
      "questions": [
        {
          "number": 91,
          "question": "Which pet-related factors would absolutely disqualify a destination? (Select all that apply)",
          "type": "Multi-select dealbreaker"
        },
        {
          "number": 92,
          "question": "What is the single most important pet-related factor in your relocation decision?",
          "type": "Single select"
        },
        {
          "number": 93,
          "question": "Would you delay or cancel a relocation if pet import requirements were too burdensome?",
          "type": "Likert-Willingness"
        },
        {
          "number": 94,
          "question": "How important is it that your entire household (pets included) can relocate together without separation?",
          "type": "Likert-Importance"
        },
        {
          "number": 95,
          "question": "Would you accept a higher cost of living for a significantly more pet-friendly destination?",
          "type": "Slider"
        },
        {
          "number": 96,
          "question": "How do you handle pet care during extended international travel or vacations?",
          "type": "Single-select"
        },
        {
          "number": 97,
          "question": "How important is end-of-life pet care (pet hospice, cremation, burial options) in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 98,
          "question": "Do you have any specific pet or animal needs not covered above that would impact your relocation?",
          "type": "Open text"
        },
        {
          "number": 99,
          "question": "Rate the overall importance of Pets & Animals factors in your relocation decision (1-10)",
          "type": "Slider"
        },
        {
          "number": 100,
          "question": "FINAL MODULE RANKING: Drag all 10 sections to rank by overall importance to your relocation decision",
          "type": "Ranking"
        }
      ]
    }
  ]
};

import type { QuestionModule } from './types';

// Food & Dining — 100 questions
// Module ID: food_dining

export const foodDiningQuestions: QuestionModule = {
  "moduleId": "food_dining",
  "moduleName": "Food & Dining",
  "fileName": "FOOD_DINING_QUESTIONS.md",
  "structure": "10 sections × 10 questions, each ending with a ranking question + 1 final master ranking (Q100)",
  "totalQuestions": 100,
  "sections": [
    {
      "title": "Grocery Shopping & Food Access",
      "questionRange": "Q1-Q10",
      "questions": [
        {
          "number": 1,
          "question": "How important is access to large, modern supermarket chains (e.g., Carrefour, Walmart, Tesco) in your daily life?",
          "type": "Likert-Importance"
        },
        {
          "number": 2,
          "question": "Which types of specialty food markets do you regularly use or would want access to? (Select all that apply: organic/health food stores, ethnic/cultural markets, butchers, fishmongers, bakeries, cheese shops, wine merchants, bulk food stores)",
          "type": "Multi-select"
        },
        {
          "number": 3,
          "question": "How frequently do you grocery shop in a typical week?",
          "type": "Likert-Frequency"
        },
        {
          "number": 4,
          "question": "Which dietary restrictions or preferences do you follow that require specialized grocery options? (Select all that apply: vegetarian, vegan, gluten-free, halal, kosher, keto, paleo, lactose-free, nut-free, low-sodium, organic-only, none)",
          "type": "Multi-select"
        },
        {
          "number": 5,
          "question": "How strict are your dietary restrictions?",
          "type": "Likert-Importance"
        },
        {
          "number": 6,
          "question": "How important is it to have grocery stores within walking distance (under 10 minutes walk) of your home?",
          "type": "Likert-Importance"
        },
        {
          "number": 7,
          "question": "How important is access to fresh, local, and seasonal produce in your food choices?",
          "type": "Likert-Importance"
        },
        {
          "number": 8,
          "question": "What is your typical monthly household grocery budget range?",
          "type": "Range"
        },
        {
          "number": 9,
          "question": "Which grocery shopping conveniences are important to you? (Select all that apply: online ordering, home delivery, self-checkout, extended hours, loyalty programs, contactless payment, drive-through pickup)",
          "type": "Multi-select"
        },
        {
          "number": 10,
          "question": "Rank these grocery factors from most to least important: Store proximity, Product variety, Price/affordability, Fresh produce quality, Dietary accommodation",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Dining Out & Restaurant Culture",
      "questionRange": "Q11-Q20",
      "questions": [
        {
          "number": 11,
          "question": "How frequently do you dine out at restaurants per week?",
          "type": "Likert-Frequency"
        },
        {
          "number": 12,
          "question": "Which types of cuisine are essential for you to have access to? (Select all that apply: Italian, Japanese, Chinese, Thai, Indian, Mexican, French, Mediterranean, Korean, Middle Eastern, American, Vietnamese, Ethiopian, Peruvian, Other)",
          "type": "Multi-select"
        },
        {
          "number": 13,
          "question": "What is your typical dining out budget per person for a standard dinner?",
          "type": "Range"
        },
        {
          "number": 14,
          "question": "How important is fine dining and Michelin-starred restaurants in your lifestyle?",
          "type": "Likert-Importance"
        },
        {
          "number": 15,
          "question": "Which dining atmospheres do you prefer? (Select all that apply: casual/family, upscale/formal, outdoor/terrace, rooftop, waterfront, trendy/hip, cozy/intimate, buffet-style, tasting-menu)",
          "type": "Multi-select"
        },
        {
          "number": 16,
          "question": "How important is it that restaurants can accommodate specific dietary restrictions (celiac, nut allergies, veganism) easily and safely?",
          "type": "Likert-Importance"
        },
        {
          "number": 17,
          "question": "How adventurous are you with trying new and exotic foods?",
          "type": "Likert-Willingness"
        },
        {
          "number": 18,
          "question": "How willing are you to adapt to local dining customs (eating times, shared plates, different utensils, table manners)? CULTURAL FLEX",
          "type": "Slider"
        },
        {
          "number": 19,
          "question": "How important is the availability of food delivery services (Uber Eats, DoorDash, or local equivalents) with wide restaurant variety?",
          "type": "Likert-Importance"
        },
        {
          "number": 20,
          "question": "Rank these dining factors from most to least important: Cuisine variety, Restaurant quality, Dietary accommodation, Delivery services, Affordability",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Coffee Culture & Cafes",
      "questionRange": "Q21-Q30",
      "questions": [
        {
          "number": 21,
          "question": "How important is coffee culture and quality cafes in your daily lifestyle?",
          "type": "Likert-Importance"
        },
        {
          "number": 22,
          "question": "How would you describe your relationship with coffee shops and cafes?",
          "type": "Single-select"
        },
        {
          "number": 23,
          "question": "Which types of coffee establishments do you frequent? (Select all that apply: specialty/third-wave, international chains, local independent, co-working cafes, bakery-cafes, tea houses, juice bars)",
          "type": "Multi-select"
        },
        {
          "number": 24,
          "question": "How important is it to have a cafe within walking distance of your home?",
          "type": "Likert-Importance"
        },
        {
          "number": 25,
          "question": "How important is coffee quality and preparation method to your satisfaction?",
          "type": "Likert-Importance"
        },
        {
          "number": 26,
          "question": "Which coffee shop amenities are important to you? (Select all that apply: WiFi, power outlets, outdoor seating, quiet atmosphere, food menu, workspace tables, live music, pet-friendly)",
          "type": "Multi-select"
        },
        {
          "number": 27,
          "question": "Would you prefer a neighborhood with well-known coffee chains (Starbucks) or independent, third-wave coffee shops?",
          "type": "Single-select"
        },
        {
          "number": 28,
          "question": "How excited are you to explore and adapt to local coffee/tea traditions (Turkish coffee, Italian espresso culture, British tea time, Japanese tea ceremony)? CULTURAL FLEX",
          "type": "Slider"
        },
        {
          "number": 29,
          "question": "How important is using coffee shops as social spaces for meeting friends or conducting business?",
          "type": "Likert-Importance"
        },
        {
          "number": 30,
          "question": "Rank these cafe factors from most to least important: Coffee quality, Proximity, Amenities (WiFi, workspace), Atmosphere, Local coffee culture",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Breweries, Bars & Drinking Culture",
      "questionRange": "Q31-Q40",
      "questions": [
        {
          "number": 31,
          "question": "How important is access to breweries and craft beer culture in your lifestyle?",
          "type": "Likert-Importance"
        },
        {
          "number": 32,
          "question": "How frequently do you visit bars, breweries, or similar establishments?",
          "type": "Likert-Frequency"
        },
        {
          "number": 33,
          "question": "Which types of drinking establishments do you enjoy? (Select all that apply: craft breweries, wine bars, cocktail lounges, Irish/British pubs, sports bars, rooftop bars, beach bars, sake bars, beer gardens, speakeasies)",
          "type": "Multi-select"
        },
        {
          "number": 34,
          "question": "How important is a \"walkable\" nightlife where you can easily move between several venues on foot?",
          "type": "Likert-Importance"
        },
        {
          "number": 35,
          "question": "How important is local beer and wine production in the region where you live?",
          "type": "Likert-Importance"
        },
        {
          "number": 36,
          "question": "How important is the availability of non-alcoholic options (craft mocktails, non-alcoholic beer) at these venues?",
          "type": "Likert-Importance"
        },
        {
          "number": 37,
          "question": "How open are you to participating in local drinking customs and traditions (toasting rituals, business drinking culture, pub etiquette, wine ceremonies)? CULTURAL FLEX",
          "type": "Slider"
        },
        {
          "number": 38,
          "question": "How important is it that your destination has a globally recognized scene for a particular drink (craft beer, wine region, cocktail bars)?",
          "type": "Likert-Importance"
        },
        {
          "number": 39,
          "question": "How important is the social aspect of drinking culture (networking, business meetings) in your professional life?",
          "type": "Likert-Importance"
        },
        {
          "number": 40,
          "question": "Rank these bar/brewery factors from most to least important: Craft beer/wine scene, Walkable nightlife, Venue variety, Non-alcoholic options, Social/professional drinking culture",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Food Markets & Cultural Food Adaptation",
      "questionRange": "Q41-Q50",
      "questions": [
        {
          "number": 41,
          "question": "How important is regular access to outdoor farmers' markets or public food halls?",
          "type": "Likert-Importance"
        },
        {
          "number": 42,
          "question": "How interested are you in learning to cook the local cuisine of your new home country?",
          "type": "Likert-Willingness"
        },
        {
          "number": 43,
          "question": "How important is it to live in a place with a distinct and celebrated \"food identity\" or local culinary scene?",
          "type": "Likert-Importance"
        },
        {
          "number": 44,
          "question": "How important is sustainable and environmentally conscious food sourcing in your choices?",
          "type": "Likert-Importance"
        },
        {
          "number": 45,
          "question": "How comfortable are you navigating food markets where haggling is expected, vendors speak limited English, and payment methods may be cash-only? CULTURAL FLEX",
          "type": "Slider"
        },
        {
          "number": 46,
          "question": "How willing are you to adjust your eating schedule to match local customs (late dinners, long lunch breaks, different meal timing)? CULTURAL FLEX",
          "type": "Slider"
        },
        {
          "number": 47,
          "question": "How important is having access to familiar international food brands and chains from your home country?",
          "type": "Likert-Importance"
        },
        {
          "number": 48,
          "question": "Which food delivery and convenience services are important to you? (Select all that apply: grocery delivery, meal kit delivery, restaurant delivery, pre-made meal delivery, specialty ingredient subscription)",
          "type": "Multi-select"
        },
        {
          "number": 49,
          "question": "How important is food safety and hygiene standards in grocery stores and markets to your comfort level?",
          "type": "Likert-Importance"
        },
        {
          "number": 50,
          "question": "Rank these food market factors from most to least important: Farmers' market access, Local food identity, Sustainable sourcing, Familiar brands, Food delivery services",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Home Cooking & Kitchen Culture",
      "questionRange": "Q51-Q60",
      "questions": [
        {
          "number": 51,
          "question": "How important is having a full-sized kitchen with oven, stovetop, and adequate counter space in your home?",
          "type": "Likert-Importance"
        },
        {
          "number": 52,
          "question": "How important is the local availability of international ingredients and spices needed to cook your home country's cuisine?",
          "type": "Likert-Importance"
        },
        {
          "number": 53,
          "question": "How interested are you in taking cooking classes or culinary workshops to learn the local cuisine?",
          "type": "Likert-Willingness"
        },
        {
          "number": 54,
          "question": "How important is the quality and variety of neighborhood butchers, fishmongers, and artisan bakeries near your home?",
          "type": "Likert-Importance"
        },
        {
          "number": 55,
          "question": "How important is access to specialty cooking equipment (woks, outdoor grills, tandoor ovens, bread makers) through local retailers?",
          "type": "Likert-Importance"
        },
        {
          "number": 56,
          "question": "How important is the local home-entertaining and dinner-party culture?",
          "type": "Likert-Importance"
        },
        {
          "number": 57,
          "question": "How important is the availability of meal kit or pre-portioned ingredient delivery services?",
          "type": "Likert-Importance"
        },
        {
          "number": 58,
          "question": "How important is having access to a garden, balcony, or community garden for growing your own herbs and produce?",
          "type": "Likert-Importance"
        },
        {
          "number": 59,
          "question": "How important is tap water quality for everyday cooking and drinking without needing filtration or bottled water?",
          "type": "Likert-Importance"
        },
        {
          "number": 60,
          "question": "Rank these home cooking factors from most to least important: Kitchen quality, International ingredients, Artisan food shops, Cooking classes, Water quality",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Street Food, Casual Eats & Late-Night",
      "questionRange": "Q61-Q70",
      "questions": [
        {
          "number": 61,
          "question": "How important is a vibrant, established street food culture in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 62,
          "question": "How important is the safety and hygiene of street food vendors and outdoor food stalls?",
          "type": "Likert-Importance"
        },
        {
          "number": 63,
          "question": "How important is access to late-night food options (available after 10 PM) near your home or social areas?",
          "type": "Likert-Importance"
        },
        {
          "number": 64,
          "question": "How important is a food truck scene or rotating pop-up food vendor culture?",
          "type": "Likert-Importance"
        },
        {
          "number": 65,
          "question": "How important is access to fast-casual and quick-service restaurants for affordable weekday meals?",
          "type": "Likert-Importance"
        },
        {
          "number": 66,
          "question": "How important is the availability of grab-and-go breakfast and lunch options near typical work areas?",
          "type": "Likert-Importance"
        },
        {
          "number": 67,
          "question": "How important is having diverse quick-service food options beyond major international fast food chains?",
          "type": "Likert-Importance"
        },
        {
          "number": 68,
          "question": "How important is the availability of healthy fast-casual options (salad bars, poke bowls, smoothie shops, juice bars)?",
          "type": "Likert-Importance"
        },
        {
          "number": 69,
          "question": "How important is the local bakery and pastry culture for everyday eating (fresh bread, croissants, local pastries)?",
          "type": "Likert-Importance"
        },
        {
          "number": 70,
          "question": "Rank these casual food factors from most to least important: Street food culture, Late-night options, Fast-casual variety, Healthy quick options, Bakery/pastry culture",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Food Safety, Allergies & Dietary Health",
      "questionRange": "Q71-Q80",
      "questions": [
        {
          "number": 71,
          "question": "How important is clear allergen labeling on packaged foods and restaurant menus?",
          "type": "Likert-Importance"
        },
        {
          "number": 72,
          "question": "How important is restaurant staff awareness and training around serious food allergies (anaphylaxis-level risks)?",
          "type": "Likert-Importance"
        },
        {
          "number": 73,
          "question": "How important is the availability of certified organic and pesticide-free food options in local stores?",
          "type": "Likert-Importance"
        },
        {
          "number": 74,
          "question": "How important is GMO labeling and transparency in food sourcing and packaging?",
          "type": "Likert-Importance"
        },
        {
          "number": 75,
          "question": "How important is access to halal, kosher, or other religiously compliant food options in your daily life?",
          "type": "Likert-Importance"
        },
        {
          "number": 76,
          "question": "How important is the availability of plant-based, vegan, and vegetarian products in mainstream grocery stores and restaurants?",
          "type": "Likert-Importance"
        },
        {
          "number": 77,
          "question": "How important are government food safety inspection standards and their consistent enforcement?",
          "type": "Likert-Importance"
        },
        {
          "number": 78,
          "question": "How important are animal welfare standards in local food production (free-range eggs, grass-fed beef, cage-free poultry)?",
          "type": "Likert-Importance"
        },
        {
          "number": 79,
          "question": "How important is the strength of the local farm-to-table movement and transparency around food sourcing?",
          "type": "Likert-Importance"
        },
        {
          "number": 80,
          "question": "Rank these food safety factors from most to least important: Allergen labeling, Organic availability, Religious food compliance, Food safety enforcement, Animal welfare standards",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Food Economics & Dining Norms",
      "questionRange": "Q81-Q90",
      "questions": [
        {
          "number": 81,
          "question": "How important is restaurant menu price transparency (no hidden fees, service charges clearly stated)?",
          "type": "Likert-Importance"
        },
        {
          "number": 82,
          "question": "How comfortable are you with the local tipping culture and norms (mandatory service charges, no tipping, percentage-based tipping)? CULTURAL FLEX",
          "type": "Slider"
        },
        {
          "number": 83,
          "question": "How important is the overall affordability of dining out compared to your current home country?",
          "type": "Likert-Importance"
        },
        {
          "number": 84,
          "question": "How important is the cost ratio between eating out and cooking at home in your monthly budget planning?",
          "type": "Likert-Importance"
        },
        {
          "number": 85,
          "question": "How important is access to affordable, high-quality lunch options near typical business and work districts?",
          "type": "Likert-Importance"
        },
        {
          "number": 86,
          "question": "How important is the availability of kids' menus, child-sized portions, and family-friendly dining pricing?",
          "type": "Likert-Importance"
        },
        {
          "number": 87,
          "question": "How important is the availability of restaurant reservation systems and queue/wait-time management?",
          "type": "Likert-Importance"
        },
        {
          "number": 88,
          "question": "How important is the local culture around communal dining, shared plates, and family-style eating as a social norm?",
          "type": "Likert-Importance"
        },
        {
          "number": 89,
          "question": "How important is access to food courts, hawker centers, or multi-vendor food halls with many options in one location?",
          "type": "Likert-Importance"
        },
        {
          "number": 90,
          "question": "Rank these food economics factors from most to least important: Price transparency, Dining affordability, Lunch options near work, Family-friendly pricing, Food hall/hawker access",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Overall Food Priorities & Deal-Breakers",
      "questionRange": "Q91-Q100",
      "questions": [
        {
          "number": 91,
          "question": "What is your total monthly household food and dining budget (groceries + eating out)?",
          "type": "Range"
        },
        {
          "number": 92,
          "question": "What time do you typically prefer to have dinner?",
          "type": "Single-select"
        },
        {
          "number": 93,
          "question": "How important is access to bulk-buy or wholesale food stores for stocking a home kitchen affordably?",
          "type": "Likert-Importance"
        },
        {
          "number": 94,
          "question": "How important is access to loyalty programs, dining discount apps, or restaurant deal platforms?",
          "type": "Likert-Importance"
        },
        {
          "number": 95,
          "question": "Which food issues are absolute dealbreakers that would eliminate a destination? (Select all that apply: no dietary accommodation, poor food safety, no grocery delivery, no international cuisine, no fresh produce, no late-night food, unaffordable dining, no allergen awareness)",
          "type": "Multi-select"
        },
        {
          "number": 96,
          "question": "Which food features are non-negotiable must-haves? (Select all that apply: nearby supermarket, fresh produce access, dietary accommodation, restaurant variety, delivery services, safe street food, coffee culture, affordable dining)",
          "type": "Multi-select"
        },
        {
          "number": 97,
          "question": "How willing are you to accept limited food variety in exchange for other benefits (lower cost of living, better climate, safety)?",
          "type": "Likert-Willingness"
        },
        {
          "number": 98,
          "question": "On a scale of 0-100, how would you rank food and dining as a priority compared to all other relocation factors?",
          "type": "Slider"
        },
        {
          "number": 99,
          "question": "How important is it that your destination's food scene is growing, innovating, and trending upward?",
          "type": "Likert-Importance"
        },
        {
          "number": 100,
          "question": "Rank these overall food categories from most to least important for your relocation: Grocery access, Restaurant/dining culture, Coffee/cafe culture, Bar/brewery scene, Food markets, Home cooking, Street food/casual eats, Food safety/allergies, Food economics, Overall food investment",
          "type": "Ranking"
        }
      ]
    }
  ]
};

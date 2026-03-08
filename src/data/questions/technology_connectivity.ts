import type { QuestionModule } from './types';

// Technology & Connectivity — 100 questions
// Module ID: technology_connectivity

export const technologyConnectivityQuestions: QuestionModule = {
  "moduleId": "technology_connectivity",
  "moduleName": "Technology & Connectivity",
  "fileName": "TECHNOLOGY_CONNECTIVITY_QUESTIONS.md",
  "structure": "10 sections x 10 questions, each ending with a ranking question + 1 final master ranking (Q100)",
  "totalQuestions": 100,
  "sections": [
    {
      "title": "Internet Speed & Reliability",
      "questionRange": "Q1-Q10",
      "questions": [
        {
          "number": 1,
          "question": "What is the minimum download speed (Mbps) you need for your daily activities?",
          "type": "Speed range"
        },
        {
          "number": 2,
          "question": "What is the minimum upload speed (Mbps) you need (relevant for video calls, streaming, cloud work)?",
          "type": "Speed range"
        },
        {
          "number": 3,
          "question": "How important is fiber optic broadband availability in your neighborhood?",
          "type": "Likert-Importance"
        },
        {
          "number": 4,
          "question": "How many hours of internet downtime per month would you tolerate?",
          "type": "Tolerance range"
        },
        {
          "number": 5,
          "question": "Do you work remotely and depend on stable internet for your income?",
          "type": "Yes/No"
        },
        {
          "number": 6,
          "question": "How important is having multiple ISP options to avoid monopoly pricing?",
          "type": "Likert-Importance"
        },
        {
          "number": 7,
          "question": "How important is unlimited data with no bandwidth caps or throttling?",
          "type": "Likert-Importance"
        },
        {
          "number": 8,
          "question": "What is the maximum monthly cost you would pay for reliable high-speed internet?",
          "type": "Budget range"
        },
        {
          "number": 9,
          "question": "How important is low latency (ping under 30ms) for your usage (gaming, trading, video calls)?",
          "type": "Likert-Importance"
        },
        {
          "number": 10,
          "question": "Rank these internet factors from most to least important: Download speed, Upload speed, Reliability/uptime, Cost, ISP competition",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Mobile Network & Cellular Coverage",
      "questionRange": "Q11-Q20",
      "questions": [
        {
          "number": 11,
          "question": "How important is reliable 4G/LTE coverage throughout your city and surrounding areas?",
          "type": "Likert-Importance"
        },
        {
          "number": 12,
          "question": "How important is 5G network availability in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 13,
          "question": "Do you rely on mobile data as a backup or primary internet connection?",
          "type": "Yes/No"
        },
        {
          "number": 14,
          "question": "How important is affordable mobile data (e.g., under $30/month for 20GB+)?",
          "type": "Likert-Importance"
        },
        {
          "number": 15,
          "question": "Do you need eSIM support for easy carrier switching when traveling?",
          "type": "Yes/No"
        },
        {
          "number": 16,
          "question": "How important is reliable mobile coverage in rural areas and during road trips?",
          "type": "Likert-Importance"
        },
        {
          "number": 17,
          "question": "How important is international roaming affordability for frequent travel?",
          "type": "Likert-Importance"
        },
        {
          "number": 18,
          "question": "Do you need mobile carriers that support Wi-Fi calling and VoLTE?",
          "type": "Yes/No"
        },
        {
          "number": 19,
          "question": "How important is mobile payment acceptance (Apple Pay, Google Pay, contactless) throughout your area?",
          "type": "Likert-Importance"
        },
        {
          "number": 20,
          "question": "Rank these mobile factors from most to least important: 4G/5G coverage, Data affordability, Rural coverage, International roaming, Mobile payments",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Remote Work & Digital Nomad Infrastructure",
      "questionRange": "Q21-Q30",
      "questions": [
        {
          "number": 21,
          "question": "Do you work remotely or plan to work remotely from your destination?",
          "type": "Yes/No/Maybe"
        },
        {
          "number": 22,
          "question": "How important is the availability of co-working spaces with fast internet?",
          "type": "Likert-Importance"
        },
        {
          "number": 23,
          "question": "Do you need co-working spaces with private offices, meeting rooms, or phone booths?",
          "type": "Yes/No"
        },
        {
          "number": 24,
          "question": "How important is reliable video conferencing quality (Zoom, Teams, Meet) from your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 25,
          "question": "Do you need your destination to be in a specific time zone range for work collaboration?",
          "type": "Yes/No + range"
        },
        {
          "number": 26,
          "question": "How important is a digital nomad visa or remote worker residency program?",
          "type": "Likert-Importance"
        },
        {
          "number": 27,
          "question": "Do you need access to professional printing, scanning, and shipping services nearby?",
          "type": "Yes/No"
        },
        {
          "number": 28,
          "question": "How important is the availability of cafes with reliable Wi-Fi for working?",
          "type": "Likert-Importance"
        },
        {
          "number": 29,
          "question": "How important is backup internet options (mobile hotspot, secondary ISP, Starlink) in case of outages?",
          "type": "Likert-Importance"
        },
        {
          "number": 30,
          "question": "Rank these remote work factors from most to least important: Internet reliability, Co-working spaces, Video call quality, Time zone alignment, Digital nomad visa availability",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Digital Services & Apps Ecosystem",
      "questionRange": "Q31-Q40",
      "questions": [
        {
          "number": 31,
          "question": "How important is full access to streaming services (Netflix, Spotify, YouTube Premium, Disney+) without geo-restrictions?",
          "type": "Likert-Importance"
        },
        {
          "number": 32,
          "question": "How concerned are you about government internet censorship or content blocking?",
          "type": "Concern scale"
        },
        {
          "number": 33,
          "question": "Do you use VPN services? How important is VPN legality and reliability in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 34,
          "question": "How important is access to ride-sharing apps (Uber, Bolt, Grab, local equivalents)?",
          "type": "Likert-Importance"
        },
        {
          "number": 35,
          "question": "How important is food delivery app availability (Uber Eats, Deliveroo, local equivalents)?",
          "type": "Likert-Importance"
        },
        {
          "number": 36,
          "question": "How important is access to online shopping with reliable delivery (Amazon, local e-commerce)?",
          "type": "Likert-Importance"
        },
        {
          "number": 37,
          "question": "Do you need access to specific cloud services (AWS, Google Cloud, Azure) for work?",
          "type": "Yes/No"
        },
        {
          "number": 38,
          "question": "How important is digital banking and fintech app availability (Revolut, Wise, N26)?",
          "type": "Likert-Importance"
        },
        {
          "number": 39,
          "question": "How concerned are you about social media restrictions (blocked platforms like X/Twitter, Facebook, WhatsApp)?",
          "type": "Concern scale"
        },
        {
          "number": 40,
          "question": "Rank these digital service factors from most to least important: Streaming access, No censorship, Ride-sharing/delivery apps, E-commerce, Digital banking apps",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "E-Government & Digital Bureaucracy",
      "questionRange": "Q41-Q50",
      "questions": [
        {
          "number": 41,
          "question": "How important is the ability to complete government processes online (visa renewals, tax filing, permits)?",
          "type": "Likert-Importance"
        },
        {
          "number": 42,
          "question": "How frustrated would you be with paper-based, in-person-only government processes?",
          "type": "Frustration scale"
        },
        {
          "number": 43,
          "question": "How important is a digital identity system (e-residency, digital ID) for accessing services?",
          "type": "Likert-Importance"
        },
        {
          "number": 44,
          "question": "Do you need online appointment booking for government offices (immigration, tax, municipal services)?",
          "type": "Yes/No"
        },
        {
          "number": 45,
          "question": "How important is English-language (or your language) availability on government websites and portals?",
          "type": "Likert-Importance"
        },
        {
          "number": 46,
          "question": "How important is the ability to pay government fees, fines, and taxes online?",
          "type": "Likert-Importance"
        },
        {
          "number": 47,
          "question": "How important is digital health records and electronic prescription systems?",
          "type": "Likert-Importance"
        },
        {
          "number": 48,
          "question": "Do you need online school enrollment and education management systems?",
          "type": "Yes/No"
        },
        {
          "number": 49,
          "question": "How important is real-time public transit tracking and digital transit cards?",
          "type": "Likert-Importance"
        },
        {
          "number": 50,
          "question": "Rank these e-government factors from most to least important: Online government services, Digital ID systems, English-language portals, Online payments, Digital health records",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Cybersecurity & Digital Privacy",
      "questionRange": "Q51-Q60",
      "questions": [
        {
          "number": 51,
          "question": "How concerned are you about cybercrime and digital fraud targeting expats?",
          "type": "Concern scale"
        },
        {
          "number": 52,
          "question": "How important is strong data protection legislation (GDPR-equivalent) in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 53,
          "question": "How concerned are you about government surveillance and monitoring of online activity?",
          "type": "Concern scale"
        },
        {
          "number": 54,
          "question": "How important is banking and financial transaction security infrastructure?",
          "type": "Likert-Importance"
        },
        {
          "number": 55,
          "question": "Do you need access to encrypted communication tools (Signal, ProtonMail) without restrictions?",
          "type": "Yes/No"
        },
        {
          "number": 56,
          "question": "How important is public Wi-Fi security (encrypted networks, WPA3) in cafes and public spaces?",
          "type": "Likert-Importance"
        },
        {
          "number": 57,
          "question": "How concerned are you about identity theft and how well does the local legal system address it?",
          "type": "Concern scale"
        },
        {
          "number": 58,
          "question": "How important is the right to be forgotten and digital data deletion in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 59,
          "question": "Do you store sensitive data (medical, financial, legal) in the cloud and need assurance of local data protection?",
          "type": "Yes/No"
        },
        {
          "number": 60,
          "question": "Rank these privacy factors from most to least important: Data protection laws, Government surveillance level, Cybercrime protection, Encryption tool access, Identity theft recourse",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Smart Home & IoT Readiness",
      "questionRange": "Q61-Q70",
      "questions": [
        {
          "number": 61,
          "question": "Do you currently use smart home devices (smart speakers, thermostats, cameras, lights)?",
          "type": "Yes/No"
        },
        {
          "number": 62,
          "question": "How important is smart home device compatibility and availability in your destination?",
          "type": "Likert-Importance"
        },
        {
          "number": 63,
          "question": "Do you need reliable home automation platforms (Google Home, Alexa, HomeKit) to work locally?",
          "type": "Yes/No"
        },
        {
          "number": 64,
          "question": "How important is smart energy management (smart meters, solar monitoring, EV charging)?",
          "type": "Likert-Importance"
        },
        {
          "number": 65,
          "question": "Do you use a smart security system (cameras, sensors, smart locks)? How important is local support?",
          "type": "Likert-Importance"
        },
        {
          "number": 66,
          "question": "How important is voice assistant language support in your preferred language?",
          "type": "Likert-Importance"
        },
        {
          "number": 67,
          "question": "Do you need smart appliance availability (robot vacuums, smart washers, connected kitchen)?",
          "type": "Yes/No"
        },
        {
          "number": 68,
          "question": "How important is reliable electrical infrastructure (consistent voltage, no power surges) for sensitive electronics?",
          "type": "Likert-Importance"
        },
        {
          "number": 69,
          "question": "Do you need a home with pre-wired Ethernet and modern electrical standards?",
          "type": "Yes/No"
        },
        {
          "number": 70,
          "question": "Rank these smart home factors from most to least important: Device availability, Platform compatibility, Smart energy, Security systems, Electrical infrastructure",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Tech Hardware & Repair Services",
      "questionRange": "Q71-Q80",
      "questions": [
        {
          "number": 71,
          "question": "How important is access to authorized Apple, Samsung, or other brand repair centers?",
          "type": "Likert-Importance"
        },
        {
          "number": 72,
          "question": "How important is the local availability and pricing of laptops, phones, and electronics?",
          "type": "Likert-Importance"
        },
        {
          "number": 73,
          "question": "Are import duties and taxes on electronics a concern for your destination?",
          "type": "Concern scale"
        },
        {
          "number": 74,
          "question": "Do you need access to computer and tech parts for building or upgrading custom PCs?",
          "type": "Yes/No"
        },
        {
          "number": 75,
          "question": "How important is next-day or same-day tech support and repair services?",
          "type": "Likert-Importance"
        },
        {
          "number": 76,
          "question": "Do you need access to professional A/V equipment, cameras, or production gear locally?",
          "type": "Yes/No"
        },
        {
          "number": 77,
          "question": "How important is warranty and after-sales service for electronics purchased locally?",
          "type": "Likert-Importance"
        },
        {
          "number": 78,
          "question": "Do you need electronics and adapters compatible with local power outlets and voltage?",
          "type": "Likert-Importance"
        },
        {
          "number": 79,
          "question": "How important is second-hand electronics market availability for budget purchases?",
          "type": "Likert-Importance"
        },
        {
          "number": 80,
          "question": "Rank these hardware factors from most to least important: Authorized repair centers, Electronics pricing, Import duties, Warranty service, Parts availability",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Tech Industry & Innovation Ecosystem",
      "questionRange": "Q81-Q90",
      "questions": [
        {
          "number": 81,
          "question": "Are you in the tech industry? How important is a strong local tech job market?",
          "type": "Likert-Importance"
        },
        {
          "number": 82,
          "question": "How important is proximity to tech hubs, startup ecosystems, or innovation districts?",
          "type": "Likert-Importance"
        },
        {
          "number": 83,
          "question": "Do you need access to tech meetups, hackathons, and developer communities?",
          "type": "Yes/No"
        },
        {
          "number": 84,
          "question": "How important is the local availability of tech talent for hiring (developers, designers, data scientists)?",
          "type": "Likert-Importance"
        },
        {
          "number": 85,
          "question": "Do you need access to tech incubators or accelerator programs?",
          "type": "Yes/No"
        },
        {
          "number": 86,
          "question": "How important is the destination's adoption of emerging technologies (AI, blockchain, IoT, autonomous vehicles)?",
          "type": "Likert-Importance"
        },
        {
          "number": 87,
          "question": "Do you need access to university tech research partnerships or R&D facilities?",
          "type": "Yes/No"
        },
        {
          "number": 88,
          "question": "How important is the destination's reputation in the global tech community?",
          "type": "Likert-Importance"
        },
        {
          "number": 89,
          "question": "How important is the availability of tech conferences and industry events locally?",
          "type": "Likert-Importance"
        },
        {
          "number": 90,
          "question": "Rank these tech ecosystem factors from most to least important: Job market strength, Startup ecosystem, Developer community, Emerging tech adoption, Conference and event access",
          "type": "Ranking"
        }
      ]
    },
    {
      "title": "Technology Deal-Breakers & Overall Priorities",
      "questionRange": "Q91-Q100",
      "questions": [
        {
          "number": 91,
          "question": "Which technology factors would absolutely disqualify a destination? (Select all that apply)",
          "type": "Multi-select dealbreaker"
        },
        {
          "number": 92,
          "question": "What is the single most important technology factor in your relocation decision?",
          "type": "Single select"
        },
        {
          "number": 93,
          "question": "Would you accept slower internet for a significantly lower cost of living or better climate?",
          "type": "Slider"
        },
        {
          "number": 94,
          "question": "How important is it that your destination is \"future-proof\" in terms of tech infrastructure investment?",
          "type": "Likert-Importance"
        },
        {
          "number": 95,
          "question": "Would internet censorship or social media blocking be a dealbreaker regardless of other benefits?",
          "type": "Dealbreaker"
        },
        {
          "number": 96,
          "question": "How dependent is your income on reliable technology infrastructure?",
          "type": "Dependency scale"
        },
        {
          "number": 97,
          "question": "Would you invest in your own tech setup (Starlink, private network) if local infrastructure is limited?",
          "type": "Likert-Willingness"
        },
        {
          "number": 98,
          "question": "Do you have any specific technology needs not covered above that would impact your relocation?",
          "type": "Open text"
        },
        {
          "number": 99,
          "question": "Rate the overall importance of Technology & Connectivity factors in your relocation decision (1-10)",
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

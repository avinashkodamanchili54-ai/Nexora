export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const LANGUAGES = [
  { code: "en", label: "English", speechLang: "en-IN" },
  { code: "te", label: "తెలుగు (Telugu)", speechLang: "te-IN" },
  { code: "hi", label: "हिन्दी (Hindi)", speechLang: "hi-IN" },
  { code: "ta", label: "தமிழ் (Tamil)", speechLang: "ta-IN" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)", speechLang: "kn-IN" },
];

export const UI_STRINGS = {
  en: {
    tagline: "Predict the risk. Investigate the cause. Explain the evidence. Guide the farmer.",
    tabs: {
      home: "Home",
      farm: "1. Farm & Satellite",
      radar: "2. Risk Radar",
      scanner: "3. Leaf Scanner",
      rootcause: "4. RootCause AI",
      assistant: "5. Sakhi Chat",
      history: "6. Crop History",
    },
    scanCta: "Run SmartScan & Investigate Cause",
    saveFarm: "Save Farm & Update Risk Radar",
  },
  te: {
    tagline: "ముప్పును అంచనా వేయండి. కారణాన్ని పరిశోధించండి. రైతుకు సరళంగా మార్గనిర్దేశం చేయండి.",
    tabs: {
      farm: "1. పొలం & శాటిలైట్",
      radar: "2. ముప్పు రాడార్",
      scanner: "3. ఆకు స్కానర్",
      rootcause: "4. మూల కారణ AI",
      assistant: "5. సఖి చాట్",
      history: "6. పంట చరిత్ర",
    },
    scanCta: "స్మార్ట్ స్కాన్ & కారణ పరిశోధన చేయండి",
    saveFarm: "పొలం సేవ్ చేయండి & రాడార్ అప్‌డేట్ చేయండి",
  },
  hi: {
    tagline: "जोखिम का अनुमान लगाएं। कारण की जांच करें। किसान का मार्गदर्शन करें।",
    tabs: {
      farm: "1. खेत और सैटेलाइट",
      radar: "2. जोखिम रडार",
      scanner: "3. पत्ती स्कैनर",
      rootcause: "4. रूटकॉज AI",
      assistant: "5. सखी चैट",
      history: "6. फसल इतिहास",
    },
    scanCta: "स्मार्ट स्कैन और कारण जांच शुरू करें",
    saveFarm: "खेत सहेजें और जोखिम रडार अपडेट करें",
  },
  ta: {
    tagline: "ஆபத்தை கணிக்கவும். காரணத்தை ஆராயவும். விவசாயிக்கு வழிகாட்டவும்.",
    tabs: {
      farm: "1. பண்ணை & செயற்கைக்கோள்",
      radar: "2. ஆபத்து ரேடார்",
      scanner: "3. இலை ஸ்கேனர்",
      rootcause: "4. மூலக் காரணம் AI",
      assistant: "5. சகி அரட்டை",
      history: "6. பயிர் வரலாறு",
    },
    scanCta: "ஸ்மார்ட் ஸ்கேன் & காரண ஆய்வை இயக்கவும்",
    saveFarm: "பண்ணையை சேமித்து ரேடாரை புதுப்பிக்கவும்",
  },
  kn: {
    tagline: "ಅಪಾಯವನ್ನು ಊಹಿಸಿ. ಕಾರಣವನ್ನು ತನಿಖೆ ಮಾಡಿ. ರೈತರಿಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಿ.",
    tabs: {
      farm: "1. ಜಮೀನು & ಉಪಗ್ರಹ",
      radar: "2. ಅಪಾಯ ರಾಡಾರ್",
      scanner: "3. ಎಲೆ ಸ್ಕ್ಯಾನರ್",
      rootcause: "4. ಮೂಲ ಕಾರಣ AI",
      assistant: "5. ಸಖಿ ಚಾಟ್",
      history: "6. ಬೆಳೆ ಇತಿಹಾಸ",
    },
    scanCta: "ಸ್ಮಾರ್ಟ್ ಸ್ಕ್ಯಾನ್ & ಕಾರಣ ತನಿಖೆ ನಡೆಸಿ",
    saveFarm: "ಜಮೀನು ಉಳಿಸಿ & ರಾಡಾರ್ ನವೀಕರಿಸಿ",
  },
};

export const CROP_PRESETS = [
  { value: "Paddy (Rice)", label: "Paddy (Rice)", badge: "RI", mode: "paddy" },
  { value: "Tomato", label: "Tomato", badge: "TM", mode: "general" },
  { value: "Potato", label: "Potato", badge: "PT", mode: "general" },
  { value: "Pepper", label: "Chilli / Pepper", badge: "CH", mode: "general" },
  { value: "Maize / Corn", label: "Maize / Corn", badge: "MZ", mode: "general" },
];

export const DISTRICT_PRESETS = [
  { name: "Guntur, Andhra Pradesh", lat: 16.3067, lon: 80.4365 },
  { name: "Warangal, Telangana", lat: 17.9689, lon: 79.5941 },
  { name: "Thanjavur, Tamil Nadu", lat: 10.787, lon: 79.1378 },
  { name: "Mandya, Karnataka", lat: 12.5218, lon: 76.8951 },
];

export const CROP_MODES = [
  {
    code: "paddy",
    label: "Paddy / Rice Specialist",
    subtitle: "3 paddy diseases (Rice UCI Model)",
  },
  {
    code: "general",
    label: "General Crops (14+ Crops)",
    subtitle: "38 classes (PlantVillage Model)",
  },
  {
    code: "field",
    label: "Field / Real-World Photos",
    subtitle: "28 classes (PlantDoc Model)",
  },
];

export const TABS = [
  { id: "home" },
  { id: "farm" },
  { id: "radar" },
  { id: "scanner" },
  { id: "rootcause" },
  { id: "assistant" },
  { id: "history" },
];

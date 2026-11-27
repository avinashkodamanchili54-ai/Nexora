import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const UI_STRINGS_SRC = {
  en: {
    tagline: "Predict the risk. Investigate the cause. Explain the evidence. Guide the farmer.",
    tabs: {
      home: "Home", farm: "1. Farm & Satellite", radar: "2. Risk Radar",
      scanner: "3. Leaf Scanner", rootcause: "4. RootCause AI",
      assistant: "5. Sakhi Chat", history: "6. Crop History",
    },
    scanCta: "Run SmartScan & Investigate Cause",
    saveFarm: "Save Farm & Update Risk Radar",
    nav: { profile: "My Profile", alerts: "Alerts", logout: "Logout" },
    auth: {
      login: "Login", register: "Register", phone: "Phone Number",
      email: "Email Address", identifier: "Phone Number or Email",
      password: "Password", name: "Full Name", language: "Language",
      cropType: "Crop Type", loginCta: "Login to Krishi Sakhi",
      registerCta: "Create Farmer Account", noAccount: "New farmer? Create account →",
      hasAccount: "Already registered? Login →",
    },
    profile: { title: "My Farm Profile", save: "Save Profile", location: "Farm Location", useMyLocation: "Use My Location" },
    alerts: { title: "Farm Alerts", noAlerts: "No active alerts. Your crops look safe!", markRead: "Mark all read" },
    home: { welcome: "Welcome", scan: "Scan Crop", radar: "Risk Radar", chat: "Sakhi Chat", history: "Crop History", weather: "Weather & Alerts", library: "Disease Library" },
  },
  te: {
    tagline: "ముప్పును అంచనా వేయండి. కారణాన్ని పరిశోధించండి. రైతుకు సరళంగా మార్గనిర్దేశం చేయండి.",
    tabs: { home: "హోమ్", farm: "1. పొలం & శాటిలైట్", radar: "2. ముప్పు రాడార్", scanner: "3. ఆకు స్కానర్", rootcause: "4. మూల కారణ AI", assistant: "5. సఖి చాట్", history: "6. పంట చరిత్ర" },
    scanCta: "స్మార్ట్ స్కాన్ & కారణ పరిశోధన చేయండి",
    saveFarm: "పొలం సేవ్ చేయండి & రాడార్ అప్‌డేట్ చేయండి",
    nav: { profile: "నా ప్రొఫైల్", alerts: "హెచ్చరికలు", logout: "లాగ్అవుట్" },
    auth: {
      login: "లాగిన్", register: "నమోదు", phone: "ఫోన్ నంబర్",
      email: "ఇమెయిల్ చిరునామా", identifier: "ఫోన్ నంబర్ లేదా ఇమెయిల్",
      password: "పాస్‌వర్డ్", name: "పూర్తి పేరు", language: "భాష",
      cropType: "పంట రకం", loginCta: "కృషి సఖికి లాగిన్ అవండి",
      registerCta: "రైతు ఖాతా సృష్టించండి", noAccount: "కొత్త రైతు? ఖాతా సృష్టించండి →",
      hasAccount: "ఇప్పటికే నమోదయ్యారా? లాగిన్ →"
    },
    profile: { title: "నా పొలం ప్రొఫైల్", save: "ప్రొఫైల్ సేవ్ చేయండి", location: "పొలం స్థానం", useMyLocation: "నా స్థానం వాడండి" },
    alerts: { title: "పంట హెచ్చరికలు", noAlerts: "క్రియాశీల హెచ్చరికలు లేవు. మీ పంటలు సురక్షితంగా ఉన్నాయి!", markRead: "అన్నీ చదివినట్లు గుర్తించండి" },
    home: { welcome: "స్వాగతం", scan: "పంట స్కాన్", radar: "రిస్క్ రాడార్", chat: "సఖి చాట్", history: "పంట చరిత్ర", weather: "వాతావరణం & హెచ్చరికలు", library: "వ్యాధి లైబ్రరీ" },
  },
  hi: {
    tagline: "जोखिम का अनुमान लगाएं। कारण की जांच करें। किसान का मार्गदर्शन करें।",
    tabs: { home: "होम", farm: "1. खेत और सैटेलाइट", radar: "2. जोखिम रडार", scanner: "3. पत्ती स्कैनर", rootcause: "4. रूटकॉज AI", assistant: "5. सखी चैट", history: "6. फसल इतिहास" },
    scanCta: "स्मार्ट स्कैन और कारण जांच शुरू करें",
    saveFarm: "खेत सहेजें और जोखिम रडार अपडेट करें",
    nav: { profile: "मेरी प्रोफ़ाइल", alerts: "अलर्ट", logout: "लॉगआउट" },
    auth: {
      login: "लॉगिन", register: "पंजीकरण", phone: "फ़ोन नंबर",
      email: "ईमेल पता", identifier: "फ़ोन नंबर या ईमेल",
      password: "पासवर्ड", name: "पूरा नाम", language: "भाषा",
      cropType: "फसल प्रकार", loginCta: "कृषि सखी में लॉगिन करें",
      registerCta: "किसान खाता बनाएं", noAccount: "नए किसान? खाता बनाएं →",
      hasAccount: "पहले से पंजीकृत? लॉगिन →"
    },
    profile: { title: "मेरी खेत प्रोफ़ाइल", save: "प्रोफ़ाइल सहेजें", location: "खेत का स्थान", useMyLocation: "मेरा स्थान उपयोग करें" },
    alerts: { title: "फसल अलर्ट", noAlerts: "कोई सक्रिय अलर्ट नहीं। आपकी फसलें सुरक्षित हैं!", markRead: "सभी पढ़े हुए चिह्नित करें" },
    home: { welcome: "स्वागत है", scan: "फसल स्कैन", radar: "जोखिम रडार", chat: "सखी चैट", history: "फसल इतिहास", weather: "मौसम और अलर्ट", library: "रोग पुस्तकालय" },
  },
  ta: {
    tagline: "ஆபத்தை கணிக்கவும். காரணத்தை ஆராயவும். விவசாயிக்கு வழிகாட்டவும்.",
    tabs: { home: "முகப்பு", farm: "1. பண்ணை & செயற்கைக்கோள்", radar: "2. ஆபத்து ரேடார்", scanner: "3. இலை ஸ்கேனர்", rootcause: "4. மூலக் காரணம் AI", assistant: "5. சகி அரட்டை", history: "6. பயிர் வரலாறு" },
    scanCta: "ஸ்மார்ட் ஸ்கேன் & காரண ஆய்வை இயக்கவும்",
    saveFarm: "பண்ணையை சேமித்து ரேடாரை புதுப்பிக்கவும்",
    nav: { profile: "என் சுயவிவரம்", alerts: "எச்சரிக்கைகள்", logout: "வெளியேறு" },
    auth: {
      login: "உள்நுழைய", register: "பதிவு", phone: "தொலைபேசி எண்",
      email: "மின்னஞ்சல் முகவரி", identifier: "தொலைபேசி எண் அல்லது மின்னஞ்சல்",
      password: "கடவுச்சொல்", name: "முழு பெயர்", language: "மொழி",
      cropType: "பயிர் வகை", loginCta: "கிருஷி சகியில் உள்நுழைக",
      registerCta: "விவசாயி கணக்கு உருவாக்கு", noAccount: "புதிய விவசாயி? கணக்கு உருவாக்கு →",
      hasAccount: "ஏற்கெனவே பதிவு செய்தீர்களா? உள்நுழைக →"
    },
    profile: { title: "என் பண்ணை சுயவிவரம்", save: "சுயவிவரம் சேமி", location: "பண்ணை இருப்பிடம்", useMyLocation: "என் இருப்பிடம் பயன்படுத்து" },
    alerts: { title: "பயிர் எச்சரிக்கைகள்", noAlerts: "செயலில் உள்ள எச்சரிக்கைகள் இல்லை. உங்கள் பயிர்கள் பாதுகாப்பாக உள்ளன!", markRead: "அனைத்தையும் படித்ததாக குறி" },
    home: { welcome: "வரவேற்கிறோம்", scan: "பயிர் ஸ்கேன்", radar: "ஆபத்து ரேடார்", chat: "சகி அரட்டை", history: "பயிர் வரலாறு", weather: "வானிலை & எச்சரிக்கைகள்", library: "நோய் நூலகம்" },
  },
  kn: {
    tagline: "ಅಪಾಯವನ್ನು ಊಹಿಸಿ. ಕಾರಣವನ್ನು ತನಿಖೆ ಮಾಡಿ. ರೈತರಿಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಿ.",
    tabs: { home: "ಮುಖಪುಟ", farm: "1. ಜಮೀನು & ಉಪಗ್ರಹ", radar: "2. ಅಪಾಯ ರಾಡಾರ್", scanner: "3. ಎಲೆ ಸ್ಕ್ಯಾನರ್", rootcause: "4. ಮೂಲ ಕಾರಣ AI", assistant: "5. ಸಖಿ ಚಾಟ್", history: "6. ಬೆಳೆ ಇತಿಹಾಸ" },
    scanCta: "ಸ್ಮಾರ್ಟ್ ಸ್ಕ್ಯಾನ್ & ಕಾರಣ ತನಿಖೆ ನಡೆಸಿ",
    saveFarm: "ಜಮೀನು ಉಳಿಸಿ & ರಾಡಾರ್ ನವೀಕರಿಸಿ",
    nav: { profile: "ನನ್ನ ಪ್ರೊಫೈಲ್", alerts: "ಎಚ್ಚರಿಕೆಗಳು", logout: "ಲಾಗ್ಔಟ್" },
    auth: {
      login: "ಲಾಗಿನ್", register: "ನೋಂದಣಿ", phone: "ಫೋನ್ ನಂಬರ್",
      email: "ಇಮೇಲ್ ವಿಳಾಸ", identifier: "ಫೋನ್ ನಂಬರ್ ಅಥವಾ ಇಮೇಲ್",
      password: "ಪಾಸ್‌ವರ್ಡ್", name: "ಪೂರ್ಣ ಹೆಸರು", language: "ಭಾಷೆ",
      cropType: "ಬೆಳೆ ವಿಧ", loginCta: "ಕೃಷಿ ಸಖಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ",
      registerCta: "ರೈತ ಖಾತೆ ರಚಿಸಿ", noAccount: "ಹೊಸ ರೈತರೇ? ಖಾತೆ ರಚಿಸಿ →",
      hasAccount: "ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ? ಲಾಗಿನ್ →"
    },
    profile: { title: "ನನ್ನ ಜಮೀನಿನ ಪ್ರೊಫೈಲ್", save: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ", location: "ಜಮೀನಿನ ಸ್ಥಳ", useMyLocation: "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ" },
    alerts: { title: "ಬೆಳೆ ಎಚ್ಚರಿಕೆಗಳು", noAlerts: "ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ. ನಿಮ್ಮ ಬೆಳೆಗಳು ಸುರಕ್ಷಿತವಾಗಿದೆ!", markRead: "ಎಲ್ಲವನ್ನು ಓದಿದೆ ಎಂದು ಗುರುತಿಸಿ" },
    home: { welcome: "ಸ್ವಾಗತ", scan: "ಬೆಳೆ ಸ್ಕ್ಯಾನ್", radar: "ಅಪಾಯ ರಾಡಾರ್", chat: "ಸಖಿ ಚಾಟ್", history: "ಬೆಳೆ ಇತಿಹಾಸ", weather: "ಹವಾಮಾನ & ಎಚ್ಚರಿಕೆಗಳು", library: "ರೋಗ ಗ್ರಂಥಾಲಯ" },
  },
};

i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    Object.entries(UI_STRINGS_SRC).map(([lang, ns]) => [lang, { translation: ns }])
  ),
  lng: localStorage.getItem("nexora_lang") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;


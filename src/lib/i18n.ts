export const languageOptions = [
  { code: "en", label: "English", shortLabel: "EN", htmlLang: "en" },
  { code: "kn", label: "ಕನ್ನಡ", shortLabel: "ಕ", htmlLang: "kn" },
  { code: "hi", label: "हिन्दी", shortLabel: "हि", htmlLang: "hi" },
] as const;

export type LanguageCode = (typeof languageOptions)[number]["code"];

type TranslationEntry = Record<Exclude<LanguageCode, "en">, string>;

export const defaultLanguage: LanguageCode = "en";
export const languageStorageKey = "sproutbox-language";

export const translations: Record<string, TranslationEntry> = {
  Language: { kn: "ಭಾಷೆ", hi: "भाषा" },
  "How it works": { kn: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ", hi: "यह कैसे काम करता है" },
  "For Growers": { kn: "ಬೆಳೆಗಾರರಿಗೆ", hi: "उत्पादकों के लिए" },
  "For growers": { kn: "ಬೆಳೆಗಾರರಿಗೆ", hi: "उत्पादकों के लिए" },
  "For Restaurants": { kn: "ರೆಸ್ಟೋರೆಂಟ್‌ಗಳಿಗೆ", hi: "रेस्तरां के लिए" },
  "For restaurants": { kn: "ರೆಸ್ಟೋರೆಂಟ್‌ಗಳಿಗೆ", hi: "रेस्तरां के लिए" },
  "Sign in": { kn: "ಸೈನ್ ಇನ್", hi: "साइन इन" },
  "Sign In": { kn: "ಸೈನ್ ಇನ್", hi: "साइन इन" },
  "Sign in instead": { kn: "ಬದಲಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ", hi: "इसके बजाय साइन इन करें" },
  "Sign out": { kn: "ಸೈನ್ ಔಟ್", hi: "साइन आउट" },
  "Get started": { kn: "ಪ್ರಾರಂಭಿಸಿ", hi: "शुरू करें" },
  "Get Started": { kn: "ಪ್ರಾರಂಭಿಸಿ", hi: "शुरू करें" },
  "Join as Grower": { kn: "ಬೆಳೆಗಾರರಾಗಿ ಸೇರಿ", hi: "उत्पादक के रूप में जुड़ें" },
  "Partner as Restaurant": { kn: "ರೆಸ್ಟೋರೆಂಟ್ ಪಾಲುದಾರರಾಗಿ", hi: "रेस्तरां साझेदार बनें" },
  "Partner With Us": { kn: "ನಮ್ಮೊಂದಿಗೆ ಪಾಲುದಾರರಾಗಿ", hi: "हमारे साथ साझेदारी करें" },
  "Partner with us": { kn: "ನಮ್ಮೊಂದಿಗೆ ಪಾಲುದಾರರಾಗಿ", hi: "हमारे साथ साझेदारी करें" },
  "Start Growing": { kn: "ಬೆಳೆಯಲು ಪ್ರಾರಂಭಿಸಿ", hi: "उगाना शुरू करें" },
  "Start growing": { kn: "ಬೆಳೆಯಲು ಪ್ರಾರಂಭಿಸಿ", hi: "उगाना शुरू करें" },
  "Open SproutBox": { kn: "SproutBox ತೆರೆಯಿರಿ", hi: "SproutBox खोलें" },
  "Create Account": { kn: "ಖಾತೆ ರಚಿಸಿ", hi: "खाता बनाएं" },
  "Create an account": { kn: "ಖಾತೆ ರಚಿಸಿ", hi: "खाता बनाएं" },
  "Create your account": { kn: "ನಿಮ್ಮ ಖಾತೆ ರಚಿಸಿ", hi: "अपना खाता बनाएं" },
  "Already have an account?": { kn: "ಈಗಾಗಲೇ ಖಾತೆಯಿದೆಯೇ?", hi: "पहले से खाता है?" },
  "New to SproutBox?": { kn: "SproutBoxಗೆ ಹೊಸಬರೇ?", hi: "SproutBox पर नए हैं?" },
  "Welcome back": { kn: "ಮತ್ತೆ ಸ್ವಾಗತ", hi: "वापसी पर स्वागत है" },
  "Sign in to your account to continue": {
    kn: "ಮುಂದುವರಿಸಲು ನಿಮ್ಮ ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    hi: "जारी रखने के लिए अपने खाते में साइन इन करें",
  },
  "Join SproutBox as a grower or restaurant partner": {
    kn: "ಬೆಳೆಗಾರ ಅಥವಾ ರೆಸ್ಟೋರೆಂಟ್ ಪಾಲುದಾರರಾಗಿ SproutBoxಗೆ ಸೇರಿ",
    hi: "उत्पादक या रेस्तरां साझेदार के रूप में SproutBox से जुड़ें",
  },
  "I am a": { kn: "ನಾನು", hi: "मैं हूं" },
  Grower: { kn: "ಬೆಳೆಗಾರ", hi: "उत्पादक" },
  Restaurant: { kn: "ರೆಸ್ಟೋರೆಂಟ್", hi: "रेस्तरां" },
  Admin: { kn: "ನಿರ್ವಾಹಕ", hi: "एडमिन" },
  Dashboard: { kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", hi: "डैशबोर्ड" },
  Home: { kn: "ಮುಖಪುಟ", hi: "होम" },
  "My Tasks": { kn: "ನನ್ನ ಕೆಲಸಗಳು", hi: "मेरे कार्य" },
  Tasks: { kn: "ಕೆಲಸಗಳು", hi: "कार्य" },
  Earnings: { kn: "ಆದಾಯ", hi: "कमाई" },
  Profile: { kn: "ಪ್ರೊಫೈಲ್", hi: "प्रोफ़ाइल" },
  "New Order": { kn: "ಹೊಸ ಆರ್ಡರ್", hi: "नया ऑर्डर" },
  "My Orders": { kn: "ನನ್ನ ಆರ್ಡರ್‌ಗಳು", hi: "मेरे ऑर्डर" },
  Orders: { kn: "ಆರ್ಡರ್‌ಗಳು", hi: "ऑर्डर" },
  Subscriptions: { kn: "ಚಂದಾದಾರಿಕೆಗಳು", hi: "सदस्यताएं" },
  "Demand Engine": { kn: "ಬೇಡಿಕೆ ಎಂಜಿನ್", hi: "डिमांड इंजन" },
  Allocations: { kn: "ಹಂಚಿಕೆಗಳು", hi: "आवंटन" },
  "QC Review": { kn: "ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ", hi: "QC समीक्षा" },
  Hubs: { kn: "ಹಬ್‌ಗಳು", hi: "हब" },
  Growers: { kn: "ಬೆಳೆಗಾರರು", hi: "उत्पादक" },
  Restaurants: { kn: "ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು", hi: "रेस्तरां" },
  Deliveries: { kn: "ವಿತರಣೆಗಳು", hi: "डिलीवरी" },
  Analytics: { kn: "ವಿಶ್ಲೇಷಣೆ", hi: "एनालिटिक्स" },
  Payouts: { kn: "ಪಾವತಿಗಳು", hi: "भुगतान" },
  "Farm-to-fork,": { kn: "ಫಾರ್ಮ್‌ನಿಂದ ಮೇಜಿಗೆ,", hi: "खेत से थाली तक," },
  "door to door.": { kn: "ಬಾಗಿಲಿನಿಂದ ಬಾಗಿಲಿಗೆ.", hi: "घर-घर तक." },
  "Now live in 3 cities": { kn: "ಈಗ 3 ನಗರಗಳಲ್ಲಿ ಲೈವ್", hi: "अब 3 शहरों में लाइव" },
  "A demand-driven, decentralized microgreen network — connecting restaurants with home-based growers for the freshest produce, delivered on schedule.": {
    kn: "ಬೇಡಿಕೆ ಆಧಾರಿತ, ವಿಕೇಂದ್ರೀಕೃತ ಮೈಕ್ರೋಗ್ರೀನ್ ಜಾಲ - ತಾಜಾ ಉತ್ಪನ್ನಗಳನ್ನು ಸಮಯಕ್ಕೆ ತಲುಪಿಸಲು ರೆಸ್ಟೋರೆಂಟ್‌ಗಳನ್ನು ಮನೆಯಲ್ಲೇ ಬೆಳೆಯುವವರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ.",
    hi: "मांग-आधारित, विकेंद्रीकृत माइक्रोग्रीन नेटवर्क - सबसे ताज़ी उपज समय पर पहुंचाने के लिए रेस्तरां को घर-आधारित उत्पादकों से जोड़ता है.",
  },
  "Active Trays": { kn: "ಸಕ್ರಿಯ ಟ್ರೇಗಳು", hi: "सक्रिय ट्रे" },
  "QC Pass Rate": { kn: "ಗುಣಮಟ್ಟ ಪಾಸ್ ದರ", hi: "QC पास दर" },
  "Revenue MTD": { kn: "ಈ ತಿಂಗಳ ಆದಾಯ", hi: "माह की आय" },
  Scroll: { kn: "ಸ್ಕ್ರೋಲ್", hi: "स्क्रॉल" },
  "Active Growers": { kn: "ಸಕ್ರಿಯ ಬೆಳೆಗಾರರು", hi: "सक्रिय उत्पादक" },
  Cities: { kn: "ನಗರಗಳು", hi: "शहर" },
  "Delivered/Week": { kn: "ವಾರಕ್ಕೆ ವಿತರಣೆ", hi: "प्रति सप्ताह डिलीवरी" },
  "Delivered/week": { kn: "ವಾರಕ್ಕೆ ವಿತರಣೆ", hi: "प्रति सप्ताह डिलीवरी" },
  "Restaurant Partners": { kn: "ರೆಸ್ಟೋರೆಂಟ್ ಪಾಲುದಾರರು", hi: "रेस्तरां साझेदार" },
  "Per Tray Payout": { kn: "ಪ್ರತಿ ಟ್ರೇ ಪಾವತಿ", hi: "प्रति ट्रे भुगतान" },
  "The Process": { kn: "ಪ್ರಕ್ರಿಯೆ", hi: "प्रक्रिया" },
  "Three steps to": { kn: "ಮೂರು ಹಂತಗಳಲ್ಲಿ", hi: "तीन चरणों में" },
  "fresh delivery": { kn: "ತಾಜಾ ವಿತರಣೆ", hi: "ताज़ी डिलीवरी" },
  "From restaurant order to doorstep in 7–10 days": {
    kn: "ರೆಸ್ಟೋರೆಂಟ್ ಆರ್ಡರ್‌ನಿಂದ 7-10 ದಿನಗಳಲ್ಲಿ ಬಾಗಿಲಿಗೆ",
    hi: "रेस्तरां ऑर्डर से 7-10 दिनों में दरवाजे तक",
  },
  "Restaurant Orders": { kn: "ರೆಸ್ಟೋರೆಂಟ್ ಆರ್ಡರ್‌ಗಳು", hi: "रेस्तरां ऑर्डर" },
  "Smart Distribution": { kn: "ಸ್ಮಾರ್ಟ್ ಹಂಚಿಕೆ", hi: "स्मार्ट वितरण" },
  "Quality Delivered": { kn: "ಗುಣಮಟ್ಟದ ವಿತರಣೆ", hi: "गुणवत्ता के साथ डिलीवरी" },
  "Choose from 6 microgreen varieties. Set quantities, delivery schedule, and recurring preferences — all through a beautiful catalog.": {
    kn: "6 ಮೈಕ್ರೋಗ್ರೀನ್ ಜಾತಿಗಳಿಂದ ಆಯ್ಕೆಮಾಡಿ. ಪ್ರಮಾಣ, ವಿತರಣಾ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಮರುಕಳಿಸುವ ಆದ್ಯತೆಗಳನ್ನು ಸುಂದರ ಕ್ಯಾಟಲಾಗ್ ಮೂಲಕ ಹೊಂದಿಸಿ.",
    hi: "6 माइक्रोग्रीन किस्मों में से चुनें. मात्रा, डिलीवरी शेड्यूल और आवर्ती पसंदें सुंदर कैटलॉग से तय करें.",
  },
  "Our demand engine converts orders to tray tasks and allocates them to top-rated growers using a score-weighted algorithm.": {
    kn: "ನಮ್ಮ ಬೇಡಿಕೆ ಎಂಜಿನ್ ಆರ್ಡರ್‌ಗಳನ್ನು ಟ್ರೇ ಕೆಲಸಗಳಾಗಿ ಬದಲಿಸಿ, ಸ್ಕೋರ್ ಆಧಾರಿತ ಅಲ್ಗೋರಿದಮ್ ಮೂಲಕ ಉತ್ತಮ ಬೆಳೆಗಾರರಿಗೆ ಹಂಚುತ್ತದೆ.",
    hi: "हमारा डिमांड इंजन ऑर्डर को ट्रे कार्यों में बदलता है और स्कोर-आधारित एल्गोरिदम से शीर्ष उत्पादकों को आवंटित करता है.",
  },
  "Every harvest is QC-checked with digital + physical inspection. Aggregated at local hubs and delivered fresh to your kitchen.": {
    kn: "ಪ್ರತಿ ಕೊಯ್ಲು ಡಿಜಿಟಲ್ ಮತ್ತು ಭೌತಿಕ ಪರಿಶೀಲನೆಯಿಂದ ಗುಣಮಟ್ಟ ಪರೀಕ್ಷಿತವಾಗುತ್ತದೆ. ಸ್ಥಳೀಯ ಹಬ್‌ಗಳಲ್ಲಿ ಒಗ್ಗೂಡಿಸಿ ನಿಮ್ಮ ಅಡುಗೆಮನೆಗೆ ತಾಜಾಗಿ ತಲುಪುತ್ತದೆ.",
    hi: "हर फसल डिजिटल और भौतिक जांच से QC-checked होती है. स्थानीय हब पर एकत्र होकर आपकी रसोई तक ताज़ा पहुंचती है.",
  },
  "Turn your space into a": { kn: "ನಿಮ್ಮ ಜಾಗವನ್ನು", hi: "अपनी जगह को" },
  "micro-farm": { kn: "ಸೂಕ್ಷ್ಮ ಫಾರ್ಮ್ ಆಗಿಸಿ", hi: "माइक्रो-फार्म बनाएं" },
  "Day-by-day instructions": { kn: "ದಿನದಿನದ ಸೂಚನೆಗಳು", hi: "दिन-प्रतिदिन निर्देश" },
  "Guided growing process for every tray, every crop": {
    kn: "ಪ್ರತಿ ಟ್ರೇ, ಪ್ರತಿ ಬೆಳೆಗಾಗಿ ಮಾರ್ಗದರ್ಶಿತ ಬೆಳೆಯುವ ಪ್ರಕ್ರಿಯೆ",
    hi: "हर ट्रे और हर फसल के लिए निर्देशित उगाने की प्रक्रिया",
  },
  "Earn ₹50+ per tray": { kn: "ಪ್ರತಿ ಟ್ರೇಗೆ ₹50+ ಗಳಿಸಿ", hi: "प्रति ट्रे ₹50+ कमाएं" },
  "Consistent income from home, on your schedule": {
    kn: "ನಿಮ್ಮ ವೇಳಾಪಟ್ಟಿಯಲ್ಲಿ ಮನೆಯಿಂದ ಸ್ಥಿರ ಆದಾಯ",
    hi: "अपने समय पर घर से नियमित आय",
  },
  "Performance scoring": { kn: "ಕಾರ್ಯಕ್ಷಮತಾ ಸ್ಕೋರ್", hi: "प्रदर्शन स्कोरिंग" },
  "Build reputation with yield, quality, and timeliness metrics": {
    kn: "ಉತ್ಪಾದನೆ, ಗುಣಮಟ್ಟ ಮತ್ತು ಸಮಯಪಾಲನೆ ಅಳತೆಗಳಿಂದ ವಿಶ್ವಾಸ ನಿರ್ಮಿಸಿ",
    hi: "उपज, गुणवत्ता और समयबद्धता से अपनी प्रतिष्ठा बनाएं",
  },
  "Start with 5 trays": { kn: "5 ಟ್ರೇಗಳಿಂದ ಪ್ರಾರಂಭಿಸಿ", hi: "5 ट्रे से शुरू करें" },
  "Low barrier to entry, scale up as you grow": {
    kn: "ಪ್ರಾರಂಭಿಸಲು ಸುಲಭ, ಬೆಳೆದಂತೆ ವಿಸ್ತರಿಸಿ",
    hi: "शुरू करना आसान, बढ़ने के साथ विस्तार करें",
  },
  "Day 4 of 9": { kn: "9ರಲ್ಲಿ 4ನೇ ದಿನ", hi: "9 में से दिन 4" },
  "Remove cover, expose to light": { kn: "ಕವರ್ ತೆಗೆದು ಬೆಳಕಿಗೆ ಇಡಿ", hi: "ढक्कन हटाएं, रोशनी में रखें" },
  "Water 150ml. Ensure good airflow around trays.": {
    kn: "150ml ನೀರು ಹಾಕಿ. ಟ್ರೇಗಳ ಸುತ್ತ ಗಾಳಿ ಸರಿಯಾಗಿ ಹರಿಯುವುದನ್ನು ಖಚಿತಪಡಿಸಿ.",
    hi: "150ml पानी दें. ट्रे के आसपास अच्छी हवा सुनिश्चित करें.",
  },
  "Est. this week": { kn: "ಈ ವಾರ ಅಂದಾಜು", hi: "इस सप्ताह अनुमानित" },
  "Crop Catalog": { kn: "ಬೆಳೆ ಕ್ಯಾಟಲಾಗ್", hi: "फसल कैटलॉग" },
  "The freshest": { kn: "ಅತ್ಯಂತ ತಾಜಾ", hi: "सबसे ताज़ा" },
  microgreens: { kn: "ಮೈಕ್ರೋಗ್ರೀನ್ಸ್", hi: "माइक्रोग्रीन्स" },
  "on schedule": { kn: "ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ", hi: "समय पर" },
  "6 varieties, transparent pricing": {
    kn: "6 ಜಾತಿಗಳು, ಪಾರದರ್ಶಕ ಬೆಲೆ",
    hi: "6 किस्में, पारदर्शी मूल्य",
  },
  "Per-kg pricing with no hidden costs": {
    kn: "ಮರೆಮಾಚಿದ ವೆಚ್ಚಗಳಿಲ್ಲದ ಪ್ರತಿ ಕೆ.ಜಿ. ಬೆಲೆ",
    hi: "बिना छिपे खर्च के प्रति किलो मूल्य",
  },
  "Real-time order tracking": { kn: "ರಿಯಲ್-ಟೈಮ್ ಆರ್ಡರ್ ಟ್ರ್ಯಾಕಿಂಗ್", hi: "रीयल-टाइम ऑर्डर ट्रैकिंग" },
  "Track from sowing to delivery on your dashboard": {
    kn: "ಬಿತ್ತನೆದಿಂದ ವಿತರಣೆಯವರೆಗೆ ನಿಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    hi: "बुवाई से डिलीवरी तक अपने डैशबोर्ड पर ट्रैक करें",
  },
  "Recurring deliveries": { kn: "ಮರುಕಳಿಸುವ ವಿತರಣೆಗಳು", hi: "आवर्ती डिलीवरी" },
  "Set up weekly or biweekly auto-orders": {
    kn: "ವಾರಂವಾರ ಅಥವಾ ಎರಡು ವಾರಕ್ಕೊಮ್ಮೆ ಸ್ವಯಂ ಆರ್ಡರ್‌ಗಳನ್ನು ಹೊಂದಿಸಿ",
    hi: "साप्ताहिक या द्विसाप्ताहिक ऑटो-ऑर्डर सेट करें",
  },
  "Quality guaranteed": { kn: "ಗುಣಮಟ್ಟ ಖಾತ್ರಿ", hi: "गुणवत्ता की गारंटी" },
  "Multi-stage QC at field, hub, and delivery": {
    kn: "ಕ್ಷೇತ್ರ, ಹಬ್ ಮತ್ತು ವಿತರಣೆಯಲ್ಲಿ ಬಹುಹಂತದ ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ",
    hi: "फील्ड, हब और डिलीवरी पर बहु-स्तरीय QC",
  },
  "Built for": { kn: "ವಿಸ್ತರಣೆಗೆ", hi: "विस्तार के लिए" },
  scale: { kn: "ಸಿದ್ಧ", hi: "तैयार" },
  "Numbers that define our growing ecosystem": {
    kn: "ನಮ್ಮ ಬೆಳೆಯುತ್ತಿರುವ ಪರಿಸರವನ್ನು ವಿವರಿಸುವ ಸಂಖ್ಯೆಗಳು",
    hi: "हमारे बढ़ते इकोसिस्टम को बताने वाले आंकड़े",
  },
  "Weekly Output": { kn: "ವಾರದ ಉತ್ಪಾದನೆ", hi: "साप्ताहिक उत्पादन" },
  "And growing 18% MoM": { kn: "ಮಾಸಿಕವಾಗಿ 18% ಬೆಳವಣಿಗೆ", hi: "हर महीने 18% बढ़त" },
  "Multi-stage inspection": { kn: "ಬಹುಹಂತದ ಪರಿಶೀಲನೆ", hi: "बहु-स्तरीय निरीक्षण" },
  "Avg Response": { kn: "ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ", hi: "औसत प्रतिक्रिया" },
  "Task allocation speed": { kn: "ಕೆಲಸ ಹಂಚಿಕೆ ವೇಗ", hi: "कार्य आवंटन गति" },
  "Ready to grow": { kn: "ಬೆಳೆಯಲು ಸಿದ್ಧವೇ", hi: "बढ़ने के लिए तैयार" },
  "with us?": { kn: "ನಮ್ಮೊಂದಿಗೆ?", hi: "हमारे साथ?" },
  "Join the microgreen revolution — whether you grow or you order, we've got you covered.": {
    kn: "ಮೈಕ್ರೋಗ್ರೀನ್ ಕ್ರಾಂತಿಗೆ ಸೇರಿ - ನೀವು ಬೆಳೆದರೂ ಅಥವಾ ಆರ್ಡರ್ ಮಾಡಿದರೂ, ನಾವು ನಿಮ್ಮ ಜೊತೆಯಲ್ಲಿದ್ದೇವೆ.",
    hi: "माइक्रोग्रीन क्रांति से जुड़ें - आप उगाएं या ऑर्डर करें, हम आपके साथ हैं.",
  },
  Platform: { kn: "ವೇದಿಕೆ", hi: "प्लैटफ़ॉर्म" },
  Account: { kn: "ಖಾತೆ", hi: "खाता" },
  About: { kn: "ಬಗ್ಗೆ", hi: "परिचय" },
  "Grower Onboarding": { kn: "ಬೆಳೆಗಾರರ ನೋಂದಣಿ", hi: "उत्पादक ऑनबोर्डिंग" },
  "Restaurant Onboarding": { kn: "ರೆಸ್ಟೋರೆಂಟ್ ನೋಂದಣಿ", hi: "रेस्तरां ऑनबोर्डिंग" },
  "All rights reserved.": { kn: "ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.", hi: "सर्वाधिकार सुरक्षित." },
  "Made with 🌱 in India": { kn: "ಭಾರತದಲ್ಲಿ 🌱 ಜೊತೆ ನಿರ್ಮಿಸಲಾಗಿದೆ", hi: "भारत में 🌱 के साथ बनाया गया" },
  Loading: { kn: "ಲೋಡ್ ಆಗುತ್ತಿದೆ", hi: "लोड हो रहा है" },
  "Loading...": { kn: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...", hi: "लोड हो रहा है..." },
  "Working on that click...": { kn: "ಆ ಕ್ಲಿಕ್ ಮೇಲೆ ಕೆಲಸ ಮಾಡುತ್ತಿದೆ...", hi: "उस क्लिक पर काम हो रहा है..." },
  "Something went wrong": { kn: "ಏನೋ ತಪ್ಪಾಗಿದೆ", hi: "कुछ गलत हो गया" },
  "Something went wrong. Please try again.": {
    kn: "ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    hi: "कुछ गलत हो गया. कृपया फिर कोशिश करें.",
  },
  "The request could not be completed. Please try again.": {
    kn: "ವಿನಂತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    hi: "अनुरोध पूरा नहीं हो सका. कृपया फिर कोशिश करें.",
  },
  "Dashboard unavailable": { kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲಭ್ಯವಿಲ್ಲ", hi: "डैशबोर्ड उपलब्ध नहीं है" },
  "Refresh the dashboard data and try again.": {
    kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಡೇಟಾವನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    hi: "डैशबोर्ड डेटा रीफ़्रेश करें और फिर कोशिश करें.",
  },
  "Back to SproutBox": { kn: "SproutBoxಗೆ ಹಿಂತಿರುಗಿ", hi: "SproutBox पर वापस जाएं" },
  Email: { kn: "ಇಮೇಲ್", hi: "ईमेल" },
  Password: { kn: "ಪಾಸ್‌ವರ್ಡ್", hi: "पासवर्ड" },
  Confirm: { kn: "ದೃಢೀಕರಿಸಿ", hi: "पुष्टि करें" },
  "Full Name": { kn: "ಪೂರ್ಣ ಹೆಸರು", hi: "पूरा नाम" },
  Phone: { kn: "ಫೋನ್", hi: "फ़ोन" },
  City: { kn: "ನಗರ", hi: "शहर" },
  Address: { kn: "ವಿಳಾಸ", hi: "पता" },
  "PIN Code": { kn: "ಪಿನ್ ಕೋಡ್", hi: "पिन कोड" },
  "Select city": { kn: "ನಗರ ಆಯ್ಕೆಮಾಡಿ", hi: "शहर चुनें" },
  Bangalore: { kn: "ಬೆಂಗಳೂರು", hi: "बेंगलुरु" },
  Mumbai: { kn: "ಮುಂಬೈ", hi: "मुंबई" },
  Delhi: { kn: "ದೆಹಲಿ", hi: "दिल्ली" },
  "Space Type": { kn: "ಜಾಗದ ಪ್ರಕಾರ", hi: "स्थान का प्रकार" },
  "Area (sq ft)": { kn: "ವಿಸ್ತೀರ್ಣ (ಚ.ಅಡಿ)", hi: "क्षेत्रफल (वर्ग फुट)" },
  "Light Access": { kn: "ಬೆಳಕಿನ ಲಭ್ಯತೆ", hi: "रोशनी की उपलब्धता" },
  "Choose Your Kit": { kn: "ನಿಮ್ಮ ಕಿಟ್ ಆಯ್ಕೆಮಾಡಿ", hi: "अपनी किट चुनें" },
  "UPI ID (for payouts)": { kn: "UPI ID (ಪಾವತಿಗಳಿಗೆ)", hi: "UPI ID (भुगतान के लिए)" },
  "Restaurant Name": { kn: "ರೆಸ್ಟೋರೆಂಟ್ ಹೆಸರು", hi: "रेस्तरां का नाम" },
  "Contact Name": { kn: "ಸಂಪರ್ಕ ಹೆಸರು", hi: "संपर्क नाम" },
  "GST (optional)": { kn: "GST (ಐಚ್ಛಿಕ)", hi: "GST (वैकल्पिक)" },
  "Delivery Frequency": { kn: "ವಿತರಣಾ ಅವಧಿ", hi: "डिलीवरी आवृत्ति" },
  "Preferred Delivery Day": { kn: "ಇಷ್ಟದ ವಿತರಣಾ ದಿನ", hi: "पसंदीदा डिलीवरी दिन" },
  "Invalid email or password": { kn: "ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ತಪ್ಪಾಗಿದೆ", hi: "ईमेल या पासवर्ड गलत है" },
  "Passwords do not match": { kn: "ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ", hi: "पासवर्ड मेल नहीं खाते" },
  "Password must be at least 6 characters": {
    kn: "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಿರಬೇಕು",
    hi: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए",
  },
  Continue: { kn: "ಮುಂದುವರಿಸಿ", hi: "जारी रखें" },
  "Grow from home": { kn: "ಮನೆಯಿಂದ ಬೆಳೆಸಿ", hi: "घर से उगाएं" },
  "Order fresh produce": { kn: "ತಾಜಾ ಉತ್ಪನ್ನ ಆರ್ಡರ್ ಮಾಡಿ", hi: "ताज़ी उपज ऑर्डर करें" },
  "Your full name": { kn: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು", hi: "आपका पूरा नाम" },
  "Min. 6 chars": { kn: "ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು", hi: "कम से कम 6 अक्षर" },
  Pending: { kn: "ಬಾಕಿ", hi: "लंबित" },
  Active: { kn: "ಸಕ್ರಿಯ", hi: "सक्रिय" },
  Completed: { kn: "ಪೂರ್ಣಗೊಂಡಿದೆ", hi: "पूर्ण" },
  Cancelled: { kn: "ರದ್ದು", hi: "रद्द" },
  Growing: { kn: "ಬೆಳೆಯುತ್ತಿದೆ", hi: "उग रहा है" },
  Sowing: { kn: "ಬಿತ್ತನೆ", hi: "बुवाई" },
  Ready: { kn: "ಸಿದ್ಧ", hi: "तैयार" },
  Delivered: { kn: "ವಿತರಿಸಲಾಗಿದೆ", hi: "डिलीवर" },
  Failed: { kn: "ವಿಫಲ", hi: "विफल" },
  "In Review": { kn: "ಪರಿಶೀಲನೆಯಲ್ಲಿ", hi: "समीक्षा में" },
  "Active Tasks": { kn: "ಸಕ್ರಿಯ ಕೆಲಸಗಳು", hi: "सक्रिय कार्य" },
  "No active tasks": { kn: "ಸಕ್ರಿಯ ಕೆಲಸಗಳಿಲ್ಲ", hi: "कोई सक्रिय कार्य नहीं" },
  "Recent Activity": { kn: "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ", hi: "हाल की गतिविधि" },
  "No recent activity": { kn: "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ ಇಲ್ಲ", hi: "कोई हाल की गतिविधि नहीं" },
  "Weekly Earnings": { kn: "ವಾರದ ಆದಾಯ", hi: "साप्ताहिक कमाई" },
  "Total earned": { kn: "ಒಟ್ಟು ಗಳಿಕೆ", hi: "कुल कमाई" },
  "No tasks assigned": { kn: "ಯಾವುದೇ ಕೆಲಸಗಳನ್ನು ನೀಡಲಾಗಿಲ್ಲ", hi: "कोई कार्य असाइन नहीं" },
  Progress: { kn: "ಪ್ರಗತಿ", hi: "प्रगति" },
  "Account Details": { kn: "ಖಾತೆ ವಿವರಗಳು", hi: "खाता विवरण" },
  "Your account and payment details": {
    kn: "ನಿಮ್ಮ ಖಾತೆ ಮತ್ತು ಪಾವತಿ ವಿವರಗಳು",
    hi: "आपका खाता और भुगतान विवरण",
  },
  "Track your payouts and total earnings": {
    kn: "ನಿಮ್ಮ ಪಾವತಿಗಳು ಮತ್ತು ಒಟ್ಟು ಆದಾಯವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    hi: "अपने भुगतान और कुल कमाई ट्रैक करें",
  },
  "Total Earnings": { kn: "ಒಟ್ಟು ಆದಾಯ", hi: "कुल कमाई" },
  "Payout History": { kn: "ಪಾವತಿ ಇತಿಹಾಸ", hi: "भुगतान इतिहास" },
  "No payouts yet": { kn: "ಇನ್ನೂ ಪಾವತಿಗಳಿಲ್ಲ", hi: "अभी कोई भुगतान नहीं" },
  "Manage recurring microgreen deliveries": {
    kn: "ಮರುಕಳಿಸುವ ಮೈಕ್ರೋಗ್ರೀನ್ ವಿತರಣೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
    hi: "आवर्ती माइक्रोग्रीन डिलीवरी प्रबंधित करें",
  },
  "No subscriptions": { kn: "ಚಂದಾದಾರಿಕೆಗಳಿಲ್ಲ", hi: "कोई सदस्यता नहीं" },
  "Recent Orders": { kn: "ಇತ್ತೀಚಿನ ಆರ್ಡರ್‌ಗಳು", hi: "हाल के ऑर्डर" },
  "No orders yet": { kn: "ಇನ್ನೂ ಆರ್ಡರ್‌ಗಳಿಲ್ಲ", hi: "अभी कोई ऑर्डर नहीं" },
  "View and track all your orders": {
    kn: "ನಿಮ್ಮ ಎಲ್ಲಾ ಆರ್ಡರ್‌ಗಳನ್ನು ನೋಡಿ ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    hi: "अपने सभी ऑर्डर देखें और ट्रैक करें",
  },
  "Place your first microgreen order": {
    kn: "ನಿಮ್ಮ ಮೊದಲ ಮೈಕ್ರೋಗ್ರೀನ್ ಆರ್ಡರ್ ಮಾಡಿ",
    hi: "अपना पहला माइक्रोग्रीन ऑर्डर करें",
  },
  "Select microgreens and place your order": {
    kn: "ಮೈಕ್ರೋಗ್ರೀನ್ಸ್ ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಆರ್ಡರ್ ಮಾಡಿ",
    hi: "माइक्रोग्रीन्स चुनें और ऑर्डर करें",
  },
  "Order Cart": { kn: "ಆರ್ಡರ್ ಕಾರ್ಟ್", hi: "ऑर्डर कार्ट" },
  "Your cart is empty": { kn: "ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ", hi: "आपकी कार्ट खाली है" },
  "Estimated Total": { kn: "ಅಂದಾಜು ಒಟ್ಟು", hi: "अनुमानित कुल" },
  "Place Order & Start Growing": {
    kn: "ಆರ್ಡರ್ ಮಾಡಿ ಮತ್ತು ಬೆಳೆಯಲು ಪ್ರಾರಂಭಿಸಿ",
    hi: "ऑर्डर करें और उगाना शुरू करें",
  },
  "Delivery status": { kn: "ವಿತರಣಾ ಸ್ಥಿತಿ", hi: "डिलीवरी स्थिति" },
  "Delivery Feedback": { kn: "ವಿತರಣಾ ಪ್ರತಿಕ್ರಿಯೆ", hi: "डिलीवरी प्रतिक्रिया" },
  "Delivery feedback": { kn: "ವಿತರಣಾ ಪ್ರತಿಕ್ರಿಯೆ", hi: "डिलीवरी प्रतिक्रिया" },
  "Submit feedback": { kn: "ಪ್ರತಿಕ್ರಿಯೆ ಸಲ್ಲಿಸಿ", hi: "प्रतिक्रिया जमा करें" },
  "Build order": { kn: "ಆರ್ಡರ್ ನಿರ್ಮಿಸಿ", hi: "ऑर्डर बनाएं" },
  "Place order": { kn: "ಆರ್ಡರ್ ಮಾಡಿ", hi: "ऑर्डर करें" },
  "Track all deliveries from hub to restaurant": {
    kn: "ಹಬ್‌ನಿಂದ ರೆಸ್ಟೋರೆಂಟ್‌ವರೆಗೆ ಎಲ್ಲಾ ವಿತರಣೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    hi: "हब से रेस्तरां तक सभी डिलीवरी ट्रैक करें",
  },
  "No deliveries": { kn: "ವಿತರಣೆಗಳಿಲ್ಲ", hi: "कोई डिलीवरी नहीं" },
  "Deliveries will appear once orders are dispatched from hubs": {
    kn: "ಹಬ್‌ಗಳಿಂದ ಆರ್ಡರ್‌ಗಳು ಕಳುಹಿಸಿದ ನಂತರ ವಿತರಣೆಗಳು ಕಾಣುತ್ತವೆ",
    hi: "हब से ऑर्डर भेजे जाने पर डिलीवरी दिखाई देगी",
  },
  "Platform-wide performance metrics": {
    kn: "ವೇದಿಕೆಯಾದ್ಯಂತ ಕಾರ್ಯಕ್ಷಮತಾ ಅಳತೆಗಳು",
    hi: "पूरे प्लेटफ़ॉर्म के प्रदर्शन मेट्रिक्स",
  },
  "Detailed charts coming soon": { kn: "ವಿವರವಾದ ಚಾರ್ಟ್‌ಗಳು ಶೀಘ್ರದಲ್ಲೇ", hi: "विस्तृत चार्ट जल्द आएंगे" },
  "Revenue trends, production volume, QC rates, and leaderboards": {
    kn: "ಆದಾಯ ಪ್ರವೃತ್ತಿಗಳು, ಉತ್ಪಾದನಾ ಪ್ರಮಾಣ, ಗುಣಮಟ್ಟ ದರಗಳು ಮತ್ತು ಲೀಡರ್‌ಬೋರ್ಡ್‌ಗಳು",
    hi: "राजस्व रुझान, उत्पादन मात्रा, QC दरें और लीडरबोर्ड",
  },
  "Assign production tasks to growers based on scores": {
    kn: "ಸ್ಕೋರ್ ಆಧರಿಸಿ ಬೆಳೆಗಾರರಿಗೆ ಉತ್ಪಾದನಾ ಕೆಲಸಗಳನ್ನು ಹಂಚಿ",
    hi: "स्कोर के आधार पर उत्पादकों को उत्पादन कार्य दें",
  },
  "Grower Rankings": { kn: "ಬೆಳೆಗಾರರ ಶ್ರೇಯಾಂಕ", hi: "उत्पादक रैंकिंग" },
  Score: { kn: "ಸ್ಕೋರ್", hi: "स्कोर" },
  Trays: { kn: "ಟ್ರೇಗಳು", hi: "ट्रे" },
  "Dispatch Tasks": { kn: "ಕೆಲಸಗಳನ್ನು ಕಳುಹಿಸಿ", hi: "कार्य भेजें" },
  "No growers registered": { kn: "ಬೆಳೆಗಾರರು ನೋಂದಾಯಿಸಿಲ್ಲ", hi: "कोई उत्पादक पंजीकृत नहीं" },
  "Growers will appear here once they sign up": {
    kn: "ಬೆಳೆಗಾರರು ಸೈನ್ ಅಪ್ ಮಾಡಿದ ನಂತರ ಇಲ್ಲಿ ಕಾಣುತ್ತಾರೆ",
    hi: "उत्पादक साइन अप करने के बाद यहां दिखाई देंगे",
  },
  "Review grower check-in photos and approve quality": {
    kn: "ಬೆಳೆಗಾರರ ಚೆಕ್-ಇನ್ ಫೋಟೋಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಗುಣಮಟ್ಟ ಅನುಮೋದಿಸಿ",
    hi: "उत्पादक चेक-इन फ़ोटो देखें और गुणवत्ता स्वीकृत करें",
  },
  "Convert confirmed orders into production plans": {
    kn: "ದೃಢೀಕೃತ ಆರ್ಡರ್‌ಗಳನ್ನು ಉತ್ಪಾದನಾ ಯೋಜನೆಗಳಾಗಿ ಬದಲಿಸಿ",
    hi: "पुष्ट ऑर्डर को उत्पादन योजनाओं में बदलें",
  },
  "Weekly Production": { kn: "ವಾರದ ಉತ್ಪಾದನೆ", hi: "साप्ताहिक उत्पादन" },
  "Last 8 weeks": { kn: "ಕಳೆದ 8 ವಾರಗಳು", hi: "पिछले 8 सप्ताह" },
  "Total output (8 weeks)": { kn: "ಒಟ್ಟು ಉತ್ಪಾದನೆ (8 ವಾರಗಳು)", hi: "कुल उत्पादन (8 सप्ताह)" },
  "Top Growers": { kn: "ಮುಂಚೂಣಿ ಬೆಳೆಗಾರರು", hi: "शीर्ष उत्पादक" },
  score: { kn: "ಸ್ಕೋರ್", hi: "स्कोर" },
  "No active growers": { kn: "ಸಕ್ರಿಯ ಬೆಳೆಗಾರರಿಲ್ಲ", hi: "कोई सक्रिय उत्पादक नहीं" },
  "Manage grower payout processing": {
    kn: "ಬೆಳೆಗಾರರ ಪಾವತಿ ಪ್ರಕ್ರಿಯೆಯನ್ನು ನಿರ್ವಹಿಸಿ",
    hi: "उत्पादक भुगतान प्रक्रिया प्रबंधित करें",
  },
  Paid: { kn: "ಪಾವತಿಸಲಾಗಿದೆ", hi: "भुगतान हुआ" },
  "Recent Payouts": { kn: "ಇತ್ತೀಚಿನ ಪಾವತಿಗಳು", hi: "हाल के भुगतान" },
  "Assigned growers": { kn: "ಹಂಚಲಾದ ಬೆಳೆಗಾರರು", hi: "असाइन उत्पादक" },
  Composite: { kn: "ಸಂಯುಕ್ತ", hi: "संयुक्त" },
  Yield: { kn: "ಉತ್ಪಾದನೆ", hi: "उपज" },
  Quality: { kn: "ಗುಣಮಟ್ಟ", hi: "गुणवत्ता" },
  Activity: { kn: "ಚಟುವಟಿಕೆ", hi: "गतिविधि" },
  "Total with buffer": { kn: "ಬಫರ್ ಸಹಿತ ಒಟ್ಟು", hi: "बफ़र सहित कुल" },
  "Hub aggregation": { kn: "ಹಬ್ ಒಗ್ಗೂಡಿಕೆ", hi: "हब एग्रीगेशन" },
  "Use the API panel or route handler for PASS, RISK, and REJECT decisions.": {
    kn: "PASS, RISK ಮತ್ತು REJECT ನಿರ್ಧಾರಗಳಿಗೆ API ಪ್ಯಾನೆಲ್ ಅಥವಾ ರೂಟ್ ಹ್ಯಾಂಡ್ಲರ್ ಬಳಸಿ.",
    hi: "PASS, RISK और REJECT निर्णयों के लिए API पैनल या रूट हैंडलर का उपयोग करें.",
  },
  Cancel: { kn: "ರದ್ದುಮಾಡಿ", hi: "रद्द करें" },
  Submit: { kn: "ಸಲ್ಲಿಸಿ", hi: "जमा करें" },
  "Recurring supply plan": { kn: "ಮರುಕಳಿಸುವ ಪೂರೈಕೆ ಯೋಜನೆ", hi: "आवर्ती आपूर्ति योजना" },
  "Out of stock": { kn: "ಸ್ಟಾಕ್ ಇಲ್ಲ", hi: "स्टॉक समाप्त" },
  "About SproutBox": { kn: "SproutBox ಬಗ್ಗೆ", hi: "SproutBox के बारे में" },
  "Demand-driven, decentralized microgreen production": {
    kn: "ಬೇಡಿಕೆ ಆಧಾರಿತ, ವಿಕೇಂದ್ರೀಕೃತ ಮೈಕ್ರೋಗ್ರೀನ್ ಉತ್ಪಾದನೆ",
    hi: "मांग-आधारित, विकेंद्रीकृत माइक्रोग्रीन उत्पादन",
  },
  "Demand-driven, decentralized microgreen production and supply platform.": {
    kn: "ಬೇಡಿಕೆ ಆಧಾರಿತ, ವಿಕೇಂದ್ರೀಕೃತ ಮೈಕ್ರೋಗ್ರೀನ್ ಉತ್ಪಾದನೆ ಮತ್ತು ಪೂರೈಕೆ ವೇದಿಕೆ.",
    hi: "मांग-आधारित, विकेंद्रीकृत माइक्रोग्रीन उत्पादन और आपूर्ति प्लेटफ़ॉर्म.",
  },
  "SproutBox 2.0 · Demand-driven microgreen production": {
    kn: "SproutBox 2.0 · ಬೇಡಿಕೆ ಆಧಾರಿತ ಮೈಕ್ರೋಗ್ರೀನ್ ಉತ್ಪಾದನೆ",
    hi: "SproutBox 2.0 · मांग-आधारित माइक्रोग्रीन उत्पादन",
  },
  "Sunflower Shoots": { kn: "ಸೂರ್ಯಕಾಂತಿ ಚಿಗುರುಗಳು", hi: "सूरजमुखी शूट्स" },
  Sunflower: { kn: "ಸೂರ್ಯಕಾಂತಿ", hi: "सूरजमुखी" },
  "Pea Shoots": { kn: "ಬಟಾಣಿ ಚಿಗುರುಗಳು", hi: "मटर शूट्स" },
  Radish: { kn: "ಮೂಲಂಗಿ", hi: "मूली" },
  "Radish Microgreens": { kn: "ಮೂಲಂಗಿ ಮೈಕ್ರೋಗ್ರೀನ್ಸ್", hi: "मूली माइक्रोग्रीन्स" },
  "Wheat Grass": { kn: "ಗೋಧಿ ಹುಲ್ಲು", hi: "व्हीटग्रास" },
  "Mustard Greens": { kn: "ಸಾಸಿವೆ ಸೊಪ್ಪು", hi: "सरसों ग्रीन्स" },
  Fenugreek: { kn: "ಮೆಂತ್ಯೆ", hi: "मेथी" },
  "/kg": { kn: "/ಕೆ.ಜಿ", hi: "/किग्रा" },
};

const regexTranslations = [
  {
    pattern: /^Step (\d+)$/,
    replace: (language: Exclude<LanguageCode, "en">, value: string) =>
      language === "kn" ? `ಹಂತ ${value}` : `चरण ${value}`,
  },
  {
    pattern: /^(\d+) days$/,
    replace: (language: Exclude<LanguageCode, "en">, value: string) =>
      language === "kn" ? `${value} ದಿನಗಳು` : `${value} दिन`,
  },
  {
    pattern: /^Day (\d+) of (\d+)$/,
    replace: (language: Exclude<LanguageCode, "en">, day: string, total: string) =>
      language === "kn" ? `${total}ರಲ್ಲಿ ${day}ನೇ ದಿನ` : `${total} में से दिन ${day}`,
  },
];

const reverseTranslations = Object.entries(translations).reduce(
  (acc, [english, entry]) => {
    acc.kn.set(entry.kn, english);
    acc.hi.set(entry.hi, english);
    return acc;
  },
  { kn: new Map<string, string>(), hi: new Map<string, string>() }
);

function getTranslationKey(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function translateText(value: string, language: LanguageCode) {
  if (language === "en") return value;

  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const key = getTranslationKey(value);

  if (!key) return value;

  const exact = translations[key]?.[language];
  if (exact) return `${leading}${exact}${trailing}`;

  for (const { pattern, replace } of regexTranslations) {
    const match = key.match(pattern);
    if (match) {
      return `${leading}${replace(language, ...match.slice(1) as [string, string])}${trailing}`;
    }
  }

  return value;
}

export function restoreTranslatedText(value: string, language: LanguageCode) {
  if (language === "en") return value;

  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const key = getTranslationKey(value);
  const restored = reverseTranslations[language].get(key);

  return restored ? `${leading}${restored}${trailing}` : value;
}

export interface Language {
  id: string;
  code: string;
  nativeName: string;
  englishName: string;
  direction: 'ltr' | 'rtl';
}

export const LANGUAGES: Language[] = [
  {
    id: "hi",
    code: "hi-IN",
    nativeName: "हिन्दी",
    englishName: "Hindi",
    direction: "ltr"
  },
  {
    id: "pa",
    code: "pa-IN",
    nativeName: "ਪੰਜਾਬੀ",
    englishName: "Punjabi",
    direction: "ltr"
  },
  {
    id: "bn",
    code: "bn-IN",
    nativeName: "বাংলা",
    englishName: "Bengali",
    direction: "ltr"
  },
  {
    id: "mr",
    code: "mr-IN",
    nativeName: "मराठी",
    englishName: "Marathi",
    direction: "ltr"
  },
  {
    id: "gu",
    code: "gu-IN",
    nativeName: "ગુજરાતી",
    englishName: "Gujarati",
    direction: "ltr"
  },
  {
    id: "ta",
    code: "ta-IN",
    nativeName: "தமிழ்",
    englishName: "Tamil",
    direction: "ltr"
  },
  {
    id: "te",
    code: "te-IN",
    nativeName: "తెలుగు",
    englishName: "Telugu",
    direction: "ltr"
  },
  {
    id: "kn",
    code: "kn-IN",
    nativeName: "ಕನ್ನಡ",
    englishName: "Kannada",
    direction: "ltr"
  },
  {
    id: "ml",
    code: "ml-IN",
    nativeName: "മലയാളം",
    englishName: "Malayalam",
    direction: "ltr"
  },
  {
    id: "or",
    code: "or-IN",
    nativeName: "ଓଡ଼ିଆ",
    englishName: "Odia",
    direction: "ltr"
  },
  {
    id: "as",
    code: "as-IN",
    nativeName: "অসমীয়া",
    englishName: "Assamese",
    direction: "ltr"
  },
  {
    id: "ur",
    code: "ur-IN",
    nativeName: "اردو",
    englishName: "Urdu",
    direction: "rtl"
  },
  {
    id: "en",
    code: "en-US",
    nativeName: "English",
    englishName: "English",
    direction: "ltr"
  }
];

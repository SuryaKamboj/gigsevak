import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import Locale JSON resources
import en from './locales/en.json';
import hi from './locales/hi.json';
import pa from './locales/pa.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import or from './locales/or.json';
import as from './locales/as.json';
import ur from './locales/ur.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  pa: { translation: pa },
  bn: { translation: bn },
  mr: { translation: mr },
  gu: { translation: gu },
  ta: { translation: ta },
  te: { translation: te },
  kn: { translation: kn },
  ml: { translation: ml },
  or: { translation: or },
  as: { translation: as },
  ur: { translation: ur }
};

// Retrieve saved language from localStorage or default to 'en'
const savedLanguage = (() => {
  try {
    return localStorage.getItem('workerLanguage') || 'en';
  } catch {
    return 'en';
  }
})();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

/**
 * Browser Text-to-Speech using window.speechSynthesis & SpeechSynthesisUtterance
 */

export const SPEECH_LANG_MAP: Record<string, string> = {
  hi: 'hi-IN',
  pa: 'pa-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  as: 'as-IN',
  ur: 'ur-IN',
  en: 'en-IN',
  'en-US': 'en-US'
};

const LANG_FALLBACKS: Record<string, string[]> = {
  'as-IN': ['bn-IN', 'hi-IN', 'en-IN'],
  'or-IN': ['hi-IN', 'en-IN'],
  'ur-IN': ['ur-PK', 'hi-IN', 'ar-SA', 'en-IN'],
  'pa-IN': ['hi-IN', 'en-IN'],
  'mr-IN': ['hi-IN', 'en-IN'],
  'gu-IN': ['hi-IN', 'en-IN'],
  'kn-IN': ['hi-IN', 'en-IN'],
  'ml-IN': ['hi-IN', 'en-IN'],
  'te-IN': ['hi-IN', 'en-IN'],
  'ta-IN': ['hi-IN', 'en-IN'],
  'bn-IN': ['hi-IN', 'en-IN']
};

const activeUtterances = new Set<SpeechSynthesisUtterance>();
let cachedVoices: SpeechSynthesisVoice[] = [];

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisSupported()) {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }

    const onVoicesChanged = () => {
      voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        cachedVoices = voices;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(voices);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    setTimeout(() => {
      voices = window.speechSynthesis.getVoices();
      cachedVoices = voices || [];
      resolve(cachedVoices);
    }, 1000);
  });
}

if (typeof window !== 'undefined' && isSpeechSynthesisSupported()) {
  loadVoices();
}

export function findBestVoice(langCode: string): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) {
    return null;
  }

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return null;
  }

  cachedVoices = voices;
  const targetBcp47 = SPEECH_LANG_MAP[langCode] || langCode;
  const langPrefix = targetBcp47.split('-')[0].toLowerCase();

  const exactGoogleVoice = voices.find(
    (v) =>
      (v.lang === targetBcp47 || v.lang.replace('_', '-') === targetBcp47) &&
      v.name.includes('Google')
  );
  if (exactGoogleVoice) return exactGoogleVoice;

  const exactVoice = voices.find(
    (v) => v.lang === targetBcp47 || v.lang.replace('_', '-') === targetBcp47
  );
  if (exactVoice) return exactVoice;

  const prefixGoogleVoice = voices.find(
    (v) => v.lang.toLowerCase().startsWith(langPrefix) && v.name.includes('Google')
  );
  if (prefixGoogleVoice) return prefixGoogleVoice;

  const prefixVoice = voices.find((v) =>
    v.lang.toLowerCase().startsWith(langPrefix)
  );
  if (prefixVoice) return prefixVoice;

  const fallbacks = LANG_FALLBACKS[targetBcp47] || [];
  for (const fallbackCode of fallbacks) {
    const fallbackPrefix = fallbackCode.split('-')[0].toLowerCase();
    const fallbackVoice = voices.find(
      (v) =>
        v.lang === fallbackCode ||
        v.lang.toLowerCase().startsWith(fallbackPrefix)
    );
    if (fallbackVoice) return fallbackVoice;
  }

  return voices.find((v) => v.default) || voices[0] || null;
}

export function stopSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
    activeUtterances.clear();
  } catch (err) {
    console.warn('Error cancelling speech synthesis:', err);
  }
}

export interface SpeakTextOptions {
  langCode?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: (event: SpeechSynthesisEvent) => void;
  onEnd?: (event: SpeechSynthesisEvent) => void;
  onError?: (event: any) => void;
}

export function speakText(text: string, options: SpeakTextOptions = {}): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported() || !text || !text.trim()) {
    if (options.onError) {
      options.onError(new Error('window.speechSynthesis is not supported or text is empty'));
    }
    return null;
  }

  const {
    langCode = 'en',
    rate = 0.9,
    pitch = 1.0,
    volume = 1.0,
    onStart,
    onEnd,
    onError
  } = options;

  try {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    console.warn('Speech cancel warning:', e);
  }

  const targetBcp47 = SPEECH_LANG_MAP[langCode] || langCode;
  const utterance = new window.SpeechSynthesisUtterance(text.trim());

  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  const matchedVoice = findBestVoice(langCode);
  if (matchedVoice) {
    utterance.voice = matchedVoice;
    utterance.lang = matchedVoice.lang || targetBcp47;
  } else {
    utterance.lang = targetBcp47;
  }

  activeUtterances.add(utterance);

  utterance.onstart = (event) => {
    if (onStart) onStart(event);
  };

  const cleanup = () => {
    activeUtterances.delete(utterance);
  };

  utterance.onend = (event) => {
    cleanup();
    if (onEnd) onEnd(event);
  };

  utterance.onerror = (event) => {
    cleanup();
    if (event.error !== 'canceled' && event.error !== 'interrupted') {
      console.warn('SpeechSynthesis error:', event.error);
    }
    if (onError) onError(event);
  };

  setTimeout(() => {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      cleanup();
      console.warn('window.speechSynthesis.speak failed:', err);
      if (onError) onError(err);
    }
  }, 20);

  return utterance;
}

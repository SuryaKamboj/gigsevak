import { useState, useEffect, useCallback } from 'react';
import {
  speakText,
  stopSpeech,
  isSpeechSynthesisSupported,
  loadVoices,
  type SpeakTextOptions
} from '../utils/textToSpeech';

export function useTextToSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  useEffect(() => {
    const supported = isSpeechSynthesisSupported();
    setIsSupported(supported);
    if (supported) {
      loadVoices();
    }
  }, []);

  const speak = useCallback((text: string, options: SpeakTextOptions = {}) => {
    if (!text || !text.trim()) return;

    setIsSpeaking(true);
    setSpeakingText(text);

    speakText(text, {
      ...options,
      onStart: (e) => {
        setIsSpeaking(true);
        setSpeakingText(text);
        if (options.onStart) options.onStart(e);
      },
      onEnd: (e) => {
        setIsSpeaking(false);
        setSpeakingText(null);
        if (options.onEnd) options.onEnd(e);
      },
      onError: (e) => {
        setIsSpeaking(false);
        setSpeakingText(null);
        if (options.onError) options.onError(e);
      }
    });
  }, []);

  const stop = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
    setSpeakingText(null);
  }, []);

  return {
    isSupported,
    isSpeaking,
    speakingText,
    speak,
    stop
  };
}

export default useTextToSpeech;

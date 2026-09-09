import React, { useState } from 'react';
import { Mic, Volume2, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const VoicePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);

  const sampleCommands = activeLangCode === 'hi'
    ? [
        '“मेरी अगली सेवा बुकिंग क्या है?”',
        '“ग्राहक राहुल शर्मा को कॉल करें”',
        '“मॉडल टाउन, जालंधर के लिए रास्ता दिखाएं”',
        '“वर्तमान कार्य को पूर्ण चिह्नित करें”',
        '“आज मैंने कितना कमाया?”',
      ]
    : activeLangCode === 'pa'
    ? [
        '“ਮੇਰੀ ਅਗਲੀ ਬੁਕਿੰਗ ਕੀ ਹੈ?”',
        '“ਗਾਹਕ ਰਾਹੁਲ ਸ਼ਰਮਾ ਨੂੰ ਕਾਲ ਕਰੋ”',
        '“ਮਾਡਲ ਟਾਊਨ ਲਈ ਰਸਤਾ ਦਿਖਾਓ”',
        '“ਕੰਮ ਨੂੰ ਪੂਰਾ ਚਿੰਨ੍ਹਿਤ ਕਰੋ”',
        '“ਅੱਜ ਦੀ ਕੁੱਲ ਕਮਾਈ ਕਿੰਨੀ ਹੈ?”',
      ]
    : [
        '“What is my next service booking?”',
        '“Call customer Rahul Sharma”',
        '“Navigate to Model Town, Jalandhar”',
        '“Mark current task as completed”',
        '“How much did I earn today?”',
      ];

  const toggleListening = () => {
    if (!isListening) {
      setIsListening(true);
      setTranscript(t('dashboard.listening', 'Listening to your voice command...'));
      setTimeout(() => {
        setTranscript(sampleCommands[0]);
        setIsListening(false);
      }, 2200);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-light text-brand-primary text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('dashboard.aiVoiceAssistant', 'AI Voice Assistant')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-dark">
          {t('dashboard.voiceAssistance', 'Voice Assistance')}
        </h1>
      </div>

      {/* Mic Action Card */}
      <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping" />
          )}
          <button
            onClick={toggleListening}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white shadow-red-500/30 scale-110'
                : 'bg-brand-primary hover:bg-brand-hover text-white shadow-brand-primary/30 hover:scale-105 active:scale-95'
            }`}
          >
            <Mic className={`w-10 h-10 ${isListening ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-base font-bold text-neutral-dark">
            {isListening ? t('dashboard.listening', 'Listening...') : t('dashboard.tapToSpeak', 'Tap microphone to speak')}
          </p>
          <p className="text-xs text-neutral-muted">
            {transcript || t('dashboard.voiceSupportHint', 'Supports Hindi, Punjabi, Hinglish & English')}
          </p>
        </div>

        {transcript && (
          <div className="w-full bg-neutral-50 rounded-2xl p-4 text-sm text-neutral-800 border border-neutral-100 font-medium">
            <span className="text-xs text-brand-primary uppercase font-bold block mb-1">
              {t('dashboard.detectedCommand', 'Detected Command')}:
            </span>
            {transcript}
          </div>
        )}
      </div>

      {/* Suggested Quick Commands */}
      <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-100 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-neutral-dark">
          <Volume2 className="w-4 h-4 text-brand-primary" />
          <span>{t('dashboard.trySaying', 'Try saying commands like:')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {sampleCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => setTranscript(cmd)}
              className="text-left p-3 rounded-xl bg-white hover:bg-neutral-100/80 border border-neutral-200/70 text-xs font-medium text-neutral-700 transition flex items-center justify-between group cursor-pointer"
            >
              <span>{cmd}</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

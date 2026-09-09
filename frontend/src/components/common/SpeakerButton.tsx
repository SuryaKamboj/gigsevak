import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

interface SpeakerButtonProps {
  text: string;
  langCode?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'badge' | 'button';
  className?: string;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export const SpeakerButton: React.FC<SpeakerButtonProps> = ({
  text,
  langCode = 'en',
  label,
  size = 'md',
  variant = 'icon',
  className = '',
  onSpeechStart,
  onSpeechEnd
}) => {
  const { isSupported, isSpeaking, speakingText, speak, stop } = useTextToSpeech();

  if (!isSupported || !text) {
    return null;
  }

  const isCurrentSpeaking = isSpeaking && speakingText === text;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isCurrentSpeaking) {
      stop();
      if (onSpeechEnd) onSpeechEnd();
    } else {
      speak(text, {
        langCode,
        onStart: onSpeechStart,
        onEnd: onSpeechEnd
      });
    }
  };

  const iconSizes = { sm: 16, md: 19, lg: 22 };
  const iconPixel = iconSizes[size] || 19;

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label || 'Listen audio instructions'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
          isCurrentSpeaking
            ? 'bg-[#1C516C] text-white border-[#1C516C] shadow-sm animate-pulse'
            : 'bg-[#F5F0DD] text-[#1C516C] border-[#E9E2C6] hover:bg-[#E9E2C6]'
        } ${className}`}
      >
        {isCurrentSpeaking ? (
          <VolumeX size={iconPixel} className="animate-spin" />
        ) : (
          <Volume2 size={iconPixel} />
        )}
        <span>{label || (isCurrentSpeaking ? 'Stop' : 'Listen')}</span>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label || 'Listen audio'}
        className={`h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 border transition-all ${
          isCurrentSpeaking
            ? 'bg-[#1C516C] text-white border-[#1C516C] shadow-sm'
            : 'bg-white text-[#1C516C] border-[#1C516C]/20 hover:bg-[#F5F0DD]/50'
        } ${className}`}
      >
        <Volume2 size={iconPixel} className={isCurrentSpeaking ? 'animate-bounce' : ''} />
        <span>{label || (isCurrentSpeaking ? 'Stop Audio' : 'Listen Instructions')}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label || `Listen ${text}`}
      title={label || `Listen: ${text}`}
      className={`relative p-2 rounded-xl transition-all flex items-center justify-center ${
        isCurrentSpeaking
          ? 'bg-[#1C516C] text-white shadow-sm ring-2 ring-[#1C516C]/30 scale-105'
          : 'text-[#1C516C] bg-white border border-[#1C516C]/20 hover:bg-[#F5F0DD]/60 hover:text-[#133B50]'
      } ${className}`}
    >
      <Volume2 size={iconPixel} className={isCurrentSpeaking ? 'animate-pulse' : ''} />
      {isCurrentSpeaking && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FDA649] rounded-full animate-ping" />
      )}
    </button>
  );
};

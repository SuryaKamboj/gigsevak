import React from 'react';

export interface OTPTimerProps {
  secondsLeft?: number;
  timeString?: string;
  isExpired?: boolean;
  className?: string;
}

const formatSeconds = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Dynamic OTP validity countdown timer component.
 */
export const OTPTimer: React.FC<OTPTimerProps> = ({
  secondsLeft,
  timeString,
  isExpired,
  className = '',
}) => {
  const expired = isExpired ?? (secondsLeft !== undefined ? secondsLeft <= 0 : false);
  const formattedTime = secondsLeft !== undefined ? formatSeconds(secondsLeft) : (timeString || '02:00');

  return (
    <div className={`text-center py-1 ${className}`}>
      {expired ? (
        <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#953638] bg-rose-50 border border-rose-200 px-3 py-1 rounded-full animate-fadeIn">
          OTP expired. Please resend code.
        </span>
      ) : (
        <span className="text-xs sm:text-sm text-[#6B6B6B] font-medium tracking-wide">
          OTP valid for <span className="font-semibold text-[#222222] tabular-nums">{formattedTime}</span>
        </span>
      )}
    </div>
  );
};


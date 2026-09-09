import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

interface PhoneInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id = 'phone-input',
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}) => {
  const { t, i18n } = useTranslation();
  const activeLangCode = i18n.language || localStorage.getItem('workerLanguage') || 'en';

  const labelText = t('onboarding.step1', { lng: activeLangCode }) || 'Mobile Number';
  const placeholderText = t('auth.mobileNumber.placeholder', { lng: activeLangCode }) || 'Enter 10-digit mobile number';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(rawVal);
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs sm:text-sm font-semibold text-[#17212B] tracking-wide"
      >
        {labelText}
      </label>

      <div
        className={`w-full h-12 flex items-center bg-white rounded-xl border transition-colors overflow-hidden ${
          error
            ? 'border-[#953638] ring-1 ring-[#953638]/30'
            : 'border-[#D9D9D9] focus-within:border-[#1C516C] focus-within:ring-2 focus-within:ring-[#1C516C]/20'
        } ${disabled ? 'bg-slate-50 opacity-70' : ''}`}
      >
        {/* Country Code Prefix */}
        <div className="h-full px-3.5 flex items-center justify-center bg-slate-50 border-r border-[#D9D9D9] text-[#17212B] font-semibold text-sm select-none">
          +91
        </div>

        {/* Numeric Input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          pattern="[0-9]*"
          maxLength={10}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholderText}
          className="flex-1 h-full px-3.5 text-[15px] sm:text-base text-[#17212B] placeholder:text-[#66737D]/60 bg-transparent outline-none focus:outline-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-[#953638] font-medium mt-0.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

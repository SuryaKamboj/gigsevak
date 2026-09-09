import React from 'react';
import { AuthLogo } from './AuthLogo';
import { WorkerOnboardingProgress, type WorkerOnboardingProgressProps } from './WorkerOnboardingProgress';
import { LanguagePickerBadge } from '../common/LanguagePickerBadge';

interface AuthLayoutProps {
  children: React.ReactNode;
  progress?: WorkerOnboardingProgressProps;
  hideLanguagePicker?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, progress, hideLanguagePicker = false }) => {
  return (
    <main className="min-h-[100dvh] w-full bg-slate-50/60 sm:bg-slate-50/50 flex flex-col justify-center items-center p-4 sm:p-6 py-4 sm:py-6 antialiased">
      <div className="w-full max-w-[460px] sm:max-w-[480px] mx-auto flex flex-col items-center">
        {/* Top Header with Logo and Language Selector */}
        <header className="mb-2 sm:mb-3 flex flex-col items-center gap-1 w-full relative">
          {!hideLanguagePicker && (
            <div className="absolute right-0 top-0">
              <LanguagePickerBadge />
            </div>
          )}
          <AuthLogo />
          {progress && (
            <div className="w-full -mt-2 sm:-mt-3">
              <WorkerOnboardingProgress {...progress} />
            </div>
          )}
        </header>

        {/* Content Box */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 sm:border-slate-100 shadow-card p-7 sm:p-10">
          <div className="w-full flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
};

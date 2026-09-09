import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountSection } from '../../account-module';
import type { WorkerProfile } from '../../account-module';
import { authService } from '../../services/authService';

export interface AccountPageProps {
  onBack?: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onBack }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/worker/login');
  };

  // Pre-populate with any authenticated worker or onboarding session data if available
  const initialWorker: Partial<WorkerProfile> = React.useMemo(() => {
    const session = authService.getCurrentUser();
    const savedPhone = localStorage.getItem('user_mobile_number');
    const phone = savedPhone || (session?.phoneNumber ? `+91 ${session.phoneNumber}` : undefined);
    const name = session?.name || undefined;

    let preferredWorkingAreas: string[] | undefined;
    try {
      const raw = sessionStorage.getItem('gigsevak_worker_categories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          preferredWorkingAreas = parsed.map((c: string) =>
            c.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
          );
        }
      }
    } catch {
      // ignore
    }

    let currentAddress: string | undefined;
    let city: string | undefined;
    try {
      const rawLoc = sessionStorage.getItem('gigsevak_worker_location');
      if (rawLoc) {
        const loc = JSON.parse(rawLoc);
        if (loc?.name) currentAddress = loc.name;
        if (loc?.city) city = loc.city;
      }
    } catch {
      // ignore
    }

    return {
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
      ...(currentAddress ? { currentAddress } : {}),
      ...(city ? { city } : {}),
      ...(preferredWorkingAreas ? { preferredWorkingAreas } : {}),
    };
  }, []);

  return (
    <div className="w-full">
      <AccountSection
        initialWorker={initialWorker}
        onLogout={handleLogout}
        onBack={onBack}
        syncHashRouting={false}
      />
    </div>
  );
};

export default AccountPage;

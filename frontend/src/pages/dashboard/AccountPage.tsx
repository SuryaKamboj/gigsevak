import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountSection } from '../../account-module';
import type { WorkerProfile } from '../../account-module';
import { authService } from '../../services/authService';
import { workerBackendService } from '../../services/workerBackendService';

export interface AccountPageProps {
  onBack?: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [backendProfile, setBackendProfile] = useState<Partial<WorkerProfile> | null>(null);

  const handleLogout = () => {
    authService.logout();
    navigate('/worker/language', { replace: true });
  };

  // Fetch real worker profile from backend on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await workerBackendService.getProfile();
        const data = res?.data || res;
        if (data && isMounted) {
          setBackendProfile({
            name: data.name || data.fullName,
            phone: data.phone || data.mobileNumber,
            avatar: data.avatarUrl || data.image || data.profilePhoto,
            primarySkill: data.primarySkill || data.category,
            yearsOfExperience: data.yearsOfExperience !== undefined ? String(data.yearsOfExperience) : undefined,
            skillLevel: data.skillLevel,
            servicesOffered: data.servicesOffered,
            toolsAndEquipment: data.toolsAndEquipment,
            availableDays: data.availableDays,
            workingHoursStart: data.workingHoursStart,
            workingHoursEnd: data.workingHoursEnd,
            workType: data.workType,
            aboutMe: data.aboutMe,
            previousWorkExperience: data.previousWorkExperience,
            certifications: Array.isArray(data.certifications)
              ? data.certifications.map((c: any) => (typeof c === 'string' ? c : c.name || ''))
              : undefined,
            trainingCompleted: data.trainingCompleted,
            portfolio: Array.isArray(data.portfolio) ? data.portfolio : undefined,
            currentAddress: data.currentAddress,
            city: data.city,
            pincode: data.pincode,
            preferredWorkingAreas: data.preferredWorkingAreas,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
          });
        }
      } catch (err) {
        console.warn('[AccountPage] Notice loading backend profile:', err);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

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
      ...(backendProfile || {}),
    };
  }, [backendProfile]);

  // Persist updates to MongoDB
  const handleSaveProfile = async (updated: WorkerProfile) => {
    try {
      await workerBackendService.updateProfile(updated);
    } catch (err) {
      console.warn('[AccountPage] Error saving profile to backend:', err);
    }
  };

  return (
    <div className="w-full">
      <AccountSection
        initialWorker={initialWorker}
        onLogout={handleLogout}
        onSaveProfile={handleSaveProfile}
        onBack={onBack}
        syncHashRouting={false}
      />
    </div>
  );
};

export default AccountPage;

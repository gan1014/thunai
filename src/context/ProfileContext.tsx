import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, LanguageCode } from '../types';
import { api } from '../api/client';
import i18n, { getSavedLanguage, changeAppLanguage, SupportedLanguage } from '../i18n';

interface ProfileContextType {
  profile: UserProfile;
  profiles: UserProfile[];
  loading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchProfile: (id: number) => Promise<void>;
  createNewProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  refreshProfiles: () => Promise<void>;
  setAppLanguage: (lang: SupportedLanguage | LanguageCode | string) => Promise<void>;
}

const initialSavedLang = getSavedLanguage();

const DEFAULT_PROFILE: UserProfile = {
  id: 1,
  name: 'Arun Kumar (Visual Assistance)',
  accessibility_need: 'visual',
  preferred_language: initialSavedLang as LanguageCode,
  preferred_output: 'voice',
  text_size: 'xlarge',
  interaction_level: 'moderate',
  emergency_mode: true,
  high_contrast: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [profiles, setProfiles] = useState<UserProfile[]>([DEFAULT_PROFILE]);
  const [loading, setLoading] = useState(true);

  const refreshProfiles = async () => {
    try {
      setLoading(true);
      const list = await api.getAllProfiles();
      if (list && list.length > 0) {
        setProfiles(list);
        const current = list.find((p) => p.id === profile.id) || list[0];
        // Retain saved language if user set it explicitly
        const currentLang = getSavedLanguage();
        setProfile({
          ...current,
          preferred_language: (currentLang || current.preferred_language || 'en') as LanguageCode,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch profiles, using default:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  // Listen for language changes from i18n
  useEffect(() => {
    const handleLanguageEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: SupportedLanguage }>;
      if (customEvent.detail?.language) {
        setProfile((prev) => ({
          ...prev,
          preferred_language: customEvent.detail.language as LanguageCode,
        }));
      }
    };

    window.addEventListener('thunai:language_changed', handleLanguageEvent);
    return () => {
      window.removeEventListener('thunai:language_changed', handleLanguageEvent);
    };
  }, []);

  const setAppLanguage = useCallback(async (lang: SupportedLanguage | LanguageCode | string) => {
    const validLang = (lang === 'ta' || lang === 'te' || lang === 'hi' || lang === 'en') ? lang as SupportedLanguage : 'en';
    await changeAppLanguage(validLang);
    setProfile((prev) => ({
      ...prev,
      preferred_language: validLang as LanguageCode,
    }));
    try {
      await api.updateProfile(profile.id, { preferred_language: validLang as LanguageCode });
    } catch (err) {
      // Ignored for offline/local storage fallback
    }
  }, [profile.id]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (updates.preferred_language) {
      const lang = updates.preferred_language as SupportedLanguage;
      if (lang === 'en' || lang === 'ta' || lang === 'te' || lang === 'hi') {
        await changeAppLanguage(lang);
      }
    }

    try {
      const updated = await api.updateProfile(profile.id, updates);
      setProfile(updated);
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      console.error('Failed to update profile:', err);
      // Fallback local update
      setProfile((prev) => ({ ...prev, ...updates, updated_at: new Date().toISOString() }));
    }
  };

  const switchProfile = async (id: number) => {
    try {
      const target = profiles.find((p) => p.id === id) || (await api.getProfile(id));
      if (target) {
        setProfile(target);
        if (target.preferred_language) {
          const lang = target.preferred_language as SupportedLanguage;
          if (lang === 'en' || lang === 'ta' || lang === 'te' || lang === 'hi') {
            await changeAppLanguage(lang);
          }
        }
      }
    } catch (err) {
      console.error('Failed to switch profile:', err);
    }
  };

  const createNewProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const created = await api.createProfile(data);
    setProfiles((prev) => [...prev, created]);
    setProfile(created);
    return created;
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        profiles,
        loading,
        updateProfile,
        switchProfile,
        createNewProfile,
        refreshProfiles,
        setAppLanguage,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

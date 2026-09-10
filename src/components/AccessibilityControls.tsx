import React from 'react';
import { useTranslation } from 'react-i18next';
import { Type, Eye, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useAssistant } from '../context/AssistantContext';
import { LanguageCode, TextSize } from '../types';

export const AccessibilityControls: React.FC = () => {
  const { t } = useTranslation();
  const { profile, updateProfile, setAppLanguage } = useProfile();
  const { soundEnabled, setSoundEnabled } = useAssistant();

  const handleTextSizeCycle = () => {
    const order: TextSize[] = ['small', 'medium', 'large', 'xlarge'];
    const nextIdx = (order.indexOf(profile.text_size) + 1) % order.length;
    updateProfile({ text_size: order[nextIdx] });
  };

  const handleLanguageChange = (code: LanguageCode) => {
    setAppLanguage(code);
  };

  const toggleContrast = () => {
    updateProfile({ high_contrast: !profile.high_contrast });
  };

  const toggleEmergency = () => {
    updateProfile({ emergency_mode: !profile.emergency_mode });
  };

  const languageLabels: Record<'en' | 'ta' | 'te' | 'hi', string> = {
    ta: 'தமிழ்',
    en: 'EN',
    te: 'తెలుగు',
    hi: 'हिन्दी',
  };

  return (
    <div
      id="accessibility-quick-toolbar"
      role="region"
      aria-label={t('settings.subtitle')}
      className="fixed bottom-4 left-4 z-50 bg-slate-900/95 backdrop-blur-md border-2 border-slate-700 p-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs"
    >
      {/* Text Size Cycler */}
      <button
        type="button"
        onClick={handleTextSizeCycle}
        aria-label={`${t('settings.textSize')}, ${profile.text_size}`}
        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
        title={t('settings.textSize')}
      >
        <Type className="w-3.5 h-3.5 text-blue-400" />
        <span className="uppercase text-[11px]">{profile.text_size.slice(0, 2)}</span>
      </button>

      {/* High Contrast Mode */}
      <button
        type="button"
        onClick={toggleContrast}
        aria-label={`${t('header.highContrast')}, ${profile.high_contrast ? t('common.active') : t('common.inactive')}`}
        className={`p-2 rounded-xl transition-colors cursor-pointer ${
          profile.high_contrast
            ? 'bg-yellow-400 text-black font-bold ring-2 ring-yellow-300'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
        }`}
        title={t('header.highContrast')}
      >
        <Eye className="w-4 h-4" />
      </button>

      {/* Sound / Voice Toggle */}
      <button
        type="button"
        onClick={() => setSoundEnabled(!soundEnabled)}
        aria-label={`Audio Alerts: ${soundEnabled ? t('common.active') : t('common.inactive')}`}
        className={`p-2 rounded-xl transition-colors cursor-pointer ${
          soundEnabled
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
        }`}
        title="Toggle Sound Effects & Voice Alerts"
      >
        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {/* Language Quick-Switch */}
      <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
        {(['ta', 'en', 'te', 'hi'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => handleLanguageChange(lang)}
            aria-label={`Switch language to ${languageLabels[lang]}`}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              profile.preferred_language === lang
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {languageLabels[lang]}
          </button>
        ))}
      </div>

      {/* Emergency Mode Switch */}
      <button
        type="button"
        onClick={toggleEmergency}
        aria-label={t('emergency.title')}
        className={`p-2 rounded-xl transition-colors cursor-pointer ${
          profile.emergency_mode
            ? 'bg-red-600 text-white'
            : 'bg-slate-800 text-slate-500 hover:text-slate-300'
        }`}
        title={t('emergency.title')}
      >
        <ShieldAlert className="w-4 h-4" />
      </button>
    </div>
  );
};

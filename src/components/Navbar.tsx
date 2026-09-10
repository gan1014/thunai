import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, User, Globe, Eye, Menu, X, Volume2, ShieldAlert, Keyboard, Mic } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useAssistant } from '../context/AssistantContext';
import { SUPPORTED_LANGUAGES, changeAppLanguage, SupportedLanguage } from '../i18n';
import { NavTab } from './Sidebar';

interface NavbarProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
  onTabChange?: (tab: NavTab) => void;
  activeTab?: NavTab;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMenuToggle,
  isSidebarOpen,
  onTabChange,
  activeTab,
}) => {
  const { t, i18n } = useTranslation();
  const { profile, profiles, switchProfile, updateProfile, setAppLanguage } = useProfile();
  const { sonarActive, toggleSonar, openEmergency, openShortcuts } = useAssistant();

  const currentLang = (i18n.language || profile.preferred_language || 'en').toLowerCase().split('-')[0] as SupportedLanguage;

  const handleLanguageSelect = async (langCode: SupportedLanguage) => {
    if (langCode === currentLang) return;
    await setAppLanguage(langCode);
  };

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 lg:px-6 py-2.5 transition-colors"
      role="banner"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 max-w-7xl mx-auto">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label={t('nav.help', 'Toggle Navigation Menu')}
            className="p-2 -ml-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">{t('app.fullName', 'SAHAY-X')}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {t('app.aareAi', 'AARE AI')}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" aria-hidden="true" />
                  {t('app.realTimeReady', 'Real-Time Ready')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                {t('app.description', 'Situation-Aware Multimodal Accessibility Intelligence')}
              </p>
            </div>
          </div>
        </div>

        {/* Center: High Visibility Multilingual Language Switcher */}
        <div
          className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1 shadow-inner shadow-black/40 order-last md:order-none w-full md:w-auto justify-center sm:justify-start overflow-x-auto"
          role="region"
          aria-label={t('header.languageSelector', 'Application Language Selector')}
        >
          <div className="flex items-center gap-1 px-2 text-slate-400 text-xs font-bold shrink-0">
            <Globe className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
            <span className="hidden xl:inline">{t('common.language', 'Language')}</span>
          </div>

          <div className="flex items-center gap-1" role="radiogroup" aria-label="Select interface language">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${lang.label} (${lang.nativeName})`}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 whitespace-nowrap ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-white/30 scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {lang.nativeName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Action Controls & Emergency SOS */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* 1-Click Find Exit / Voice Spatial Assistant Button */}
          <button
            type="button"
            onClick={() => onTabChange && onTabChange('assistant')}
            aria-label={t('header.findExit', 'Find Exit Door via Spatial Vision & Voice')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            title={t('header.findExit', 'Find Exit Door via Spatial Vision & Voice')}
          >
            <Mic className="w-3.5 h-3.5 animate-bounce" aria-hidden="true" />
            <span className="hidden sm:inline">🚪 {t('header.findExit', 'Find Exit')}</span>
            <span className="sm:hidden">🚪</span>
          </button>

          {/* Acoustic Sonar Toggle */}
          <button
            type="button"
            onClick={toggleSonar}
            aria-label={`${t('header.acousticSonar', 'Sonar')}, ${sonarActive ? t('common.active', 'active') : t('common.inactive', 'inactive')}`}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              sonarActive
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Acoustic Proximity Sonar (Alt+S)"
          >
            <Volume2 className={`w-3.5 h-3.5 ${sonarActive ? 'animate-pulse text-blue-400' : ''}`} aria-hidden="true" />
            <span>{sonarActive ? t('header.sonarOn', 'Sonar ON') : t('header.sonarOff', 'Sonar OFF')}</span>
          </button>

          {/* Emergency SOS Button */}
          <button
            type="button"
            onClick={openEmergency}
            aria-label={t('header.emergencySos', 'Trigger Critical Emergency SOS')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
            title="Trigger Critical Emergency SOS (Alt+E)"
          >
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
            <span>{t('header.emergencySos', 'SOS')}</span>
          </button>

          {/* User Persona Switcher */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <select
              value={profile.id}
              onChange={(e) => switchProfile(Number(e.target.value))}
              aria-label={t('settings.profileName', 'Select User Persona')}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Keyboard Shortcuts Button */}
          <button
            type="button"
            onClick={openShortcuts}
            aria-label={t('header.shortcuts', 'Keyboard Shortcuts Guide')}
            className="hidden sm:flex p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="Keyboard Shortcuts (Alt+K)"
          >
            <Keyboard className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* High-Contrast Quick Button */}
          <button
            type="button"
            onClick={() => updateProfile({ high_contrast: !profile.high_contrast })}
            aria-label={t('header.highContrast', 'Toggle High Contrast Mode')}
            className={`p-2 rounded-xl border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
              profile.high_contrast
                ? 'bg-yellow-400 text-black border-yellow-300 font-bold shadow-md shadow-yellow-400/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle High Contrast Mode (Alt+H)"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};

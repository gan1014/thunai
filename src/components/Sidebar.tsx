import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Bot,
  Eye,
  Mic,
  Hand,
  Subtitles,
  FileText,
  BarChart3,
  User,
  FlaskConical,
  Trophy,
  Presentation,
  MessageCircle,
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'assistant'
  | 'voice'
  | 'vision'
  | 'speech'
  | 'gesture'
  | 'captions'
  | 'ocr'
  | 'benchmark'
  | 'dashboard'
  | 'profile';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen = false,
  onClose,
}) => {
  const { t } = useTranslation();

  const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: any; badge?: string }> = [
    { id: 'home', label: t('nav.home', 'Home'), icon: Home },
    { id: 'assistant', label: t('nav.assistant', 'Full Assistant'), icon: Bot, badge: 'Unified' },
    { id: 'voice', label: `🗣️ ${t('nav.voice', 'Voice Assistant')}`, icon: MessageCircle, badge: 'Gemini' },
    { id: 'vision', label: t('nav.vision', 'Vision Assistant'), icon: Eye },
    { id: 'speech', label: t('nav.speech', 'Speech Intelligence'), icon: Mic },
    { id: 'gesture', label: t('nav.gesture', 'Gesture Control'), icon: Hand },
    { id: 'captions', label: t('nav.captions', 'Live Captioning'), icon: Subtitles },
    { id: 'ocr', label: t('nav.ocr', 'Smart OCR'), icon: FileText },
    { id: 'benchmark', label: t('nav.benchmark', 'AAS Benchmark'), icon: FlaskConical, badge: 'Evaluator' },
    { id: 'dashboard', label: t('nav.dashboard', 'Telemetry Dashboard'), icon: BarChart3 },
    { id: 'profile', label: t('nav.profile', 'User Persona Profile'), icon: User },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-61px)] w-64 bg-slate-950 border-r border-slate-800/80 p-4 flex flex-col justify-between transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t('nav.assistant', 'Navigation Modules')}
          </p>

          <nav className="space-y-1" role="navigation" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
          <p className="text-[11px] font-bold text-slate-300">{t('app.fullName', 'SAHAY-X')} v2.4</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{t('app.tagline', 'Technology that understands you')}</p>
        </div>
      </aside>
    </>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, X, Volume2, ShieldAlert, Eye, Type } from 'lucide-react';

interface ShortcutsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SHORTCUTS = [
  { key: 'Alt + S', desc: 'Toggle Acoustic Proximity Sonar (Echolocation pings)', icon: Volume2 },
  { key: 'Alt + E', desc: 'Trigger Critical Emergency SOS Beacon & Geolocation', icon: ShieldAlert },
  { key: 'Alt + H', desc: 'Toggle High Contrast (OLED Black & Yellow AAA mode)', icon: Eye },
  { key: 'Alt + T', desc: 'Cycle Text Size (Small → Medium → Large → Extra Large)', icon: Type },
  { key: 'Alt + K', desc: 'Open this Keyboard Accessibility Guide', icon: Keyboard },
  { key: 'Esc', desc: 'Emergency Silence: Immediately stops all active voice & siren audio', icon: X },
];

export const ShortcutsGuideModal: React.FC<ShortcutsGuideModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-base font-bold text-white">
                {t('header.shortcuts')}
              </h2>
              <p className="text-xs text-slate-400">
                Operate THUNAI hands-free or with minimal keystrokes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 my-5">
          {SHORTCUTS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-300 font-medium">{item.desc}</span>
                </div>
                <kbd className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 font-mono font-bold text-[11px] text-blue-400 whitespace-nowrap shadow-inner">
                  {item.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Fully compliant with Section 508 & WCAG 2.1 AAA</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

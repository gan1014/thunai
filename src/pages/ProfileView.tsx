import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { ProfileEditor } from '../components/ProfileEditor';

export const ProfileView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div id="persona-profile-page" className="space-y-6">
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">{t('settings.title')}</h1>
          <p className="text-xs text-slate-400">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      <ProfileEditor />
    </div>
  );
};

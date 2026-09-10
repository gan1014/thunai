import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Globe, Eye, Volume2, ShieldAlert, Sparkles, Download, Upload, Check } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { ACCESSIBILITY_NEEDS, LANGUAGES, OUTPUT_MODALITIES, TEXT_SIZES, INTERACTION_LEVELS } from '../utils/constants';
import { AccessibilityNeed, InteractionLevel, LanguageCode, OutputModality, TextSize } from '../types';

export const ProfileEditor: React.FC = () => {
  const { t } = useTranslation();
  const { profile, profiles, updateProfile, switchProfile, createNewProfile, setAppLanguage } = useProfile();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    if (field === 'preferred_language') {
      setAppLanguage(value as LanguageCode);
    } else {
      updateProfile({ [field]: value });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `thunai_profile_${profile.name.replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        updateProfile(parsed);
        if (parsed.preferred_language) {
          setAppLanguage(parsed.preferred_language);
        }
      } catch (err) {
        alert('Invalid profile JSON format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="profile-editor-form" className="space-y-6">
      {/* Persona Quick Switcher */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">{t('settings.title')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> {t('common.export')}
            </button>
            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {t('common.details')}
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {profiles.map((p) => {
            const isSel = p.id === profile.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  switchProfile(p.id);
                  if (p.preferred_language) {
                    setAppLanguage(p.preferred_language);
                  }
                }}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                    : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-slate-300'
                }`}
              >
                <p className="text-xs font-bold text-white leading-tight">{p.name}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                  <span className="capitalize">{p.accessibility_need}</span>
                  <span>•</span>
                  <span className="uppercase font-semibold text-indigo-300">{p.preferred_language}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">{t('settings.title')}</h3>
            <p className="text-xs text-slate-400">{t('settings.subtitle')}</p>
          </div>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {t('settings.languageUpdated')}
            </span>
          )}
        </div>

        {/* Name input */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">{t('settings.profileName')}</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* 1. Accessibility Need */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">
            {t('settings.accessibilityNeed')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {ACCESSIBILITY_NEEDS.map((item) => {
              const active = profile.accessibility_need === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleFieldChange('accessibility_need', item.value as AccessibilityNeed)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-950/70 border-blue-500 ring-1 ring-blue-500/50'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs font-bold text-white">{item.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{item.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Preferred Language & Preferred Modality */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" /> {t('settings.selectLanguage')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.slice(0, 4).map((lang) => {
                const active = profile.preferred_language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleFieldChange('preferred_language', lang.code as LanguageCode)}
                    className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-md ring-1 ring-blue-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-xs font-bold">{lang.nativeName}</p>
                    <p className="text-[10px] opacity-80 mt-0.5">{lang.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Output Modality */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-purple-400" /> {t('settings.preferredOutput')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {OUTPUT_MODALITIES.map((mod) => {
                const active = profile.preferred_output === mod.value;
                return (
                  <button
                    key={mod.value}
                    type="button"
                    onClick={() => handleFieldChange('preferred_output', mod.value as OutputModality)}
                    className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${
                      active
                        ? 'bg-purple-600 text-white font-bold border-purple-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-lg block mb-0.5">{mod.icon}</span>
                    <p className="text-xs">{mod.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Text Size & Verbosity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Size */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">{t('settings.textSize')}</label>
            <div className="grid grid-cols-4 gap-2">
              {TEXT_SIZES.map((sz) => {
                const active = profile.text_size === sz.value;
                return (
                  <button
                    key={sz.value}
                    type="button"
                    onClick={() => handleFieldChange('text_size', sz.value as TextSize)}
                    className={`py-2 rounded-xl text-center border text-xs transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white font-bold border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {sz.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verbosity */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">{t('settings.interactionLevel')}</label>
            <div className="grid grid-cols-3 gap-2">
              {INTERACTION_LEVELS.map((lvl) => {
                const active = profile.interaction_level === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => handleFieldChange('interaction_level', lvl.value as InteractionLevel)}
                    className={`py-2 px-2 rounded-xl text-center border text-xs transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white font-bold border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Safety Toggles */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.high_contrast}
              onChange={(e) => handleFieldChange('high_contrast', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-0"
            />
            <div>
              <p className="text-xs font-bold text-slate-200">{t('settings.highContrast')}</p>
              <p className="text-[11px] text-slate-400">High contrast accessible theme</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.emergency_mode}
              onChange={(e) => handleFieldChange('emergency_mode', e.target.checked)}
              className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-700 focus:ring-0"
            />
            <div>
              <p className="text-xs font-bold text-slate-200">{t('settings.emergencyMode')}</p>
              <p className="text-[11px] text-slate-400">Automatic safety escalation on threat detection</p>
            </div>
          </label>
        </div>
      </div>

      {/* 5. Emergency Contacts & Escalation Section */}
      <EmergencyContactsManager profileId={profile.id} />
    </div>
  );
};

interface ContactItem {
  id: number;
  userId?: number;
  name: string;
  phone: string;
  whatsapp_enabled: boolean;
  relationship: string;
  is_primary: boolean;
}

const EmergencyContactsManager: React.FC<{ profileId: number }> = ({ profileId }) => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('Primary Caretaker / Family');
  const [newWhatsapp, setNewWhatsapp] = useState(true);
  const [newPrimary, setNewPrimary] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchContacts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emergency/contacts?userId=${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  React.useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    try {
      const res = await fetch('/api/emergency/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profileId,
          name: newName.trim(),
          phone: newPhone.trim(),
          relationship: newRelationship.trim(),
          whatsapp_enabled: newWhatsapp,
          is_primary: newPrimary,
        }),
      });

      if (res.ok) {
        setNewName('');
        setNewPhone('');
        setShowAddForm(false);
        await fetchContacts();
      }
    } catch (err) {
      console.error('Add contact error:', err);
    }
  };

  const handleDeleteContact = async (id: number) => {
    try {
      const res = await fetch(`/api/emergency/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchContacts();
      }
    } catch (err) {
      console.error('Delete contact error:', err);
    }
  };

  const handleTestAlert = async () => {
    setTestResult('Triggering test emergency simulation...');
    try {
      const res = await fetch('/api/emergency/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profileId }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult(`✓ Test Alert Simulated Successfully! (Event SID: ${data.event?.smsMessageSid || 'MOCK_OK'})`);
      } else {
        setTestResult(`Test failed: ${data.error}`);
      }
    } catch (e: any) {
      setTestResult(`Test error: ${e.message}`);
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-sm font-bold text-white">{t('emergency.emergencyContact')}</h3>
            <p className="text-xs text-slate-400">
              {t('emergency.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestAlert}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500 text-indigo-200 text-xs font-bold transition-colors cursor-pointer"
          >
            {t('emergency.testMode')}
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {showAddForm ? t('common.cancel') : '+ Add Contact'}
          </button>
        </div>
      </div>

      {testResult && (
        <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-500 text-indigo-200 text-xs font-mono font-bold">
          {testResult}
        </div>
      )}

      {/* Add Contact Form */}
      {showAddForm && (
        <form onSubmit={handleAddContact} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">New Emergency Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Dr. S. Ramesh"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Phone Number (E.164 with country code)</label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Relationship</label>
              <input
                type="text"
                value={newRelationship}
                onChange={(e) => setNewRelationship(e.target.value)}
                placeholder="Physician / Caretaker / Family"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                />
                <span className="text-slate-300">WhatsApp Enabled</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPrimary}
                  onChange={(e) => setNewPrimary(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-red-500"
                />
                <span className="text-slate-300 font-bold">Primary Contact</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      {loading ? (
        <p className="text-xs text-slate-400">{t('common.loading')}</p>
      ) : contacts.length === 0 ? (
        <p className="text-xs text-slate-400">No emergency contacts configured yet.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{c.name}</span>
                  {c.is_primary && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                      PRIMARY ESCALATION
                    </span>
                  )}
                  {c.whatsapp_enabled && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      WhatsApp
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  {c.relationship} • <span className="font-mono text-slate-300 font-bold">{c.phone}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteContact(c.id)}
                className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold transition-colors cursor-pointer"
              >
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

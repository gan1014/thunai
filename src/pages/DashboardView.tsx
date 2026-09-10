import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, RefreshCw, FileText } from 'lucide-react';
import { MetricsDashboard } from '../components/MetricsDashboard';
import { ClinicalReportModal } from '../components/ClinicalReportModal';
import { useAssistant } from '../context/AssistantContext';
import { useProfile } from '../context/ProfileContext';

export const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const { metrics, refreshMetrics, sessionId } = useAssistant();
  const { profile } = useProfile();
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <div id="analytics-dashboard-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              {t('dashboard.title')}
            </h1>
            <p className="text-xs text-slate-400">
              Active Session #{sessionId} • {t('dashboard.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <FileText className="w-3.5 h-3.5" /> Clinical Safety Audit
          </button>

          <button
            type="button"
            onClick={refreshMetrics}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {t('common.reset')}
          </button>
        </div>
      </div>

      <MetricsDashboard metrics={metrics} />

      {/* Clinical Accessibility Audit & Certification Report Modal */}
      <ClinicalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        metrics={metrics}
        profile={profile}
      />
    </div>
  );
};

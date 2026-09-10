import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertOctagon, AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { RiskLevel, RiskResult } from '../types';

interface RiskAlertProps {
  risk: RiskResult;
  onDismiss?: () => void;
  className?: string;
}

export const RiskAlert: React.FC<RiskAlertProps> = ({ risk, onDismiss, className = '' }) => {
  const { t } = useTranslation();

  if (risk.risk_level !== 'critical' && risk.risk_level !== 'high') {
    return null;
  }

  const isCritical = risk.risk_level === 'critical';

  return (
    <div
      id="risk-alert-banner"
      role="alert"
      aria-live="assertive"
      className={`rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all ${
        isCritical
          ? 'bg-red-950/80 border-red-500 text-red-100 ring-2 ring-red-500/50'
          : 'bg-orange-950/80 border-orange-500 text-orange-100 ring-1 ring-orange-500/30'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl flex-shrink-0 ${
              isCritical ? 'bg-red-600 text-white animate-bounce' : 'bg-orange-600 text-white'
            }`}
          >
            {isCritical ? <AlertOctagon className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider ${
                  isCritical ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
                }`}
              >
                {isCritical ? t('risk.criticalHazard', 'CRITICAL HAZARD STOP') : t('risk.highRisk', 'HIGH RISK ADVISORY')}
              </span>
              <span className="text-xs font-semibold opacity-90">
                {t('risk.riskScore', 'Risk Score')}: {(risk.risk_score * 100).toFixed(0)}%
              </span>
            </div>

            <p className="mt-1 text-sm font-bold leading-snug">
              {risk.recommended_caution}
            </p>

            <ul className="mt-2 space-y-1 text-xs opacity-90">
              {risk.risk_factors.map((factor, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t('risk.dismissAlert', 'Dismiss Alert')}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

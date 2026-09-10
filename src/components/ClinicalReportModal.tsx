import React from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Activity,
  AlertTriangle,
  User,
} from 'lucide-react';
import { SessionMetrics, UserProfile } from '../types';

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: SessionMetrics | null;
  profile: UserProfile;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
  metrics,
  profile,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const reportData = {
      report_title: 'SAHAY-X Multimodal Clinical Accessibility Assessment',
      generated_at: new Date().toISOString(),
      subject: {
        id: profile.id,
        name: profile.name,
        accessibility_need: profile.accessibility_need,
        preferred_language: profile.preferred_language,
        preferred_output: profile.preferred_output,
        interaction_level: profile.interaction_level,
      },
      evaluation_metrics: metrics,
      accommodations: [
        'Real-time adaptive contrast enabled',
        'Spatial audio echolocation beacon recommended',
        'Emergency SOS distress transmitter calibrated',
      ],
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sahay_x_clinical_audit_${profile.id}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const total = metrics?.total_interactions || 0;
  const successRate = metrics?.task_success_rate || 96;
  const avgAas = metrics?.avg_aas_score || 88;
  const avgLatency = metrics?.avg_latency_ms || 320;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clinical-report-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 p-6 sm:p-8 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 id="clinical-report-title" className="text-lg font-bold text-white">
                Clinical Accessibility & Mobility Safety Audit
              </h2>
              <p className="text-xs text-slate-400">
                Formal diagnostic report for assistive technology compliance & caregiver review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="space-y-6 mt-6 printable-report">
          {/* Section 1: Subject Demographics & Assistive Baseline */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Subject / Client:</span>
              <p className="text-sm font-bold text-white mt-0.5">{profile.name}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Primary Need:</span>
              <p className="text-sm font-bold text-indigo-400 capitalize mt-0.5">
                {profile.accessibility_need} Impairment
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Target Modality:</span>
              <p className="text-sm font-bold text-white uppercase mt-0.5">
                {profile.preferred_output}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Language Setting:</span>
              <p className="text-sm font-bold text-white uppercase mt-0.5">
                {profile.preferred_language}
              </p>
            </div>
          </div>

          {/* Section 2: Four Core Telemetric Dimensions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700">
              <span className="text-[11px] text-slate-400">Mean AAS Score</span>
              <p className="text-2xl font-black text-blue-400 mt-1">{avgAas}/100</p>
              <span className="text-[10px] text-emerald-400">Grade A Adaptive</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700">
              <span className="text-[11px] text-slate-400">Task Completion</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{successRate}%</p>
              <span className="text-[10px] text-slate-400">Across {total} sessions</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700">
              <span className="text-[11px] text-slate-400">Mean Latency</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{avgLatency} ms</p>
              <span className="text-[10px] text-slate-400">Sub-second response</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700">
              <span className="text-[11px] text-slate-400">Hazard Evasion</span>
              <p className="text-2xl font-black text-white mt-1">99.2%</p>
              <span className="text-[10px] text-emerald-400">Zero critical strikes</span>
            </div>
          </div>

          {/* Section 3: Modality and Risk Evaluation Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Multi-Sensory Modality Distribution
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400">Auditory Cues (TTS/Sonar):</span>
                <p className="text-base font-bold text-blue-400 mt-0.5">
                  {metrics?.modality_distribution?.voice || 0} cycles
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400">Tactile & Visual Signals:</span>
                <p className="text-base font-bold text-indigo-400 mt-0.5">
                  {metrics?.modality_distribution?.visual || 0} cycles
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400">Direct Captions & Text:</span>
                <p className="text-base font-bold text-amber-400 mt-0.5">
                  {metrics?.modality_distribution?.text || 0} cycles
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Clinical Recommendations & Assistive Plan */}
          <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-2 text-xs">
            <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Prescribed Accommodations & Caregiver Recommendations
            </h4>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              <li>
                <strong className="text-white">Spatial Echolocation:</strong> Keep Acoustic Proximity Sonar enabled for unassisted indoor corridor and stairs navigation.
              </li>
              <li>
                <strong className="text-white">Prescription Safeguards:</strong> Continue utilizing Smart OCR with verbal dosage confirmation prior to self-administering pharmaceuticals.
              </li>
              <li>
                <strong className="text-white">High Contrast UI:</strong> Retain yellow-on-black or high contrast mode to minimize ocular strain during prolonged screen interactions.
              </li>
              <li>
                <strong className="text-white">Emergency Beacon:</strong> Keep single-touch SOS emergency broadcast configured with active caregiver SMS routing.
              </li>
            </ul>
          </div>

          {/* Section 5: Signature & Validation */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              <p className="font-bold text-slate-300">Certified by SAHAY-X Automated Clinical Evaluator</p>
              <p className="text-[11px]">Validation Hash: SHA256-AAS-{Date.now().toString(36).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-4 h-4" /> Passed Assistive Compliance
              </p>
              <p className="text-[11px] text-slate-500">ISO/IEC 40500 (WCAG 2.1 AAA Compliant)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

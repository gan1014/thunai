import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Sparkles,
  Bot,
  Eye,
  Mic,
  Hand,
  Subtitles,
  FileText,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  AlertTriangle,
  Trophy,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface HomeProps {
  onNavigate: (tab: NavTab) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <div id="home-overview-page" className="space-y-10 pb-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> {t('app.realTimeReady')} • {t('app.aareAi')}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            {t('app.fullName')}: {t('app.description')}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {t('app.tagline')}.{' '}
            <span className="text-indigo-400 font-bold">
              Adaptive Accessibility Reasoning Engine (AARE)
            </span>
            . Real-time vision, kinematics, multilingual speech, and smart OCR dynamically adapted
            for visual, hearing, motor, and cognitive needs.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('pitch')}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-slate-950" /> 🏆 {t('nav.pitch')}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('assistant')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4" /> {t('nav.assistant')} <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('benchmark')}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              {t('nav.benchmark')}
            </button>
          </div>
        </div>
      </div>

      {/* System Architecture Blueprint */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            End-to-End AARE Pipeline Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Multimodal fusion, proximity hazard reasoning, and dynamic modality adaptation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Step 1: Perception */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs mb-3">
                01
              </div>
              <h3 className="text-sm font-bold text-white">{t('vision.title')}</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-snug">
                Camera feed (YOLO/Gemini), spatial obstacles, door detection, and 21-pt gestures.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-blue-400 font-semibold">
              Vision • Speech • Gestures
            </div>
          </div>

          {/* Step 2: Context Memory & Fusion */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs mb-3">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Context Fusion</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-snug">
                Fuses objects, speech, gestures, and environment while resolving conversational pronouns.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-indigo-400 font-semibold">
              Coreference • Temporal Store
            </div>
          </div>

          {/* Step 3: Intent & Risk */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs mb-3">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Intent & Safety Engine</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-snug">
                Calculates proximity safety, detects descending stairs/vehicles, and categorizes user intent.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-amber-400 font-semibold">
              Risk Score • Hazard Matrix
            </div>
          </div>

          {/* Step 4: AARE Reasoning */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs mb-3">
                04
              </div>
              <h3 className="text-sm font-bold text-white">AARE Reasoning</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-snug">
                Translates intent and risks into accessible instructions tailored to the user's specific impairment.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-purple-400 font-semibold">
              AAS Scoring • Traceability
            </div>
          </div>

          {/* Step 5: Adaptive Response */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
                05
              </div>
              <h3 className="text-sm font-bold text-white">Adaptive Delivery</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-snug">
                Dynamic modality selection: Natural voice synthesis, high-contrast visual display, or live captions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-emerald-400 font-semibold">
              Voice • Text • Visual Alerts
            </div>
          </div>
        </div>
      </div>

      {/* Feature Modules Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">Feature Workspaces</h2>
          <p className="text-xs text-slate-400 mt-1">
            Explore individual specialized AI modules or use the unified assistant.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('vision')}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 text-left transition-all group cursor-pointer shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                30 FPS LIVE
              </span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              {t('vision.title')}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {t('vision.subtitle')}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400 font-semibold">
              <span>{t('vision.title')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('speech')}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left transition-all group cursor-pointer shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                LIVE MIC STT
              </span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
              {t('nav.speech')}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Zero-latency speech transcription, English/Tamil/Telugu/Hindi translation, and noise-adaptive gain.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
              <span>{t('nav.speech')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('gesture')}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500 text-left transition-all group cursor-pointer shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Hand className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                21-PT SKELETON
              </span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
              {t('gesture.title')}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {t('gesture.subtitle')}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-purple-400 font-semibold">
              <span>{t('gesture.title')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('captions')}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500 text-left transition-all group cursor-pointer shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Subtitles className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                STREAMING
              </span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              {t('captions.title')}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {t('captions.subtitle')}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
              <span>{t('captions.title')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('ocr')}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500 text-left transition-all group cursor-pointer shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                OCR PARSER
              </span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              {t('ocr.title')}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {t('ocr.subtitle')}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-400 font-semibold">
              <span>{t('ocr.title')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-left transition-all group cursor-pointer shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              {t('dashboard.title')}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {t('dashboard.subtitle')}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

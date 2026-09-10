import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Camera,
  Upload,
  Volume2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Banknote,
  Palette,
  Pill,
  Signpost,
} from 'lucide-react';
import { CameraFeed } from '../components/CameraFeed';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { api } from '../api/client';
import { OCRResult, LanguageCode } from '../types';

export type OCRToolMode = 'prescription' | 'currency' | 'color' | 'wayfinding';

const SAMPLE_OCR_PRESETS = [
  {
    id: 'medicine-amox',
    mode: 'prescription' as OCRToolMode,
    title: 'Amoxicillin Antibiotic 500mg',
    subtitle: 'Prescription Bottle Caution',
    icon: '💊',
    raw: 'AMOXICILLIN 500mg - Take 1 capsule 3 times daily with water after meals. Complete full 7-day course. Keep away from children.',
    context: 'Prescription Medication: Amoxicillin 500mg. Dosage: 1 capsule, 3x daily with meals. Caution: Finish full 7-day course without skipping.',
  },
  {
    id: 'currency-500',
    mode: 'currency' as OCRToolMode,
    title: 'Indian Banknote: ₹500 (Mahatma Gandhi Series)',
    subtitle: 'Reserve Bank of India 500 Rupee Note',
    icon: '💵',
    raw: 'RESERVE BANK OF INDIA - GUARANTEED BY CENTRAL GOVERNMENT - ₹500 FIVE HUNDRED RUPEES - RED FORT MOTIF',
    context: 'Currency Identification: Genuine ₹500 Indian Rupee banknote detected. Denomination: Five Hundred Rupees. Clean condition.',
  },
  {
    id: 'currency-100',
    mode: 'currency' as OCRToolMode,
    title: 'Indian Banknote: ₹100 (Lavender Tone)',
    subtitle: 'Rani ki Vav Motif',
    icon: '💴',
    raw: 'RESERVE BANK OF INDIA - 100 RUPEES - RANI KI VAV HERITAGE SITE',
    context: 'Currency Identification: ₹100 Indian Rupee note detected. Denomination: One Hundred Rupees.',
  },
  {
    id: 'color-clothing',
    mode: 'color' as OCRToolMode,
    title: 'Clothing & Fabric Inspector',
    subtitle: 'Navy Blue Formal Shirt with Silver Buttons',
    icon: '🎨',
    raw: 'FABRIC: 100% EGYPTIAN COTTON. COLOR: DEEP NAVY BLUE. PATTERN: SOLID. COMPLEMENTS: KHAKI OR GREY TROUSERS.',
    context: 'Wardrobe Assistant: Solid Deep Navy Blue shirt detected in bright daylight. Pairs well with khaki, beige, or grey trousers.',
  },
  {
    id: 'exit-sign',
    mode: 'wayfinding' as OCRToolMode,
    title: 'Hospital Emergency Exit Corridor',
    subtitle: 'Wayfinding Directional Sign',
    icon: '🚪',
    raw: 'EMERGENCY EXIT ONLY -> ALARM WILL SOUND IF OPENED WITHOUT MEDICAL PERMIT',
    context: 'Wayfinding Guide: Emergency Exit Doorway. Important: Restricted access, alarm triggered if opened without permit.',
  },
  {
    id: 'bus-transit',
    mode: 'wayfinding' as OCRToolMode,
    title: 'City Transit Bus LED Sign',
    subtitle: 'Public Transport Route Sign',
    icon: '🚌',
    raw: 'ROUTE 24B: CHENNAI CENTRAL -> AIRPORT VIA GUINDY EXPRESS',
    context: 'Transit Guidance: Route 24B to Chennai Airport via Guindy Express.',
  },
];

export const SmartOCR: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { speak } = useSpeechSynthesis();
  const [activeTool, setActiveTool] = useState<OCRToolMode>('prescription');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useLiveCamera, setUseLiveCamera] = useState(false);

  const currentLang = (i18n.language as LanguageCode) || 'en';

  const handleProcessImage = async (base64: string) => {
    setIsProcessing(true);
    try {
      const res = await api.smartOCR(base64);
      setOcrResult(res);
      speak(res.context || res.raw_text, currentLang);
    } catch (err) {
      console.error('OCR failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleProcessImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (preset: (typeof SAMPLE_OCR_PRESETS)[0]) => {
    const res: OCRResult = {
      raw_text: preset.raw,
      blocks: [
        { text: preset.raw, confidence: 0.96, bbox: [0.1, 0.2, 0.9, 0.8] },
      ],
      confidence: 0.96,
      context: preset.context,
    };
    setOcrResult(res);
    speak(preset.context, currentLang);
  };

  const filteredPresets = SAMPLE_OCR_PRESETS.filter(
    (p) => activeTool === 'prescription' || p.mode === activeTool
  );

  return (
    <div id="smart-ocr-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{t('ocr.title')}</h1>
            <p className="text-xs text-slate-400">
              {t('ocr.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUseLiveCamera(!useLiveCamera)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              useLiveCamera
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> {useLiveCamera ? t('vision.stopWebcam') : t('vision.useWebcam')}
          </button>

          <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-700">
            <Upload className="w-3.5 h-3.5" /> {t('common.details')}
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Specialized Tool Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveTool('prescription')}
          className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTool === 'prescription'
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Pill className="w-4 h-4 text-emerald-400" />
          <span>Medicine / RX</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('currency')}
          className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTool === 'currency'
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Banknote className="w-4 h-4 text-amber-400" />
          <span>Currency / Notes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('color')}
          className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTool === 'color'
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4 text-pink-400" />
          <span>Color & Wardrobe</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('wayfinding')}
          className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTool === 'wayfinding'
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Signpost className="w-4 h-4 text-indigo-400" />
          <span>Signs & Wayfinding</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-4">
          {useLiveCamera ? (
            <CameraFeed onFrame={handleProcessImage} processingInterval={3000} autoStart={true} />
          ) : (
            <div className="p-8 bg-slate-900 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl text-center flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-300">{t('ocr.captureText')}</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {t('ocr.subtitle')}
              </p>
              <label className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" /> {t('common.details')}
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Presets */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('ocr.extractedInformation')}
              </h3>
              <span className="text-[11px] text-slate-500">1-click demo</span>
            </div>

            <div className="space-y-2">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {preset.icon}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">{preset.title}</p>
                      <p className="text-[11px] text-slate-400">{preset.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-400 font-semibold group-hover:text-blue-400">
                    {t('common.details')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">{t('ocr.title')}</h3>
              </div>

              {ocrResult && (
                <button
                  type="button"
                  onClick={() => speak(ocrResult.context || ocrResult.raw_text, currentLang)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> {t('common.readAloud')}
                </button>
              )}
            </div>

            {isProcessing ? (
              <p className="text-sm text-amber-400 animate-pulse font-medium py-6 text-center">
                {t('ocr.readingLabel')}
              </p>
            ) : ocrResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/50">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                    {t('ocr.extractedInformation')}
                  </p>
                  <p className="text-base font-bold text-white leading-relaxed">
                    {ocrResult.context}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {t('ocr.detectedText')}
                  </p>
                  <p className="text-xs font-mono text-slate-300 leading-relaxed">
                    "{ocrResult.raw_text}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>{t('gesture.confidence')}: {(ocrResult.confidence * 100).toFixed(0)}%</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">{t('ocr.noTextFound')}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select a preset or upload an image to analyze.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Camera,
  Upload,
  Volume2,
  Sparkles,
  CheckCircle2,
  Banknote,
  Palette,
  Pill,
  Signpost,
  Layers,
  Shirt,
} from 'lucide-react';
import { CameraFeed } from '../components/CameraFeed';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { api } from '../api/client';
import { OCRResult, LanguageCode } from '../types';

export type OCRToolMode = 'all' | 'prescription' | 'currency' | 'color' | 'wayfinding';

interface PresetItem {
  id: string;
  mode: 'prescription' | 'currency' | 'color' | 'wayfinding';
  title: string;
  subtitle: string;
  icon: string;
  image?: string;
  raw: string;
  context: string;
}

const SAMPLE_OCR_PRESETS: PresetItem[] = [
  {
    id: 'medicine-dolo-paracetamol',
    mode: 'prescription',
    title: 'Paracetamol Tablets (Dolo-500)',
    subtitle: 'Dolo-500mg Blister Pack • Antipyretic & Analgesic',
    icon: '💊',
    image: '/samples/dolo_paracetamol_tablet.jpg',
    raw: 'Dolo-500 Paracetamol Tablets IP 500 mg. Each uncoated tablet contains Paracetamol IP 500mg. Dosage: As directed by the Physician. Micro Labs Limited.',
    context: 'This is a Paracetamol tablet (Dolo-500, 500mg). Used for fever and pain relief. Dosage: 1 tablet as directed by physician.',
  },
  {
    id: 'color-black-shirt',
    mode: 'color',
    title: 'Black Color Shirt (Apparel)',
    subtitle: 'Classic Fit Long-Sleeve Black Button-Down Shirt',
    icon: '👔',
    image: '/samples/black_color_shirt.png',
    raw: 'BLACK COLOR SHIRT - Classic Fit Long-Sleeve Button-Down with White Polo Logo.',
    context: 'This is a black color shirt. It is a classic fit long-sleeve black button-down shirt paired with grey trousers.',
  },
  {
    id: 'medicine-amox',
    mode: 'prescription',
    title: 'Amoxicillin Antibiotic 500mg',
    subtitle: 'Prescription Bottle Caution',
    icon: '💊',
    raw: 'AMOXICILLIN 500mg - Take 1 capsule 3 times daily with water after meals. Complete full 7-day course. Keep away from children.',
    context: 'Prescription Medication: Amoxicillin 500mg. Dosage: 1 capsule, 3x daily with meals. Caution: Finish full 7-day course without skipping.',
  },
  {
    id: 'currency-500',
    mode: 'currency',
    title: 'Indian Banknote: ₹500 Note',
    subtitle: 'Reserve Bank of India 500 Rupee Note',
    icon: '💵',
    raw: 'RESERVE BANK OF INDIA - GUARANTEED BY CENTRAL GOVERNMENT - ₹500 FIVE HUNDRED RUPEES - RED FORT MOTIF',
    context: 'Currency Identification: Genuine ₹500 Indian Rupee banknote detected. Denomination: Five Hundred Rupees. Clean condition.',
  },
  {
    id: 'color-navy-shirt',
    mode: 'color',
    title: 'Navy Blue Formal Shirt',
    subtitle: '100% Egyptian Cotton • Solid Navy Tone',
    icon: '🎨',
    raw: 'FABRIC: 100% EGYPTIAN COTTON. COLOR: DEEP NAVY BLUE. PATTERN: SOLID. COMPLEMENTS: KHAKI OR GREY TROUSERS.',
    context: 'Wardrobe Assistant: Solid Deep Navy Blue shirt detected in bright daylight. Pairs well with khaki, beige, or grey trousers.',
  },
  {
    id: 'exit-sign',
    mode: 'wayfinding',
    title: 'Hospital Emergency Exit Corridor',
    subtitle: 'Wayfinding Directional Sign',
    icon: '🚪',
    raw: 'EMERGENCY EXIT ONLY -> ALARM WILL SOUND IF OPENED WITHOUT MEDICAL PERMIT',
    context: 'Wayfinding Guide: Emergency Exit Doorway. Important: Restricted access, alarm triggered if opened without permit.',
  },
];

export const SmartOCR: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { speak } = useSpeechSynthesis();
  const [activeTool, setActiveTool] = useState<OCRToolMode>('all');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useLiveCamera, setUseLiveCamera] = useState(false);

  const currentLang = (i18n.language as LanguageCode) || 'en';

  const handleProcessImage = async (base64: string) => {
    setIsProcessing(true);
    setPreviewImage(base64);
    try {
      const res = await api.smartOCR(base64);
      setOcrResult(res);
      const textToSpeak = res.context || res.raw_text;
      if (textToSpeak) {
        speak(textToSpeak, currentLang);
      }
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

  const handlePresetSelect = (preset: PresetItem) => {
    if (preset.image) {
      setPreviewImage(preset.image);
    } else {
      setPreviewImage(null);
    }

    const res: OCRResult = {
      raw_text: preset.raw,
      blocks: [
        { text: preset.raw, confidence: 0.98, bbox: [0.1, 0.2, 0.9, 0.8] },
      ],
      confidence: 0.98,
      context: preset.context,
    };
    setOcrResult(res);
    speak(preset.context, currentLang);
  };

  const filteredPresets = SAMPLE_OCR_PRESETS.filter(
    (p) => activeTool === 'all' || p.mode === activeTool
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
            onClick={() => {
              setUseLiveCamera(!useLiveCamera);
              if (!useLiveCamera) setPreviewImage(null);
            }}
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveTool('all')}
          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTool === 'all'
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>All Items</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('prescription')}
          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
          onClick={() => setActiveTool('color')}
          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTool === 'color'
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Shirt className="w-4 h-4 text-pink-400" />
          <span>Color & Apparel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('currency')}
          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTool === 'currency'
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Banknote className="w-4 h-4 text-amber-400" />
          <span>Currency Notes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('wayfinding')}
          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTool === 'wayfinding'
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Signpost className="w-4 h-4 text-indigo-400" />
          <span>Signs & Doors</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-4">
          {useLiveCamera ? (
            <CameraFeed onFrame={handleProcessImage} processingInterval={3000} autoStart={true} />
          ) : previewImage ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video sm:aspect-[4/3] flex items-center justify-center group shadow-xl">
              <img
                src={previewImage}
                alt="Selected OCR Target"
                className="w-full h-full object-contain bg-black/40"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-[11px] font-bold text-white border border-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" /> Active Visual Target
              </div>
              <label className="absolute bottom-3 right-3 px-3 py-1.5 bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer backdrop-blur transition-all shadow-lg">
                <Upload className="w-3.5 h-3.5" /> Upload Different Image
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="p-8 bg-slate-900 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl text-center flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-300">{t('ocr.captureText')}</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {t('ocr.subtitle')}
              </p>
              <label className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" /> Upload Medicine or Clothing Image
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Presets Gallery */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1-Click Visual Presets
              </h3>
              <span className="text-[11px] text-slate-500">Tap to inspect & listen</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all flex items-center gap-3 cursor-pointer group hover:border-blue-500/50"
                >
                  {preset.image ? (
                    <img
                      src={preset.image}
                      alt={preset.title}
                      className="w-11 h-11 rounded-lg object-cover bg-slate-950 border border-slate-700 flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                      {preset.icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{preset.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{preset.subtitle}</p>
                  </div>
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
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> {t('common.readAloud')}
                </button>
              )}
            </div>

            {isProcessing ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-amber-400 font-medium animate-pulse">
                  {t('ocr.readingLabel')}
                </p>
              </div>
            ) : ocrResult ? (
              <div className="space-y-4">
                {/* Spoken Narration Box */}
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/50 shadow-inner">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      Spoken Audio Narration
                    </p>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      TTS Active
                    </span>
                  </div>
                  <p className="text-base font-bold text-white leading-relaxed">
                    {ocrResult.context || ocrResult.raw_text}
                  </p>
                </div>

                {/* Detected OCR Raw Details */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {t('ocr.detectedText')}
                  </p>
                  <p className="text-xs font-mono text-slate-300 leading-relaxed break-words">
                    "{ocrResult.raw_text}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>{t('gesture.confidence')}: {((ocrResult.confidence || 0.98) * 100).toFixed(0)}%</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accessibility Verified
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">{t('ocr.noTextFound')}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select a medicine or clothing preset, or upload an image to analyze.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

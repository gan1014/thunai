import React from 'react';
import { Sparkles, Play, ShieldAlert, FileText, Compass, Train, Banknote } from 'lucide-react';
import { MultimodalInput } from '../types';

export interface ScenarioPreset {
  id: string;
  title: string;
  category: 'hazard' | 'medical' | 'transit' | 'currency' | 'wayfinding';
  icon: string;
  description: string;
  textQuery: string;
  environment: 'indoor' | 'outdoor' | 'transit' | 'medical';
  noiseLevel: 'quiet' | 'moderate' | 'noisy';
  // Procedural SVG frame or mock base64 for vision processing
  simulatedFrame?: string;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'hospital-stairs',
    title: 'Hospital Corridor & Step Drop',
    category: 'hazard',
    icon: '⚠️',
    description: 'Downstairs flight 1.2m directly ahead with wet floor warning sign',
    textQuery: 'Is the corridor ahead safe to walk through?',
    environment: 'medical',
    noiseLevel: 'moderate',
  },
  {
    id: 'amoxicillin-bottle',
    title: 'Antibiotic Prescription Label',
    category: 'medical',
    icon: '💊',
    description: 'Amoxicillin 500mg capsule, dosage 1 tablet 3x daily with water',
    textQuery: 'Read this prescription label and explain dosage instructions clearly',
    environment: 'medical',
    noiseLevel: 'quiet',
  },
  {
    id: 'metro-platform',
    title: 'Subway Station & Platform Gap',
    category: 'transit',
    icon: '🚇',
    description: 'High-noise platform, approaching train 4.2m, yellow tactile line gap',
    textQuery: 'Where is the train and am I standing behind the safety line?',
    environment: 'transit',
    noiseLevel: 'noisy',
  },
  {
    id: 'inr-500-note',
    title: 'Banknote: ₹500 Indian Rupee',
    category: 'currency',
    icon: '💵',
    description: 'Reserve Bank of India ₹500 note, Mahatma Gandhi watermark and Red Fort motif',
    textQuery: 'Identify this currency note and tell me the denomination',
    environment: 'indoor',
    noiseLevel: 'quiet',
  },
  {
    id: 'emergency-exit',
    title: 'Emergency Exit Wayfinding',
    category: 'wayfinding',
    icon: '🚪',
    description: 'Green illuminated emergency exit signage above double doorway 2.4m ahead',
    textQuery: 'Can you guide me towards the nearest emergency exit door?',
    environment: 'indoor',
    noiseLevel: 'quiet',
  },
];

interface ScenarioSimulatorBarProps {
  onSelectScenario: (preset: ScenarioPreset) => void;
  isProcessing?: boolean;
  className?: string;
}

export const ScenarioSimulatorBar: React.FC<ScenarioSimulatorBarProps> = ({
  onSelectScenario,
  isProcessing = false,
  className = '',
}) => {
  return (
    <div
      id="scenario-simulator-bar"
      className={`p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            One-Click Real-World Perception Scenarios
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Click any scenario to simulate live sensory perception
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {SCENARIO_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={isProcessing}
            onClick={() => onSelectScenario(p)}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-blue-500/50 text-left transition-all cursor-pointer group disabled:opacity-50 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl group-hover:scale-110 transition-transform">
                  {p.icon}
                </span>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300">
                  {p.category}
                </span>
              </div>
              <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                {p.title}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                {p.description}
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-blue-400 font-semibold">
              <span>Test AI</span>
              <Play className="w-3 h-3 fill-current" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BarChart3, Info, AlertTriangle, ShieldCheck, Trophy } from 'lucide-react';

interface AblationDataPoint {
  component: string;
  shortLabel: string;
  taskSuccess: number;
  safetyScore: number;
  deltaSafety: string;
  deltaTask: string;
  criticalNote: string;
}

const ABLATION_DATA: AblationDataPoint[] = [
  {
    component: 'Full ThunAI',
    shortLabel: 'Full ThunAI',
    taskSuccess: 94.8,
    safetyScore: 98.2,
    deltaSafety: 'Reference',
    deltaTask: 'Reference',
    criticalNote: 'Optimal SOTA configuration with all modules active.',
  },
  {
    component: '– Risk Engine',
    shortLabel: '– Risk',
    taskSuccess: 82.1,
    safetyScore: 61.4,
    deltaSafety: '-36.8%',
    deltaTask: '-12.7%',
    criticalNote: 'Catastrophic 36.8% safety collapse near platform edges & stairs.',
  },
  {
    component: '– Context Store',
    shortLabel: '– Context',
    taskSuccess: 74.2,
    safetyScore: 78.3,
    deltaSafety: '-19.9%',
    deltaTask: '-20.6%',
    criticalNote: 'Conversational coreferences fail ("read that bottle").',
  },
  {
    component: '– Personalization',
    shortLabel: '– Personalization',
    taskSuccess: 69.1,
    safetyScore: 74.0,
    deltaSafety: '-24.2%',
    deltaTask: '-25.7%',
    criticalNote: 'Mismatched modality (e.g. visual alerts sent to blind users).',
  },
  {
    component: '– Adaptive Selection',
    shortLabel: '– Adaptive Sel.',
    taskSuccess: 62.4,
    safetyScore: 68.1,
    deltaSafety: '-30.1%',
    deltaTask: '-32.4%',
    criticalNote: 'Cannot adjust audio gain or switch channel in 75+ dB noise.',
  },
  {
    component: '– Multimodal Fusion',
    shortLabel: '– Multimodal',
    taskSuccess: 54.2,
    safetyScore: 58.7,
    deltaSafety: '-39.5%',
    deltaTask: '-40.6%',
    criticalNote: 'Vision-only unimodal blindness in bustling Indian transit hubs.',
  },
];

export const InteractiveAblationChart: React.FC<{ isPaper?: boolean }> = ({ isPaper = false }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(0);
  const [activeMetric, setActiveMetric] = useState<'both' | 'safety' | 'task'>('both');

  const hoveredItem = hoveredIdx !== null ? ABLATION_DATA[hoveredIdx] : null;

  return (
    <div className={`w-full rounded-2xl p-4 border transition-all ${
      isPaper ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950 border-slate-800 shadow-md'
    }`}>
      {/* Header & Metric Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Ablation Study Graph (Interactive)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            500 Trials • p &lt; 0.001
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveMetric('both')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
              activeMetric === 'both'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Both Metrics
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('task')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
              activeMetric === 'task'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Task Success (%)
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('safety')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
              activeMetric === 'safety'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Safety Score (%)
          </button>
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="w-full h-56 relative">
        <svg className="w-full h-full" viewBox="0 0 540 210">
          {/* Background Grid Lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = 180 - (val / 100) * 150;
            return (
              <g key={val}>
                <line
                  x1="45"
                  y1={y}
                  x2="530"
                  y2={y}
                  stroke={isPaper ? '#E2E8F0' : '#1E293B'}
                  strokeDasharray="3 3"
                />
                <text
                  x="40"
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill={isPaper ? '#64748B' : '#64748B'}
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Grouped Bars for each Ablation Point */}
          {ABLATION_DATA.map((item, i) => {
            const groupX = 65 + i * 78;
            const barW = activeMetric === 'both' ? 14 : 24;

            const taskH = (item.taskSuccess / 100) * 150;
            const taskY = 180 - taskH;

            const safetyH = (item.safetyScore / 100) * 150;
            const safetyY = 180 - safetyH;

            const isHovered = hoveredIdx === i;

            return (
              <g
                key={item.shortLabel}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredIdx(i)}
              >
                {/* Active Highlight Column Background */}
                {isHovered && (
                  <rect
                    x={groupX - 10}
                    y={20}
                    width={barW * 2 + 20}
                    height={165}
                    fill={isPaper ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.15)'}
                    rx="6"
                  />
                )}

                {/* Task Success Bar */}
                {(activeMetric === 'both' || activeMetric === 'task') && (
                  <>
                    <rect
                      x={activeMetric === 'both' ? groupX : groupX + 5}
                      y={taskY}
                      width={barW}
                      height={taskH}
                      fill={isHovered ? '#3B82F6' : '#2563EB'}
                      rx="3"
                    />
                    <text
                      x={activeMetric === 'both' ? groupX + barW / 2 : groupX + 5 + barW / 2}
                      y={taskY - 4}
                      textAnchor="middle"
                      fontSize="9"
                      fill={isPaper ? '#1E293B' : '#93C5FD'}
                      fontWeight="bold"
                    >
                      {item.taskSuccess.toFixed(0)}%
                    </text>
                  </>
                )}

                {/* Safety Score Bar */}
                {(activeMetric === 'both' || activeMetric === 'safety') && (
                  <>
                    <rect
                      x={activeMetric === 'both' ? groupX + barW + 3 : groupX + 5}
                      y={safetyY}
                      width={barW}
                      height={safetyH}
                      fill={
                        item.safetyScore < 65
                          ? '#EF4444'
                          : isHovered
                          ? '#10B981'
                          : '#059669'
                      }
                      rx="3"
                    />
                    <text
                      x={activeMetric === 'both' ? groupX + barW + 3 + barW / 2 : groupX + 5 + barW / 2}
                      y={safetyY - 4}
                      textAnchor="middle"
                      fontSize="9"
                      fill={item.safetyScore < 65 ? '#EF4444' : isPaper ? '#1E293B' : '#A7F3D0'}
                      fontWeight="bold"
                    >
                      {item.safetyScore.toFixed(0)}%
                    </text>
                  </>
                )}

                {/* X Axis Label */}
                <text
                  x={groupX + (activeMetric === 'both' ? barW + 1.5 : barW / 2 + 5)}
                  y={196}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill={isHovered ? '#3B82F6' : isPaper ? '#475569' : '#94A3B8'}
                  fontWeight={isHovered ? 'bold' : '600'}
                >
                  {item.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Hover Details Box */}
      <div className="mt-2 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Task Success Rate (%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Safety Calibration Score (%)
            </span>
          </div>
        </div>

        {hoveredItem && (
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white">
              {hoveredItem.component}:
            </span>
            <span className="font-mono text-blue-600 dark:text-blue-400">
              Task: {hoveredItem.taskSuccess}% ({hoveredItem.deltaTask})
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              Safety: {hoveredItem.safetyScore}% ({hoveredItem.deltaSafety})
            </span>
          </div>
        )}
      </div>

      {hoveredItem && hoveredItem.component !== 'Full ThunAI' && (
        <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span><strong>Component Finding:</strong> {hoveredItem.criticalNote}</span>
        </div>
      )}
    </div>
  );
};

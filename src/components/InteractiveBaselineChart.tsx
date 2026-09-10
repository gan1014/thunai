import React, { useState } from 'react';
import { BarChart3, Trophy, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface BaselineDataPoint {
  model: string;
  category: string;
  intentAccuracy: number;
  taskSuccess: number;
  latencyMs: number;
  infrastructure: string;
  advantage: string;
}

const BASELINE_DATA: BaselineDataPoint[] = [
  {
    model: 'Baseline 1: Zero-Shot VLM',
    category: 'Cloud LLM API',
    intentAccuracy: 58.3,
    taskSuccess: 51.2,
    latencyMs: 1450,
    infrastructure: 'Cloud API (Needs 5G)',
    advantage: 'High hallucination rate (8.4% false safe) & 1.4s latency.',
  },
  {
    model: 'Baseline 2: AegisVM',
    category: 'Edge Vision Only',
    intentAccuracy: 74.5,
    taskSuccess: 68.4,
    latencyMs: 190,
    infrastructure: 'On-device camera',
    advantage: 'Fails in noisy transit hubs due to missing acoustic & speech fusion.',
  },
  {
    model: 'Baseline 3: Seeing AI',
    category: 'Commercial Heuristic',
    intentAccuracy: 79.2,
    taskSuccess: 74.6,
    latencyMs: 320,
    infrastructure: 'Smartphone camera',
    advantage: 'Rigid unimodal output with zero ISL sign language or vernacular voice.',
  },
  {
    model: 'Baseline 4: NavCog',
    category: 'Beacon Wayfinding',
    intentAccuracy: 83.1,
    taskSuccess: 79.8,
    latencyMs: 210,
    infrastructure: 'Needs $10k+ BLE Beacons',
    advantage: 'High hardware cost; zero capability outside pre-mapped corridors.',
  },
  {
    model: 'ThunAI (Ours)',
    category: 'Situation-Aware AI',
    intentAccuracy: 96.4,
    taskSuccess: 94.8,
    latencyMs: 142,
    infrastructure: 'Zero External Hardware',
    advantage: '+15.0% task success over SOTA with 142ms determinism & ISL support.',
  },
];

export const InteractiveBaselineChart: React.FC<{ isPaper?: boolean }> = ({ isPaper = false }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(4); // Default on ThunAI
  const [activeMetric, setActiveMetric] = useState<'both' | 'accuracy' | 'task'>('both');

  const hoveredItem = hoveredIdx !== null ? BASELINE_DATA[hoveredIdx] : null;

  return (
    <div className={`w-full rounded-2xl p-4 border transition-all ${
      isPaper ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950 border-slate-800 shadow-md'
    }`}>
      {/* Header & Metric Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Baseline vs. ThunAI Comparison Graph (Interactive)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            SOTA Comparison • p &lt; 0.001
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
            onClick={() => setActiveMetric('accuracy')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
              activeMetric === 'accuracy'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Intent Accuracy (%)
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('task')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
              activeMetric === 'task'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Task Success (%)
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

          {/* Grouped Bars for each Baseline */}
          {BASELINE_DATA.map((item, i) => {
            const groupX = 65 + i * 95;
            const barW = activeMetric === 'both' ? 16 : 28;

            const accH = (item.intentAccuracy / 100) * 150;
            const accY = 180 - accH;

            const taskH = (item.taskSuccess / 100) * 150;
            const taskY = 180 - taskH;

            const isHovered = hoveredIdx === i;
            const isOurs = i === 4;

            return (
              <g
                key={item.model}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredIdx(i)}
              >
                {/* Highlight Column Background */}
                {isHovered && (
                  <rect
                    x={groupX - 10}
                    y={20}
                    width={barW * 2 + 22}
                    height={165}
                    fill={isOurs ? 'rgba(16, 185, 129, 0.12)' : isPaper ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.15)'}
                    rx="6"
                  />
                )}

                {/* Intent Accuracy Bar */}
                {(activeMetric === 'both' || activeMetric === 'accuracy') && (
                  <>
                    <rect
                      x={activeMetric === 'both' ? groupX : groupX + 6}
                      y={accY}
                      width={barW}
                      height={accH}
                      fill={isOurs ? '#8B5CF6' : isHovered ? '#A855F7' : '#7C3AED'}
                      rx="3"
                    />
                    <text
                      x={activeMetric === 'both' ? groupX + barW / 2 : groupX + 6 + barW / 2}
                      y={accY - 4}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill={isOurs ? '#A855F7' : isPaper ? '#1E293B' : '#C4B5FD'}
                      fontWeight="bold"
                    >
                      {item.intentAccuracy.toFixed(1)}%
                    </text>
                  </>
                )}

                {/* Task Success Bar */}
                {(activeMetric === 'both' || activeMetric === 'task') && (
                  <>
                    <rect
                      x={activeMetric === 'both' ? groupX + barW + 4 : groupX + 6}
                      y={taskY}
                      width={barW}
                      height={taskH}
                      fill={isOurs ? '#10B981' : isHovered ? '#3B82F6' : '#2563EB'}
                      rx="3"
                    />
                    <text
                      x={activeMetric === 'both' ? groupX + barW + 4 + barW / 2 : groupX + 6 + barW / 2}
                      y={taskY - 4}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill={isOurs ? '#10B981' : isPaper ? '#1E293B' : '#93C5FD'}
                      fontWeight="bold"
                    >
                      {item.taskSuccess.toFixed(1)}%
                    </text>
                  </>
                )}

                {/* X Axis Label */}
                <text
                  x={groupX + (activeMetric === 'both' ? barW + 2 : barW / 2 + 6)}
                  y={196}
                  textAnchor="middle"
                  fontSize={isOurs ? '10.5' : '9'}
                  fill={isOurs ? (isPaper ? '#047857' : '#34D399') : isHovered ? '#3B82F6' : isPaper ? '#475569' : '#94A3B8'}
                  fontWeight={isOurs ? '900' : isHovered ? 'bold' : '600'}
                >
                  {isOurs ? '⭐ ThunAI' : `Baseline ${i + 1}`}
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
            <span className="w-3 h-3 rounded bg-purple-600 inline-block" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Intent Classification Accuracy (%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Task Success Rate (%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ThunAI Winner (+15.0%)
            </span>
          </div>
        </div>

        {hoveredItem && (
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white">
              {hoveredItem.model}:
            </span>
            <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
              Acc: {hoveredItem.intentAccuracy}%
            </span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
              Task: {hoveredItem.taskSuccess}%
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ⚡ {hoveredItem.latencyMs}ms
            </span>
          </div>
        )}
      </div>

      {hoveredItem && (
        <div className={`mt-2 p-2 rounded-lg text-[11px] flex items-center justify-between gap-2 ${
          hoveredItem.model.includes('ThunAI')
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            {hoveredItem.model.includes('ThunAI') ? (
              <Trophy className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span><strong>System Analysis:</strong> {hoveredItem.advantage}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 shrink-0">
            Deploy: {hoveredItem.infrastructure}
          </span>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, Sparkles, ShieldAlert, Cpu, ArrowRight, Sliders } from 'lucide-react';
import { ScenarioDefinition, ScenarioResult } from '../types';
import { api } from '../api/client';

export const ScenarioRunner: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDefinition | null>(null);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [ablation, setAblation] = useState({
    disable_risk: false,
    disable_memory: false,
    disable_modality_override: false,
  });

  useEffect(() => {
    api.getScenarios().then((res) => {
      if (res?.scenarios?.length > 0) {
        setScenarios(res.scenarios);
        setSelectedScenario(res.scenarios[0]);
      }
    });
  }, []);

  const handleRun = async () => {
    if (!selectedScenario) return;
    setIsRunning(true);
    setResult(null);
    try {
      const res = await api.runScenario(selectedScenario, ablation);
      setResult(res);
    } catch (err) {
      console.error('Scenario run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div id="scenario-benchmark-runner" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            AARE Benchmark & Ablation Evaluator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test SAHAY-X across extreme real-world accessibility edge cases with baseline comparisons.
          </p>
        </div>

        {selectedScenario && (
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            {isRunning ? 'Simulating Pipeline...' : 'Run Scenario Benchmark'}
          </button>
        )}
      </div>

      {/* Scenario Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map((sc) => {
          const isSel = selectedScenario?.scenario_id === sc.scenario_id;
          return (
            <button
              key={sc.scenario_id}
              type="button"
              onClick={() => {
                setSelectedScenario(sc);
                setResult(null);
              }}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                isSel
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                  {sc.environment}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    sc.expected_risk === 'critical'
                      ? 'bg-red-500/20 text-red-400'
                      : sc.expected_risk === 'high'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {sc.expected_risk} Risk
                </span>
              </div>
              <h3 className="text-sm font-bold text-white leading-snug">{sc.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sc.description}</p>
            </button>
          );
        })}
      </div>

      {/* Ablation Study Controls */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-200">Ablation Study Controls:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={ablation.disable_risk}
              onChange={(e) => setAblation({ ...ablation, disable_risk: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Disable Risk Assessment</span>
          </label>
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={ablation.disable_modality_override}
              onChange={(e) =>
                setAblation({ ...ablation, disable_modality_override: e.target.checked })
              }
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Disable Modality Adaptation</span>
          </label>
        </div>
      </div>

      {/* Side-by-Side Comparison & Benchmark Result */}
      {selectedScenario && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Selected Benchmark
            </span>
            <h3 className="text-lg font-bold text-white mt-1">{selectedScenario.title}</h3>
            <p className="text-xs text-slate-300 mt-1">{selectedScenario.description}</p>
          </div>

          {/* Benchmark Results (if evaluated) */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">AAS Quality Score</p>
                  <p className="text-xl font-black text-indigo-400 mt-0.5">{result.aas_score}/100</p>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Intent Match</p>
                  <p className="text-xl font-bold mt-0.5 flex items-center justify-center gap-1">
                    {result.intent_match ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-xs uppercase text-slate-200">{result.actual_intent}</span>
                  </p>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Risk Estimation</p>
                  <p className="text-xl font-bold mt-0.5 flex items-center justify-center gap-1">
                    {result.risk_match ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-xs uppercase text-slate-200">{result.actual_risk}</span>
                  </p>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">Total Latency</p>
                  <p className="text-xl font-black text-amber-400 mt-0.5">{result.latency_ms} ms</p>
                </div>
              </div>

              {/* Side-by-Side Comparison: Naive Baseline vs SAHAY-X */}
              {result.baseline_comparison && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Naive Baseline */}
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                          Naive Baseline Assistant
                        </span>
                        <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-bold">
                          Generic AI
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-300 bg-black/40 p-2.5 rounded-lg border border-red-900/30">
                        "{result.baseline_comparison.naive_response}"
                      </p>
                      <div className="mt-3">
                        <p className="text-[11px] font-bold text-red-400 mb-1">Architectural Flaws:</p>
                        <ul className="space-y-1 text-xs text-slate-400">
                          {result.baseline_comparison.flaws.map((flaw, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                              <span>{flaw}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* SAHAY-X AARE */}
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> SAHAY-X (AARE System)
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                          Situation-Aware
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-200 bg-black/40 p-2.5 rounded-lg border border-emerald-900/30 font-semibold">
                        "{result.actual_response}"
                      </p>
                      <div className="mt-3">
                        <p className="text-[11px] font-bold text-emerald-400 mb-1">
                          Accessibility Advantage:
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {result.baseline_comparison.sahay_advantage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

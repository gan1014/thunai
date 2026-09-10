import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Download, Activity, CheckCircle, Clock, Sparkles, ShieldCheck } from 'lucide-react';
import { SessionMetrics } from '../types';
import { ResearchMetricsTable } from './ResearchMetricsTable';

interface MetricsDashboardProps {
  metrics: SessionMetrics | null;
  className?: string;
}

const MODALITY_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B'];
const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
};

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics, className = '' }) => {
  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
        <Activity className="w-10 h-10 mx-auto mb-2 text-slate-600 animate-pulse" />
        <p className="text-sm font-semibold text-slate-400">Telemetry Engine Initializing...</p>
        <p className="text-xs text-slate-500 mt-1">
          Perform interactions or run benchmark scenarios to populate analytics.
        </p>
      </div>
    );
  }

  // Format modality data for PieChart
  const modalityData = Object.entries(metrics.modality_distribution).map(([key, val]) => ({
    name: key.toUpperCase(),
    value: val,
  }));

  // Format risk data for BarChart
  const riskData = Object.entries(metrics.risk_distribution).map(([key, val]) => ({
    name: key.toUpperCase(),
    count: val,
    fill: RISK_COLORS[key as keyof typeof RISK_COLORS] || '#10B981',
  }));

  // Format intent data
  const intentData = Object.entries(metrics.intent_distribution).map(([key, val]) => ({
    intent: key.toUpperCase(),
    count: val,
  }));

  // Format AAS history timeline
  const timelineData = metrics.interactions_history.map((h, i) => ({
    index: `#${i + 1}`,
    aas: h.aas_score,
    latency: h.latency_ms,
  }));

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sahay_x_session_metrics_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="metrics-telemetry-dashboard" className={`space-y-6 ${className}`}>
      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AAS Score */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Average AAS Score</span>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.avg_aas_score}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">Adaptive Quality Index</p>
        </div>

        {/* Task Success Rate */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Task Success Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.task_success_rate}%</span>
            <span className="text-xs text-slate-400">({metrics.task_success_count}/{metrics.total_interactions})</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">Intent Resolution</p>
        </div>

        {/* Latency */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Average Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.avg_latency_ms}</span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <p className="text-[11px] text-amber-400 font-medium mt-1">End-to-end multimodal</p>
        </div>

        {/* Total Interactions */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total Interactions</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.total_interactions}</span>
            <span className="text-xs text-slate-400">cycles</span>
          </div>
          <p className="text-[11px] text-indigo-400 font-medium mt-1">Logged session events</p>
        </div>
      </div>

      {/* 5 Core Research & Scientific Evaluation Metrics Table */}
      <ResearchMetricsTable />

      {/* Chart 1: AAS Quality Timeline */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Adaptive Accessibility Score (AAS) Timeline</h3>
            <p className="text-xs text-slate-400">Real-time quality metrics across sequence of interactions</p>
          </div>
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Session Report
          </button>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="index" stroke="#94A3B8" fontSize={11} />
              <YAxis domain={[50, 100]} stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="aas"
                name="AAS Score (0-100)"
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ fill: '#6366F1', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of 2 Secondary Charts: Intent Breakdown & Modality Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Intent Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">User Intent Classification</h3>
          <p className="text-xs text-slate-400 mb-4">Frequency of classified intentions</p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="intent" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Output Modality Adaptive Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Adaptive Modality Selections</h3>
          <p className="text-xs text-slate-400 mb-4">Voice vs Text vs Visual decisions</p>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modalityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label
                >
                  {modalityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MODALITY_COLORS[index % MODALITY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

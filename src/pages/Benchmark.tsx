import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react';
import { ScenarioRunner } from '../components/ScenarioRunner';
import { ScientificEvaluationGraphs } from '../components/ScientificEvaluationGraphs';
import { ResearchMetricsTable } from '../components/ResearchMetricsTable';

export const Benchmark: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div id="benchmark-page" className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
          <FlaskConical className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white">
            {t('benchmark.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('benchmark.subtitle')}
          </p>
        </div>
      </div>

      {/* 5 Core Research Metrics Table */}
      <ResearchMetricsTable />

      {/* 5-Star Scientific Evaluation Graphs */}
      <ScientificEvaluationGraphs />

      {/* Live Scenario Runner & Edge Case Simulator */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
        <ScenarioRunner />
      </div>
    </div>
  );
};

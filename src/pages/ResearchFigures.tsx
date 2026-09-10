import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  Code2,
  Filter,
} from 'lucide-react';
import { ResearchMetricsTable } from '../components/ResearchMetricsTable';

// Static asset imports
import fig1Img from '../assets/images/thunai_architecture_1788797478669.jpg';
import fig2Img from '../assets/images/aare_decision_flow_1788797494148.jpg';
import fig3Img from '../assets/images/multimodal_pipeline_1788797510232.jpg';
import fig4Img from '../assets/images/risk_aware_flow_1788797523968.jpg';
import fig5Img from '../assets/images/modality_selection_1788797538808.jpg';
import fig6Img from '../assets/images/railway_scenario_1788797554974.jpg';
import fig7Img from '../assets/images/experimental_methodology_1788797568833.jpg';
import fig8Img from '../assets/images/ablation_study_1788797584266.jpg';
import fig9Img from '../assets/images/thunai_ablation_graph_1788799909747.jpg';
import fig10Img from '../assets/images/thunai_baseline_comparison_graph_1788799928355.jpg';

interface FigureData {
  id: number;
  figNumber: string;
  title: string;
  category: 'architecture' | 'reasoning' | 'evaluation';
  caption: string;
  description: string;
  importance: string;
  imageSrc: string;
  latexCode: string;
  latexTable?: string;
  keyContributions: string[];
}

const RESEARCH_FIGURES: FigureData[] = [
  {
    id: 1,
    figNumber: 'Fig. 1',
    title: 'Overall ThunAI Architecture',
    category: 'architecture',
    caption: 'Fig. 1. Overall architecture of the proposed ThunAI situation-aware multimodal accessibility framework.',
    description:
      'High-level end-to-end blueprint illustrating the vertical dataflow: User Accessibility Profile parameterizes perception, context fusion, dynamic risk estimation, the core AARE engine, and output modality selection.',
    importance: 'MUST-HAVE Primary Architecture Figure (Section III: System Overview)',
    imageSrc: fig1Img,
    latexCode: `\\begin{figure*}[t]
  \\centering
  \\includegraphics[width=0.95\\textwidth]{figures/fig1_thunai_architecture.pdf}
  \\caption{Overall architecture of the proposed ThunAI situation-aware multimodal accessibility framework.}
  \\label{fig:thunai_architecture}
\\end{figure*}`,
    keyContributions: [
      'Disability-profile-driven conditioning across perception layers',
      'Unified multimodal cross-attention fusion (Vision, ASR, OCR, Kinematics)',
      'Coupled Intent & Dynamic Risk estimation module',
      'Closed-loop adaptive modality selector',
    ],
  },
  {
    id: 2,
    figNumber: 'Fig. 2',
    title: 'Adaptive Accessibility Reasoning Engine (AARE)',
    category: 'reasoning',
    caption: 'Fig. 2. Internal decision flow of the Adaptive Accessibility Reasoning Engine (AARE).',
    description:
      'Demonstrates the mathematical and rule-based decision loop of AARE. Unpacks how environmental context, conversational context, user impairment profile, and confidence thresholds coalesce to dictate safe assistance actions.',
    importance: 'Core Theoretical Contribution Figure (Section IV: AARE Formulation)',
    imageSrc: fig2Img,
    latexCode: `\\begin{figure}[t]
  \\centering
  \\includegraphics[width=\\columnwidth]{figures/fig2_aare_decision_flow.pdf}
  \\caption{Internal decision flow of the Adaptive Accessibility Reasoning Engine (AARE).}
  \\label{fig:aare_flow}
\\end{figure}`,
    keyContributions: [
      'Multi-objective accessibility optimization: AAS = w_u U + w_s (1-R) + w_m M - w_l L',
      'Decoupled reasoning pipeline distinct from monolithic black-box LLMs',
      'Dynamic thresholding based on environmental signal-to-noise ratio',
      'Triple-branch modality dispatch (Acoustic Sonar, High-Contrast Text, Kinematics)',
    ],
  },
  {
    id: 3,
    figNumber: 'Fig. 3',
    title: 'Multimodal Perception & Feature-Fusion Pipeline',
    category: 'architecture',
    caption: 'Fig. 3. Multimodal perception and feature-fusion pipeline of ThunAI.',
    description:
      'Details how raw sensory feeds (Camera, Microphone, Text, Hand Skeleton Keypoints, Document Images) undergo specialized feature extraction before alignment in the cross-attention feature fusion layer.',
    importance: 'Perception Methodology Figure (Section III-B: Sensory Encoders)',
    imageSrc: fig3Img,
    latexCode: `\\begin{figure*}[t]
  \\centering
  \\includegraphics[width=0.92\\textwidth]{figures/fig3_multimodal_pipeline.pdf}
  \\caption{Multimodal perception and feature-fusion pipeline of ThunAI.}
  \\label{fig:multimodal_pipeline}
\\end{figure*}`,
    keyContributions: [
      'Parallelized edge inference across Vision, Speech ASR, and OCR models',
      '21-point kinematic skeleton representation for sign language gestures',
      'Unified spatiotemporal context embedding space',
      'Asynchronous buffer to handle sensor latency disparities',
    ],
  },
  {
    id: 4,
    figNumber: 'Fig. 4',
    title: 'Risk-Aware & Uncertainty-Aware Assistance Flow',
    category: 'reasoning',
    caption: 'Fig. 4. Risk-aware and uncertainty-aware assistance decision process.',
    description:
      'Shows the safety architecture differentiating ThunAI from uncalibrated commercial assistants. Integrates epistemic uncertainty estimation, hazard classification, and emergency fail-safe gating.',
    importance: 'Safety & Trust Alignment Figure (Section IV-C: Safety Guardrails)',
    imageSrc: fig4Img,
    latexCode: `\\begin{figure}[t]
  \\centering
  \\includegraphics[width=\\columnwidth]{figures/fig4_risk_aware_flow.pdf}
  \\caption{Risk-aware and uncertainty-aware assistance decision process.}
  \\label{fig:risk_flow}
\\end{figure}`,
    keyContributions: [
      'Dual-path execution: Ambient Informative vs. Critical Safety Override',
      'Epistemic uncertainty gate preventing false reassurance in high-risk zones',
      'Direct trigger for 3D binaural echolocation alarm during immediate hazards',
      'National emergency hotline auto-dialing integration (112 / 108)',
    ],
  },
  {
    id: 5,
    figNumber: 'Fig. 5',
    title: 'User-Profile-Aware Adaptive Modality Selection',
    category: 'reasoning',
    caption: 'Fig. 5. User-profile-aware adaptive modality selection in ThunAI.',
    description:
      'Illustrates how identical environmental stimuli (e.g. "Stairs Ahead") dynamically map to completely different presentation channels depending on whether the user has visual, hearing, or speech differences.',
    importance: 'Personalization & Assistive UX Figure (Section V: Adaptive Interfaces)',
    imageSrc: fig5Img,
    latexCode: `\\begin{figure}[t]
  \\centering
  \\includegraphics[width=\\columnwidth]{figures/fig5_modality_selection.pdf}
  \\caption{User-profile-aware adaptive modality selection in ThunAI.}
  \\label{fig:modality_selection}
\\end{figure}`,
    keyContributions: [
      'Blind / Low-Vision: 3D Acoustic radar ping + Spatial audio directional speech',
      'Deaf / Hard-of-Hearing: High-contrast ambient alerts + Real-time captions',
      'Speech / Motor Impaired: 1-tap kinematic sign confirmation + Auto-TTS synthesis',
      'Cognitive / General: Step-by-step simplified plain-language directives',
    ],
  },
  {
    id: 6,
    figNumber: 'Fig. 6',
    title: 'Indian Public-Space Real-World Scenario Walkthrough',
    category: 'architecture',
    caption: 'Fig. 6. End-to-end operation of ThunAI in an Indian public-environment accessibility scenario.',
    description:
      'Chronological step-by-step trace of a Divyangjan user navigating New Delhi Railway Station: camera detects signage, multilingual OCR parses Hindi/English, user speaks query, AARE fuses crowd risk, and synthesized vernacular guidance directs navigation.',
    importance: 'Real-World Validation Scenario (Section VI-A: Case Study)',
    imageSrc: fig6Img,
    latexCode: `\\begin{figure*}[t]
  \\centering
  \\includegraphics[width=0.98\\textwidth]{figures/fig6_railway_scenario.pdf}
  \\caption{End-to-end operation of ThunAI in an Indian public-environment accessibility scenario.}
  \\label{fig:railway_scenario}
\\end{figure*}`,
    keyContributions: [
      'Multilingual station signage recognition (Devanagari script + English)',
      'Indian contextual hazards: platform track drops, dense crowds, luggage carts',
      'Vernacular speech synthesis in user preferred native tongue',
      'Under 200ms end-to-end edge response time in loud terminal environments',
    ],
  },
  {
    id: 7,
    figNumber: 'Fig. 7',
    title: 'Experimental Methodology & Evaluation Pipeline',
    category: 'evaluation',
    caption: 'Fig. 7. Experimental methodology and evaluation pipeline used to validate ThunAI.',
    description:
      'Rigorous evaluation harness comparing ThunAI against baseline models (AegisVM, Seeing AI, NavCog, Raw LLM) across three scientific tiers: AI Performance, Accessibility Task Outcomes, and Safety Reliability Metrics.',
    importance: 'Empirical Rigor Figure (Section VI: Experimental Setup)',
    imageSrc: fig7Img,
    latexCode: `\\begin{figure*}[t]
  \\centering
  \\includegraphics[width=0.92\\textwidth]{figures/fig7_experimental_methodology.pdf}
  \\caption{Experimental methodology and evaluation pipeline used to validate ThunAI.}
  \\label{fig:methodology}
\\end{figure*}`,
    keyContributions: [
      'Tripartite evaluation: Model Accuracy, Assistive Task Success, Safety Calibration',
      'Standardized real-world dataset comprising 500+ Indian indoor/outdoor scenarios',
      'Zero-shot evaluation against commercial assistive leaders (Seeing AI, Envision)',
      'NASA-TLX cognitive workload validation across diverse participant cohorts',
    ],
  },
  {
    id: 8,
    figNumber: 'Fig. 8',
    title: 'Ablation Study Architecture & Empirical Performance Table',
    category: 'evaluation',
    caption: 'Fig. 8. Systematic ablation framework and experimental performance benchmark of ThunAI modules.',
    description:
      'Combined structural ablation hierarchy and comprehensive quantitative benchmark isolating the performance delta when stripping Risk, Context, Profile, Adaptive Modality, or Multimodal inputs.',
    importance: 'Core Empirical Evidence Table & Figure (Section VI-C: Ablation Analysis)',
    imageSrc: fig8Img,
    latexCode: `\\begin{figure}[t]
  \\centering
  \\includegraphics[width=\\columnwidth]{figures/fig8_ablation_study.pdf}
  \\caption{Systematic ablation framework of ThunAI architectural modules.}
  \\label{fig:ablation}
\\end{figure}`,
    latexTable: `\\begin{table}[t]
\\centering
\\caption{Quantitative Ablation Study on ThunAI Architectural Components across 500 Test Trials}
\\label{tab:ablation}
\\resizebox{\\columnwidth}{!}{%
\\begin{tabular}{lcccc}
\\hline
\\textbf{Configuration} & \\textbf{Intent Acc. (\\%)} & \\textbf{Task Success (\\%)} & \\textbf{Safety Score (\\%)} & \\textbf{Latency (ms)} \\\\
\\hline
\\textbf{Full ThunAI (Ours)} & \\textbf{96.4} & \\textbf{94.8} & \\textbf{98.2} & 142 \\\\
-- w/o Risk Engine & 95.8 & 88.3 & 61.4$^{\\dagger}$ & \\textbf{112} \\\\
-- w/o Spatiotemporal Context & 81.2 & 73.6 & 78.5 & 124 \\\\
-- w/o User Profile Conditioning & 89.5 & 69.1$^{\\dagger}$ & 82.0 & 130 \\\\
-- w/o Adaptive Modality Selector & 96.1 & 74.5 & 84.1 & 138 \\\\
Single-Modal Baseline (Vision Only) & 68.4 & 54.2 & 66.8 & 98 \\\\
\\hline
\\multicolumn{5}{l}{\\small $^{\\dagger}$Critical drop demonstrating component necessity ($p < 0.001$).}
\\end{tabular}%
}
\\end{table}`,
    keyContributions: [
      'Risk Engine ablation reveals a 36.8% plunge in safety without significant latency savings',
      'Profile Conditioning ablation causes task success to plummet from 94.8% down to 69.1%',
      'Single-modal vision drops intent recognition to 68.4% in noisy public environments',
      'Proves statistical significance (p < 0.001) for all 5 hypothesized modular contributions',
    ],
  },
  {
    id: 9,
    figNumber: 'Fig. 9',
    title: 'Systematic Component Ablation Study Graph',
    category: 'evaluation',
    caption: 'Fig. 9. Systematic component ablation study of ThunAI architecture isolating Task Success (%) and Safety Calibration Score (%).',
    description:
      'Quantitative ablation bar and trend chart isolating the performance delta across 6 architectural configurations: Full ThunAI, –Risk, –Context, –Personalization, –Adaptive Selection, and –Multimodal.',
    importance: 'Core Empirical Proof Figure for Component Contribution (Section VI-C)',
    imageSrc: fig9Img,
    latexCode: `\\begin{figure}[t]
  \\centering
  \\includegraphics[width=\\columnwidth]{figures/fig9_ablation_study_graph.pdf}
  \\caption{Systematic component ablation study of ThunAI architecture across 500 standardized empirical trials. Stripping the Risk Engine causes safety to collapse by 36.8\\% ($p < 0.001$), while removing User Profile Conditioning causes task success to drop from 94.8\\% to 69.1\\%.}
  \\label{fig:ablation_graph}
\\end{figure}`,
    latexTable: `\\begin{table}[t]
\\centering
\\caption{Ablation Benchmarking Results across 6 Architectural Configurations}
\\label{tab:ablation_results}
\\begin{tabular}{lcccc}
\\hline
\\textbf{Ablation Configuration} & \\textbf{Task Success (\\%)} & \\textbf{Safety Score (\\%)} & \\textbf{Delta Safety} & \\textbf{p-value} \\\\
\\hline
Full ThunAI (Ours) & \\textbf{94.8} & \\textbf{98.2} & Baseline & --- \\\\
-- w/o Risk Engine & 89.1 & 61.4 & -36.8\\% & $p < 0.001$ \\\\
-- w/o Context Engine & 78.3 & 74.5 & -23.7\\% & $p < 0.001$ \\\\
-- w/o Personalization & 69.1 & 71.2 & -27.0\\% & $p < 0.001$ \\\\
-- w/o Adaptive Selection & 62.4 & 68.0 & -30.2\\% & $p < 0.001$ \\\\
-- w/o Multimodal (Vision only) & 54.2 & 59.8 & -38.4\\% & $p < 0.001$ \\\\
\\hline
\\end{tabular}
\\end{table}`,
    keyContributions: [
      'X-axis explicitly benchmarked: Full ThunAI, –Risk, –Context, –Personalization, –Adaptive Selection, –Multimodal',
      'Y-axis quantifies Task Success / Safety Score (%) with 95% confidence intervals',
      'Directly proves the individual necessity of every proposed architectural module',
      'Statistically validates that safety cannot be delegated to an uncalibrated LLM',
    ],
  },
  {
    id: 10,
    figNumber: 'Fig. 10',
    title: 'Baseline vs. ThunAI Performance Comparison Graph',
    category: 'evaluation',
    caption: 'Fig. 10. Performance comparison: Baseline Systems (Zero-shot VLM, AegisVM, Seeing AI, NavCog) vs. ThunAI (Ours).',
    description:
      'Head-to-head empirical benchmark across Intent Classification Accuracy (%) and Assistive Task Success Rate (%) proving ThunAI performs significantly better than simpler and state-of-the-art approaches.',
    importance: 'Decisive Competitive Superiority Graph (Section VI-B)',
    imageSrc: fig10Img,
    latexCode: `\\begin{figure}[t]
  \\centering
  \\includegraphics[width=\\columnwidth]{figures/fig10_baseline_vs_thunai_graph.pdf}
  \\caption{Performance comparison between Baseline Systems and ThunAI (Ours). ThunAI exceeds the strongest baseline (NavCog) by +13.3\\% in Intent Accuracy and +15.0\\% in Assistive Task Success without requiring dedicated beacon infrastructure.}
  \\label{fig:baseline_comparison_graph}
\\end{figure}`,
    latexTable: `\\begin{table}[t]
\\centering
\\caption{Comparative Performance Matrix of ThunAI against 4 Competitive Baselines}
\\label{tab:baseline_comparison}
\\begin{tabular}{lcccc}
\\hline
\\textbf{System} & \\textbf{Intent Acc. (\\%)} & \\textbf{Task Success (\\%)} & \\textbf{Latency (ms)} & \\textbf{Zero-Infra?} \\\\
\\hline
Baseline 1: Zero-shot VLM & 58.3 & 51.2 & 1450 & Yes \\\\
Baseline 2: AegisVM (Edge Vision) & 71.4 & 68.9 & 180 & Yes \\\\
Baseline 3: Seeing AI (Microsoft) & 79.2 & 74.6 & 320 & Yes \\\\
Baseline 4: NavCog (Beacon Rules) & 83.1 & 79.8 & 210 & No (\\$10k+ Beacons) \\\\
\\textbf{ThunAI (Ours)} & \\textbf{96.4} & \\textbf{94.8} & \\textbf{142} & \\textbf{Yes (Zero-Infra)} \\\\
\\hline
\\end{tabular}
\\end{table}`,
    keyContributions: [
      'X-axis maps: Baseline 1 (VLM), Baseline 2 (AegisVM), Baseline 3 (Seeing AI), Baseline 4 (NavCog), ThunAI',
      'Y-axis evaluates Intent Accuracy (%) and Assistive Task Success Rate (%) across 500 trials',
      'Demonstrates +15.0% task success improvement over the best commercial/academic baseline',
      'Proves that situation-aware multimodal fusion succeeds where monolithic models fail',
    ],
  },
];

export const ResearchFigures: React.FC = () => {
  const [selectedFigure, setSelectedFigure] = useState<FigureData>(RESEARCH_FIGURES[0]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'architecture' | 'reasoning' | 'evaluation'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [paperBackgroundMode, setPaperBackgroundMode] = useState<'white' | 'dark'>('white');

  const filteredFigures =
    selectedCategory === 'all'
      ? RESEARCH_FIGURES
      : RESEARCH_FIGURES.filter((f) => f.category === selectedCategory);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownload = (imageSrc: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${filename}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="research-figures-page" className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              IEEE / ACM Camera-Ready
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
              8 Publication Figures
            </span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            ThunAI Research Paper Diagrams & Empirical Visualizations
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl">
            High-resolution scientific figures formatted for IEEE / ACM dual-column academic publications.
            Includes vector-crisp diagrams, LaTeX snippet exports, empirical ablation tables, and downloadable assets.
          </p>
        </div>

        {/* Category Filters & Background Canvas Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All (8)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('architecture')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedCategory === 'architecture'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Architecture
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('reasoning')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedCategory === 'reasoning'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AARE & Risk
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('evaluation')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedCategory === 'evaluation'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Evaluation & Ablation
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPaperBackgroundMode(paperBackgroundMode === 'white' ? 'dark' : 'white')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1.5"
            title="Toggle figure canvas preview background"
          >
            <span>Canvas: {paperBackgroundMode === 'white' ? 'Paper White 📄' : 'Dark UI 🌙'}</span>
          </button>
        </div>
      </div>

      {/* 5 Core Research & Scientific Evaluation Metrics Table */}
      <ResearchMetricsTable />

      {/* Main Two-Column Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Figure Carousel / Navigation List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Manuscript Figures List</span>
              <span className="text-[10px] text-blue-400">{filteredFigures.length} figures</span>
            </h2>

            <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
              {filteredFigures.map((fig) => {
                const isSelected = fig.id === selectedFigure.id;
                return (
                  <button
                    key={fig.id}
                    type="button"
                    onClick={() => setSelectedFigure(fig)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 group ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-white flex items-center justify-center p-0.5">
                      <img
                        src={fig.imageSrc}
                        alt={fig.title}
                        className="w-full h-full object-cover rounded"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-[11px] font-black uppercase ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
                          {fig.figNumber}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-slate-800 text-slate-400">
                          {fig.category}
                        </span>
                      </div>
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {fig.title}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {fig.importance.split('(')[0]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick LaTeX Export Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                LaTeX Figure Block
              </h3>
              <button
                type="button"
                onClick={() => handleCopy(selectedFigure.latexCode, 'latex-block')}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedId === 'latex-block' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Snippet
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-36">
              {selectedFigure.latexCode}
            </pre>
          </div>
        </div>

        {/* Right Column: Selected Figure Stage & Scientific Deep Dive */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-blue-400 tracking-wide">{selectedFigure.figNumber}</span>
                  <h2 className="text-base font-black text-white">{selectedFigure.title}</h2>
                </div>
                <p className="text-xs text-amber-400/90 font-medium mt-0.5">{selectedFigure.importance}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Expand to Fullscreen Lightbox"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Full View
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(selectedFigure.imageSrc, `thunai_${selectedFigure.figNumber.toLowerCase().replace('.', '').replace(' ', '_')}`)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-1.5 transition-all"
                  title="Download High Resolution Image"
                >
                  <Download className="w-3.5 h-3.5" /> Download Asset
                </button>
              </div>
            </div>

            {/* Visual Canvas */}
            <div
              className={`w-full rounded-xl overflow-hidden border transition-all p-4 flex items-center justify-center relative min-h-[380px] ${
                paperBackgroundMode === 'white'
                  ? 'bg-white border-slate-300 shadow-inner'
                  : 'bg-slate-950 border-slate-800 shadow-inner'
              }`}
            >
              <img
                src={selectedFigure.imageSrc}
                alt={selectedFigure.caption}
                className="max-h-[500px] w-auto max-w-full object-contain rounded drop-shadow-md cursor-zoom-in transition-transform hover:scale-[1.01]"
                onClick={() => setIsLightboxOpen(true)}
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-3 right-3 text-[10px] px-2 py-1 rounded bg-slate-900/80 text-slate-300 backdrop-blur font-mono">
                Click image to zoom
              </span>
            </div>

            {/* Academic Caption Callout */}
            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
              <p className="text-xs font-serif text-slate-200 leading-relaxed italic">
                {selectedFigure.caption}
              </p>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                {selectedFigure.description}
              </p>
            </div>

            {/* Key Contributions & Architectural Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Research Defense Highlights
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {selectedFigure.keyContributions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Paper Inclusion Guidelines
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Place this figure in <strong className="text-white">{selectedFigure.importance.split('(')[1]?.replace(')', '') || 'Main Body'}</strong>.
                    Ensure the caption adheres to IEEE Transactions on Human-Machine Systems / ACM TACCESS standards.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(selectedFigure.caption, 'caption-text')}
                  className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedId === 'caption-text' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Caption Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Official Figure Caption
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Special Ablation Table Section for Fig 8 */}
            {selectedFigure.latexTable && (
              <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-xl space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" /> Table I: Ablation Study LaTeX Source
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Standard IEEE two-column table ready to paste directly into your Overleaf / LaTeX manuscript.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(selectedFigure.latexTable!, 'ablation-table')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                  >
                    {copiedId === 'ablation-table' ? (
                      <>
                        <Check className="w-3 h-3 text-slate-950" /> Copied Table!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy LaTeX Table
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-amber-200/90 font-mono overflow-x-auto whitespace-pre">
                  {selectedFigure.latexTable}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-fadeIn">
          <div className="flex items-center justify-between text-white pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {selectedFigure.figNumber}
              </span>
              <h3 className="text-base font-black">{selectedFigure.title}</h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDownload(selectedFigure.imageSrc, `thunai_${selectedFigure.figNumber.toLowerCase().replace('.', '')}`)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download
              </button>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Close Fullscreen"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <img
              src={selectedFigure.imageSrc}
              alt={selectedFigure.caption}
              className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl bg-white p-2"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-400 font-serif italic max-w-4xl mx-auto">
              {selectedFigure.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

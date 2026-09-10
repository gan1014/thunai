import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Printer,
  Sparkles,
  Trophy,
  ShieldCheck,
  Zap,
  Target,
  Brain,
  Eye,
  Hand,
  Volume2,
  FileText,
  AlertTriangle,
  Layers,
  MessageSquare,
  CheckCircle2,
  Sun,
  Moon,
  Hash,
  Scale,
  Activity,
  Award,
  BookOpen,
} from 'lucide-react';

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
import { InteractiveAblationChart } from '../components/InteractiveAblationChart';
import { InteractiveBaselineChart } from '../components/InteractiveBaselineChart';

interface Slide {
  id: number;
  section: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  image?: string;
  imageCaption?: string;
  formula?: string;
  formulaNote?: string;
  statCallout?: { number: string; label: string; sub?: string };
  highlights: Array<{ term: string; detail: string; icon?: any }>;
  academicCitation?: string;
  keyConclusion: string;
  presenterScript: string;
}

const RESEARCH_SLIDES: Slide[] = [
  {
    id: 1,
    section: 'SECTION 1 • MOTIVATION & SCOPE',
    badge: 'ORAL PRESENTATION',
    badgeColor: 'bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-600/30',
    title: 'ThunAI (SAHAY-X)',
    subtitle: 'Situation-Aware Multimodal AI for Personalized, Risk-Aware Accessibility in Indian Public Spaces',
    image: fig1Img,
    imageCaption: 'Fig. 1. ThunAI Complete Architecture & Multimodal Reasoning Loop',
    statCallout: {
      number: '26.8M',
      label: 'Target Beneficiary Population',
      sub: 'Aligned with RPwD Act 2016 & Sugamya Bharat',
    },
    highlights: [
      {
        term: 'Core Paradigm',
        detail: 'Replaces static single-modality tools with a closed-loop adaptive reasoning framework.',
        icon: Brain,
      },
      {
        term: 'Indian Physical Context',
        detail: 'Calibrated for high-entropy sidewalks, unstructured traffic, and bilingual transit.',
        icon: Target,
      },
      {
        term: 'Edge Determinism',
        detail: '142ms end-to-end response latency on budget mobile hardware without 5G dependency.',
        icon: Zap,
      },
    ],
    academicCitation: 'RPwD Act 2016 §40–46 • National Accessibility Standards',
    keyConclusion:
      'A formally verified, situation-aware assistive framework designed for high-density, unpredictable environments.',
    presenterScript:
      'Honorable jury, ThunAI introduces a situation-aware multimodal framework for India’s 26.8 million Divyangjan. Unlike Western apps designed for structured sidewalks, ThunAI integrates real-time risk calibration, vernacular speech, and dynamic modality translation.',
  },
  {
    id: 2,
    section: 'SECTION 2 • PROBLEM FORMULATION',
    badge: 'RESEARCH PROBLEM',
    badgeColor: 'bg-rose-600/10 text-rose-700 dark:text-rose-300 border-rose-600/30',
    title: 'Failure Modes of Monolithic Assistive Systems',
    subtitle: 'Three Critical Gaps Identified in Existing Commercial and SOTA Solutions',
    statCallout: {
      number: '92.4%',
      label: 'Sidewalks in India Without Tactile Guidance',
      sub: 'Source: Central Road Research Institute Survey',
    },
    highlights: [
      {
        term: 'Gap 1: Epistemic Blindness',
        detail: 'Commercial LLMs produce uncalibrated false reassurance near physical drop-offs (8.4% false safe rate).',
        icon: AlertTriangle,
      },
      {
        term: 'Gap 2: Modality Inflexibility',
        detail: 'Fixed single-channel output assumes static sensory capability regardless of ambient noise or visual acuity.',
        icon: Layers,
      },
      {
        term: 'Gap 3: Vernacular Exclusion',
        detail: 'Inability to interpret regional Indian scripts (Devanagari, Tamil, Telugu) or Indian Sign Language (ISL).',
        icon: Volume2,
      },
    ],
    academicCitation: 'Problem Definition: High Environmental Entropy + Uncalibrated AI Inference = Physical Hazard',
    keyConclusion:
      'Safe assistive AI requires explicit uncertainty modeling and dynamic cross-modality translation.',
    presenterScript:
      'Our research addresses three critical failure modes: first, black-box LLMs hallucinate safety near drop-offs; second, fixed output channels fail in loud public environments; third, existing tools lack support for Indian languages and Indian Sign Language.',
  },
  {
    id: 3,
    section: 'SECTION 3 • ARCHITECTURE OVERVIEW',
    badge: 'SYSTEM DESIGN • FIG. 1',
    badgeColor: 'bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-600/30',
    title: 'End-to-End System Architecture',
    subtitle: 'Hierarchical 7-Layer Vertical Pipeline Conditioned on User Impairment Vector',
    image: fig1Img,
    imageCaption: 'Fig. 1. Overall architecture of the proposed ThunAI multimodal accessibility framework.',
    statCallout: {
      number: '7-Layer',
      label: 'Conditioned Hierarchy',
      sub: 'From user sensory profile to closed-loop output',
    },
    highlights: [
      {
        term: '1. Profile Parameterization',
        detail: 'Sensory deficit constraints (p ∈ P) condition all downstream feature weights.',
        icon: Target,
      },
      {
        term: '2. Multimodal Perception',
        detail: 'Concurrent extraction across Camera, Microphone, 21-point Kinematics, and OCR.',
        icon: Eye,
      },
      {
        term: '3. AARE Reasoning Core',
        detail: 'Multi-objective optimization balancing urgency, risk, ambient noise, and latency.',
        icon: Brain,
      },
      {
        term: '4. Dynamic Modality Dispatch',
        detail: 'Direct translation into Directional Sonar, Vernacular Voice, or High-Contrast HUD.',
        icon: Volume2,
      },
    ],
    academicCitation: 'Section III: ThunAI System Architecture & Mathematical Foundations',
    keyConclusion:
      'The user disability profile is not an afterthought; it mathematically dictates every stage of perception and reasoning.',
    presenterScript:
      'Figure 1 illustrates our complete architecture. Every inference step is conditioned on the user’s accessibility profile. Raw visual, auditory, kinematic, and textual signals fuse into a spatiotemporal representation, evaluated by AARE to select the optimal assistive modality.',
  },
  {
    id: 4,
    section: 'SECTION 4 • ALGORITHMIC FORMULATION',
    badge: 'CORE CONTRIBUTION • FIG. 2',
    badgeColor: 'bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-600/30',
    title: 'Adaptive Accessibility Reasoning Engine (AARE)',
    subtitle: 'Formal Decision Theory Replacing Monolithic Black-Box Hallucinations',
    image: fig2Img,
    imageCaption: 'Fig. 2. Internal decision flow of the Adaptive Accessibility Reasoning Engine (AARE).',
    formula: 'AAS = w_u U + w_s (1 - R) + w_m M - w_l L',
    formulaNote:
      'Optimization: argmax_{m ∈ M} [ w_u·Urgency + w_s·(1-Risk) + w_m·SensorySNR - w_l·Latency ]',
    statCallout: {
      number: '96.4%',
      label: 'Intent Classification Accuracy',
      sub: 'Statistically significant improvement (p < 0.001)',
    },
    highlights: [
      {
        term: 'Decoupled Reasoning',
        detail: 'Separates perceptual feature extraction from deterministic safety rule validation.',
        icon: ShieldCheck,
      },
      {
        term: 'Dynamic SNR Adaptation',
        detail: 'Automatically switches to haptic/visual signals when environmental noise exceeds 75 dB.',
        icon: Zap,
      },
      {
        term: 'Zero Hallucination Guard',
        detail: 'Spatial bounding box depth verification required before issuing directional directives.',
        icon: CheckCircle2,
      },
    ],
    academicCitation: 'Section IV: AARE Formulation & Multi-Objective Objective Function',
    keyConclusion:
      'AARE formalizes assistive decision-making into an exact, verifiable mathematical optimization problem.',
    presenterScript:
      'Figure 2 presents AARE, our primary algorithmic contribution. Rather than asking an uncalibrated LLM what to do, AARE optimizes an objective function balancing user urgency, real-time physical risk, ambient SNR, and computational latency.',
  },
  {
    id: 5,
    section: 'SECTION 5 • PERCEPTION PIPELINE',
    badge: 'MULTIMODAL FUSION • FIG. 3',
    badgeColor: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/30',
    title: 'Multimodal Perception & Feature Fusion',
    subtitle: 'Cross-Attention Alignment Across Five Asynchronous Edge Sensor Encoders',
    image: fig3Img,
    imageCaption: 'Fig. 3. Multimodal perception and feature-fusion pipeline of ThunAI.',
    statCallout: {
      number: '120ms',
      label: 'Edge Feature Alignment Time',
      sub: 'Synchronized spatiotemporal context vector',
    },
    highlights: [
      {
        term: 'Spatial Vision Stream',
        detail: 'Edge detection calculating obstacle heading angle, distance (m), and closing velocity.',
        icon: Eye,
      },
      {
        term: 'Multilingual ASR Engine',
        detail: 'Phonetic dictionary alignment supporting 7 Indian languages with regional noise suppression.',
        icon: Volume2,
      },
      {
        term: '21-Point Kinematics',
        detail: 'Sign language skeleton tracking extracting angular velocity and palm trajectory in real time.',
        icon: Hand,
      },
      {
        term: 'Document & Signage OCR',
        detail: 'Multilingual script recognition for transit signs, Jan Aushadhi medicines, and RBI banknotes.',
        icon: FileText,
      },
    ],
    academicCitation: 'Section III-B: Sensory Feature Encoders & Cross-Attention Fusion',
    keyConclusion:
      'Fusing spatial vision, speech, kinematics, and OCR resolves sensory ambiguity that causes single-sensor tools to fail.',
    presenterScript:
      'Figure 3 shows our feature fusion pipeline. Five parallel encoders—camera, microphone, text, kinematic skeleton, and OCR—are projected into a unified spatiotemporal representation. This allows the system to cross-reference visual depth against acoustic warnings simultaneously.',
  },
  {
    id: 6,
    section: 'SECTION 6 • SAFETY & UNCERTAINTY',
    badge: 'SAFETY RIGOR • FIG. 4',
    badgeColor: 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-600/30',
    title: 'Risk-Aware Gating & Uncertainty Estimation',
    subtitle: 'Epistemic Uncertainty Check Preventing False Reassurance in High-Risk Zones',
    image: fig4Img,
    imageCaption: 'Fig. 4. Risk-aware and uncertainty-aware assistance decision process.',
    formula: 'R_{eff} = \\sigma( HazardScore / \\tau ) \\cdot ( 1 - Confidence_{epistemic} )',
    formulaNote: 'Emergency threshold: If R_{eff} > \\theta_{crit}, trigger immediate acoustic override.',
    statCallout: {
      number: '98.2%',
      label: 'Critical Hazard Recall Rate',
      sub: '0.4% False Reassurance Rate vs 8.4% in LLMs',
    },
    highlights: [
      {
        term: 'Epistemic Uncertainty Gating',
        detail: 'Low model confidence forces cautious verification rather than false positive clearance.',
        icon: AlertTriangle,
      },
      {
        term: 'Dual-Path Safety Architecture',
        detail: 'Path A: Ambient conversational guidance • Path B: Immediate sensory safety override.',
        icon: ShieldCheck,
      },
      {
        term: 'Acoustic Sonar Echolocation',
        detail: 'Generates directional 3D binaural audio pings with exponential frequency ramp within 2m.',
        icon: Volume2,
      },
      {
        term: 'National SOS Telemetry',
        detail: 'Direct GPS payload compilation for Emergency 112 / 108 dispatchers during critical distress.',
        icon: Zap,
      },
    ],
    academicCitation: 'Section IV-C: Safety Guardrails & Calibration Against Overconfidence',
    keyConclusion:
      'False reassurance in physical navigation is catastrophic; ThunAI mathematically guarantees cautious fail-safes.',
    presenterScript:
      'Figure 4 shows our safety architecture. When approaching hazards like platform edges or open excavations, our epistemic uncertainty gate activates. If risk exceeds the critical threshold, conversational dialogue is instantly preempted by 3D binaural acoustic sonar pings.',
  },
  {
    id: 7,
    section: 'SECTION 7 • ADAPTIVE INTERFACES',
    badge: 'PERSONALIZATION • FIG. 5',
    badgeColor: 'bg-cyan-600/10 text-cyan-700 dark:text-cyan-300 border-cyan-600/30',
    title: 'User-Profile-Aware Adaptive Modality Selection',
    subtitle: 'Single Environmental Trigger Mapped to Tailored Sensory Channels',
    image: fig5Img,
    imageCaption: 'Fig. 5. User-profile-aware adaptive modality selection in ThunAI.',
    statCallout: {
      number: '1-to-N',
      label: 'Adaptive Semantic Mapping',
      sub: 'Identical trigger → Distinct sensory modalities',
    },
    highlights: [
      {
        term: 'Physical Trigger: "Stairs Ahead (1.5m)"',
        detail: 'Evaluated across three distinct user impairment profiles:',
        icon: Eye,
      },
      {
        term: 'Visual Impairment User',
        detail: 'Output: Directional acoustic radar ping + Spoken warning in native language (Hindi/Tamil).',
        icon: Volume2,
      },
      {
        term: 'Hearing Impairment User',
        detail: 'Output: High-contrast HUD alert banner + Live subtitle caption + Tactile vibration sequence.',
        icon: Layers,
      },
      {
        term: 'Speech Impairment User',
        detail: 'Output: ISL kinematic prompt allowing 1-tap sign confirmation synthesized to clear speech.',
        icon: Hand,
      },
    ],
    academicCitation: 'Section V: Adaptive Assistive Interfaces & Sensory Substitution',
    keyConclusion:
      'True accessibility dynamically re-encodes environmental intelligence into the user’s intact sensory faculties.',
    presenterScript:
      'Figure 5 proves our personalization thesis. When an obstacle like descending stairs is detected, a visually impaired user receives an acoustic sonar pulse and spoken guidance; a deaf user receives high-contrast visual cues and haptics; a non-verbal user can confirm navigation using Indian Sign Language.',
  },
  {
    id: 8,
    section: 'SECTION 8 • REAL-WORLD CASE STUDY',
    badge: 'FIELD VALIDATION • FIG. 6',
    badgeColor: 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-600/30',
    title: 'In-Situ Field Validation: Indian Railways Terminal',
    subtitle: 'End-to-End Operational Trace Inside New Delhi Railway Concourse',
    image: fig6Img,
    imageCaption: 'Fig. 6. End-to-end operation of ThunAI in an Indian public-environment accessibility scenario.',
    statCallout: {
      number: '35m',
      label: 'Autonomous Navigation Corridor',
      sub: 'Concourse entrance to Platform 3 safely',
    },
    highlights: [
      {
        term: '1. Bilingual Signage OCR',
        detail: 'Decodes Devanagari script ("प्लेटफॉर्म 3") and English overhead boards under motion blur.',
        icon: FileText,
      },
      {
        term: '2. Dynamic Crowd Avoidance',
        detail: 'Continuously adjusts collision vectors to guide user smoothly around moving passenger congestion.',
        icon: Eye,
      },
      {
        term: '3. Platform Edge Detection',
        detail: 'Detects yellow tactile line; triggers acoustic sonar alarm 1.5m before track drop-off.',
        icon: AlertTriangle,
      },
      {
        term: '4. Localized Vernacular Voice',
        detail: '"प्लेटफॉर्म 3 सीधे 20 मीटर आगे है।" (Platform 3 is 20m ahead; proceed right).',
        icon: Volume2,
      },
    ],
    academicCitation: 'Section VI-A: Public Environment Case Study • New Delhi Railway Terminal',
    keyConclusion:
      'Validates end-to-end operational resilience across complex signage, chaotic crowd dynamics, and track safety.',
    presenterScript:
      'Figure 6 traces an in-situ test in New Delhi Railway Station. The user asks in Hindi for Platform 3. ThunAI reads bilingual boards, maneuvers around crowds and luggage carts, detects the platform edge drop-off, and delivers spoken vernacular guidance within 140ms.',
  },
  {
    id: 9,
    section: 'SECTION 9 • EXPERIMENTAL EVALUATION',
    badge: 'SCIENTIFIC RIGOR • FIG. 7',
    badgeColor: 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/30',
    title: 'Evaluation Methodology & Benchmark Suite',
    subtitle: 'Three-Tier Empirical Framework Benchmarking AI, Task Success, and Safety',
    image: fig7Img,
    imageCaption: 'Fig. 7. Experimental methodology and evaluation pipeline used to validate ThunAI.',
    statCallout: {
      number: '500+',
      label: 'Standardized Empirical Trials',
      sub: 'Evaluated against SOTA (AegisVM) & commercial tools',
    },
    highlights: [
      {
        term: 'Tier 1: AI Model Accuracy',
        detail: 'Object mAP (89.2%), End-to-End Latency (142ms edge), Multilingual WER (< 7.8%).',
        icon: Zap,
      },
      {
        term: 'Tier 2: Assistive Task Success',
        detail: 'Navigation completion rate: 94.8% • Banknote identification: 99.1% • Medicine parsing: 96.4%.',
        icon: CheckCircle2,
      },
      {
        term: 'Tier 3: Safety & Calibration',
        detail: 'Critical hazard recall: 98.2% • Expected Calibration Error: 0.038 (95% reduction in false safe rate).',
        icon: ShieldCheck,
      },
      {
        term: 'Human Workload (NASA-TLX)',
        detail: '43% reduction in cognitive workload compared to using separate uncoordinated accessibility apps.',
        icon: Brain,
      },
    ],
    academicCitation: 'Section VI: Quantitative Evaluation Protocol • Dual Cohort Evaluation',
    keyConclusion:
      'Proves statistical superiority over commercial baselines across accuracy, real-world task success, and safety calibration.',
    presenterScript:
      'Figure 7 outlines our rigorous three-tiered evaluation pipeline. We benchmarked AI accuracy, human task completion rates, and safety calibration across 500 trials. ThunAI achieved a 94.8% task success rate and reduced user cognitive load by 43%.',
  },
  {
    id: 10,
    section: 'SECTION 10 • ABLATION STUDY',
    badge: 'EMPIRICAL PROOF • FIG. 9',
    badgeColor: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/30',
    title: 'Ablation Study Graph: Component Contributions',
    subtitle: 'X: Full ThunAI, –Risk, –Context, –Personalization, –Adaptive Selection, –Multimodal • Y: Success & Safety (%)',
    image: fig9Img,
    imageCaption: 'Fig. 9. Systematic component ablation study of ThunAI architecture isolating Task Success (%) and Safety Calibration Score (%).',
    statCallout: {
      number: '-36.8%',
      label: 'Safety Score Drop Without Risk Engine',
      sub: 'Statistically significant reduction (p < 0.001)',
    },
    highlights: [
      {
        term: 'X-Axis: 6 Architectural Configurations',
        detail: 'Full ThunAI (94.8% Task, 98.2% Safety), –Risk (61.4% Safety), –Context (78.3%), –Personalization (69.1%), –Adaptive Selection (62.4%), –Multimodal (54.2%).',
        icon: Trophy,
      },
      {
        term: 'Ablation: – Risk Engine',
        detail: 'Safety plunges from 98.2% to 61.4% (36.8% collapse) with only 30ms latency saving. Proves safety cannot be left to an uncalibrated model.',
        icon: AlertTriangle,
      },
      {
        term: 'Ablation: – Personalization (Profile)',
        detail: 'Task success drops from 94.8% to 69.1% due to mismatched sensory feedback (e.g., visual alerts to visually impaired users).',
        icon: Layers,
      },
      {
        term: 'Ablation: – Multimodal (Vision-Only)',
        detail: 'Single-modal vision drops to 54.2% task success due to ambient acoustic blindness in bustling Indian transit hubs.',
        icon: Eye,
      },
    ],
    academicCitation: 'Table I: Ablation Study Across 500 Trials • All Reductions Statistically Significant (p < 0.001)',
    keyConclusion:
      'The Ablation Study Graph conclusively proves which components contribute to safety and task completion—every module is mathematically essential.',
    presenterScript:
      'Figure 9 presents our Ablation Study Graph. On the X-axis, we systematically strip each module: Risk, Context, Personalization, Adaptive Selection, and Multimodal. Notice the dramatic 36.8% crash in safety when the Risk Engine is removed, and the 25.7% drop when Personalization is stripped. This proves every module is indispensable.',
  },
  {
    id: 11,
    section: 'SECTION 11 • COMPARATIVE BENCHMARK',
    badge: 'COMPETITIVE BENCHMARK • FIG. 10',
    badgeColor: 'bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-600/30',
    title: 'Baseline vs. ThunAI Comparison Graph',
    subtitle: 'X: Baseline 1 (VLM), Baseline 2 (AegisVM), Baseline 3 (Seeing AI), Baseline 4 (NavCog), ThunAI • Y: Accuracy & Success (%)',
    image: fig10Img,
    imageCaption: 'Fig. 10. Performance benchmark: Baselines 1–4 vs. ThunAI across Intent Classification Accuracy and Assistive Task Success Rate.',
    statCallout: {
      number: '+15.0%',
      label: 'Task Success Gain Over Best Baseline',
      sub: '96.4% Intent Acc • Zero dedicated infrastructure',
    },
    highlights: [
      {
        term: 'X-Axis: 5 Compared Architectures',
        detail: 'Baseline 1: Zero-shot VLM • Baseline 2: AegisVM (Edge Vision) • Baseline 3: Seeing AI (Heuristic) • Baseline 4: NavCog (Beacons) • ThunAI (Ours).',
        icon: Scale,
      },
      {
        term: 'Intent Accuracy: 96.4% vs 58.3%–83.1%',
        detail: 'ThunAI achieves 96.4% intent accuracy, outperforming general VLMs (58.3%) and heuristic apps (79.2%) by resolving sensory ambiguity.',
        icon: CheckCircle2,
      },
      {
        term: 'Assistive Task Success: 94.8% vs 51.2%–79.8%',
        detail: 'ThunAI delivers a 94.8% end-to-end task completion rate across 500 trials (+15.0% over NavCog, +20.2% over Seeing AI).',
        icon: Award,
      },
      {
        term: 'Zero Infrastructure Advantage',
        detail: 'NavCog requires $10,000+ in BLE beacon hardware; ThunAI achieves superior navigation entirely zero-infrastructure on budget phones.',
        icon: ShieldCheck,
      },
    ],
    academicCitation: 'Section VI-B: Comparative Analysis with Existing Commercial & Academic Systems (p < 0.001)',
    keyConclusion:
      'The Baseline Comparison Graph proves ThunAI consistently performs better than simpler and state-of-the-art approaches across both accuracy and success.',
    presenterScript:
      'Figure 10 presents our Baseline Comparison Graph across 5 architectures. Simpler approaches like Zero-shot VLMs and heuristic apps plateau between 51% and 79% task success. ThunAI achieves 96.4% intent accuracy and 94.8% task success, beating the strongest baseline by 15% while requiring zero external beacon infrastructure.',
  },
  {
    id: 12,
    section: 'SECTION 12 • CONCLUSION & ROADMAP',
    badge: 'IMPACT & DEPLOYMENT',
    badgeColor: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/30',
    title: 'Societal Impact, Statutory Compliance & Future Work',
    subtitle: 'From Academic Rigor to Transforming 26.8 Million Indian Divyangjan Lives',
    statCallout: {
      number: '₹0',
      label: 'Open-Access Public Welfare Architecture',
      sub: 'Statutory compliance under RPwD Act 2016',
    },
    highlights: [
      {
        term: 'Transit Pilot Integration',
        detail: 'Evaluation partnerships with Indian Railways (IRCTC) and Delhi Metro (DMRC) for automated station wayfinding.',
        icon: Target,
      },
      {
        term: 'Jan Aushadhi Healthcare Rollout',
        detail: 'Automated generic medication dosage and verification across 10,000+ government Kendra pharmacies.',
        icon: CheckCircle2,
      },
      {
        term: 'Affordable Edge Wearable ($40)',
        detail: 'Porting AARE to ₹3,500 open-hardware frames with bone-conduction audio for hands-free mobility.',
        icon: Zap,
      },
      {
        term: 'Statutory Alignment',
        detail: 'Fulfilling Mandatory Rights of Persons with Disabilities (RPwD) Act 2016 Sections 40–46 for accessible IT.',
        icon: ShieldCheck,
      },
    ],
    academicCitation: 'Conclusion & Future Directions • Published Artifacts, Code, and Evaluation Datasets Open-Sourced',
    keyConclusion:
      'ThunAI demonstrates that situation-aware multimodal intelligence can restore safe, dignified physical autonomy to all.',
    presenterScript:
      'In conclusion, ThunAI is a verified, deployable research solution. We are establishing transit pilots with Indian Railways and medicine verification for Jan Aushadhi pharmacies, with open-hardware smart glasses under 3,500 rupees. Thank you, and we welcome your questions.',
  },
];

export const PresentationDeck: React.FC = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [showThumbnailDrawer, setShowThumbnailDrawer] = useState<boolean>(false);
  const [slideTheme, setSlideTheme] = useState<'paper' | 'dark'>('paper');
  const [chartViewMode, setChartViewMode] = useState<'interactive' | 'image'>('interactive');

  const currentSlide = RESEARCH_SLIDES[currentSlideIndex];

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev < RESEARCH_SLIDES.length - 1 ? prev + 1 : prev));
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowNotes((prev) => !prev);
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setSlideTheme((prev) => (prev === 'paper' ? 'dark' : 'paper'));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isFullscreen]);

  const handlePrint = () => {
    window.print();
  };

  const isPaper = slideTheme === 'paper';

  return (
    <div
      id="research-presentation-deck"
      className={`space-y-4 font-sans transition-colors ${
        isFullscreen
          ? `fixed inset-0 z-50 p-4 sm:p-6 overflow-y-auto ${
              isPaper ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
            }`
          : 'relative'
      }`}
    >
      {/* Deck Toolbar (Top Bar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-md print:hidden">
        {/* Left: Presentation Info & Quick Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                ThunAI Oral Presentation Deck
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-600/20">
                IEEE / ACM Research Grade
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-[10px]">
                ←
              </kbd>{' '}
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-[10px]">
                →
              </kbd>{' '}
              or Space to navigate •{' '}
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-[10px]">
                F
              </kbd>{' '}
              Fullscreen •{' '}
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-[10px]">
                P
              </kbd>{' '}
              Presenter Script •{' '}
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-[10px]">
                T
              </kbd>{' '}
              Theme
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-2">
          {/* Slide Navigator Indicator */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            <span className="text-blue-600 dark:text-blue-400 font-black">
              {String(currentSlideIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-slate-400 dark:text-slate-600 mx-1">/</span>
            <span>{String(RESEARCH_SLIDES.length).padStart(2, '0')}</span>
          </div>

          {/* Previous Slide Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-white font-bold cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
            title="Previous Slide (ArrowLeft)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Next Slide Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={currentSlideIndex === RESEARCH_SLIDES.length - 1}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold cursor-pointer transition-colors shadow-sm"
            title="Next Slide (ArrowRight / Space)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Academic Paper vs Dark Theme Switcher */}
          <button
            type="button"
            onClick={() => setSlideTheme(isPaper ? 'dark' : 'paper')}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
            title="Toggle Academic Paper vs Dark Room Theme (T)"
          >
            {isPaper ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Paper White</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Dark Hall</span>
              </>
            )}
          </button>

          {/* Thumbnail Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowThumbnailDrawer(!showThumbnailDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showThumbnailDrawer
                ? 'bg-blue-600/15 border-blue-500 text-blue-600 dark:text-blue-300 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Index</span>
          </button>

          {/* Presenter Speech Notes Toggle */}
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showNotes
                ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Toggle 30-Second Presenter Script (P)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Pitch Script</span>
          </button>

          {/* Print / Save Deck as PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
            title="Print / Save Slide Deck as PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Slideshow (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Slide Index Drawer (When Toggled) */}
      {showThumbnailDrawer && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl print:hidden animate-fadeIn shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Slide Outline (12 Slides)
            </span>
            <span className="text-[11px] text-slate-400">Click any slide to jump</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
            {RESEARCH_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  setShowThumbnailDrawer(false);
                }}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  idx === currentSlideIndex
                    ? 'bg-blue-600/10 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                  <span className={idx === currentSlideIndex ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
                    #{String(s.id).padStart(2, '0')}
                  </span>
                  <span className="truncate max-w-[80px] text-[9px] text-slate-500 dark:text-slate-400">
                    {s.badge.split('•')[0]}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{s.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN RESEARCH SLIDE CANVAS */}
      <div
        className={`rounded-3xl p-6 sm:p-10 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between border ${
          isPaper
            ? 'bg-white border-slate-200/80 text-slate-900 shadow-slate-200/60'
            : 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl'
        } ${isFullscreen ? 'min-h-[88vh]' : 'min-h-[660px]'}`}
      >
        {/* Top Header: Section + Badges + Title */}
        <div className="space-y-2 relative z-10 border-b pb-4 border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400">
                {currentSlide.section}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${currentSlide.badgeColor}`}
              >
                {currentSlide.badge}
              </span>
            </div>

            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
              SLIDE {String(currentSlide.id).padStart(2, '0')} OF {String(RESEARCH_SLIDES.length).padStart(2, '0')}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
            {currentSlide.title}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 max-w-4xl">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Slide Body: Two-Column Scientific Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-center relative z-10 flex-1">
          {/* Left Column: Publication Figure, Interactive Chart, or Stat Callout */}
          {currentSlide.id === 10 ? (
            <div className="lg:col-span-6 space-y-2 flex flex-col items-center w-full">
              <div className="w-full flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Fig. 9 • Component Ablation Study
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setChartViewMode('interactive')}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      chartViewMode === 'interactive'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-white'
                    }`}
                  >
                    📊 Interactive Graph
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('image')}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      chartViewMode === 'image'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-white'
                    }`}
                  >
                    🖼️ Paper Figure (JPEG)
                  </button>
                </div>
              </div>

              {chartViewMode === 'interactive' ? (
                <InteractiveAblationChart isPaper={isPaper} />
              ) : (
                <div
                  className={`w-full rounded-2xl p-3 border flex flex-col items-center justify-center overflow-hidden transition-all ${
                    isPaper
                      ? 'bg-white border-slate-200 shadow-sm'
                      : 'bg-white border-slate-300 shadow-lg'
                  }`}
                >
                  <img
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    className="max-h-[350px] sm:max-h-[380px] w-auto max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <p className="text-[11px] font-serif italic text-slate-500 dark:text-slate-400 text-center">
                {currentSlide.imageCaption}
              </p>
            </div>
          ) : currentSlide.id === 11 ? (
            <div className="lg:col-span-6 space-y-2 flex flex-col items-center w-full">
              <div className="w-full flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Fig. 10 • Baseline vs ThunAI Benchmark
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setChartViewMode('interactive')}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      chartViewMode === 'interactive'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-white'
                    }`}
                  >
                    📊 Interactive Graph
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('image')}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      chartViewMode === 'image'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-white'
                    }`}
                  >
                    🖼️ Paper Figure (JPEG)
                  </button>
                </div>
              </div>

              {chartViewMode === 'interactive' ? (
                <InteractiveBaselineChart isPaper={isPaper} />
              ) : (
                <div
                  className={`w-full rounded-2xl p-3 border flex flex-col items-center justify-center overflow-hidden transition-all ${
                    isPaper
                      ? 'bg-white border-slate-200 shadow-sm'
                      : 'bg-white border-slate-300 shadow-lg'
                  }`}
                >
                  <img
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    className="max-h-[350px] sm:max-h-[380px] w-auto max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <p className="text-[11px] font-serif italic text-slate-500 dark:text-slate-400 text-center">
                {currentSlide.imageCaption}
              </p>
            </div>
          ) : currentSlide.image ? (
            <div className="lg:col-span-6 space-y-2 flex flex-col items-center">
              <div
                className={`w-full rounded-2xl p-3 border flex flex-col items-center justify-center overflow-hidden transition-all ${
                  isPaper
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-white border-slate-300 shadow-lg'
                }`}
              >
                <img
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="max-h-[350px] sm:max-h-[380px] w-auto max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              {currentSlide.imageCaption && (
                <p className="text-[11px] font-serif italic text-slate-500 dark:text-slate-400 text-center">
                  {currentSlide.imageCaption}
                </p>
              )}
            </div>
          ) : (
            /* Stat & Research Focus Box for Non-Image Slides */
            <div className="lg:col-span-5 space-y-4">
              <div
                className={`p-8 rounded-3xl border space-y-4 ${
                  isPaper
                    ? 'bg-slate-50 border-slate-200 shadow-inner'
                    : 'bg-slate-950 border-slate-800 shadow-xl'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                    {currentSlide.statCallout?.number || '1st'}
                  </span>
                  <p className="text-base font-bold mt-1 text-slate-900 dark:text-white">
                    {currentSlide.statCallout?.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentSlide.statCallout?.sub}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Key Research Points (Crisp, High Signal-to-Noise) */}
          <div className={currentSlide.image ? 'lg:col-span-6 space-y-3' : 'lg:col-span-7 space-y-3'}>
            {/* Metric Callout Header if Image Present */}
            {currentSlide.statCallout && currentSlide.image && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isPaper
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {currentSlide.statCallout.number}
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentSlide.statCallout.label}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono text-right max-w-[200px]">
                  {currentSlide.statCallout.sub}
                </span>
              </div>
            )}

            {/* Formal Mathematical Formula Box (When Applicable) */}
            {currentSlide.formula && (
              <div
                className={`p-3.5 rounded-xl border font-mono space-y-1 ${
                  isPaper
                    ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                    : 'bg-blue-950/30 border-blue-800/60 text-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Mathematical Formulation
                  </span>
                  <Hash className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <p className="text-sm font-black tracking-wide">{currentSlide.formula}</p>
                {currentSlide.formulaNote && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    {currentSlide.formulaNote}
                  </p>
                )}
              </div>
            )}

            {/* Bullet Highlights: Strictly Important Phrasing */}
            <div className="space-y-2">
              {currentSlide.highlights.map((pt, pIdx) => {
                const IconComponent = pt.icon || CheckCircle2;
                return (
                  <div
                    key={pIdx}
                    className={`p-2.5 sm:p-3 rounded-xl border flex items-start gap-3 transition-all ${
                      isPaper
                        ? 'bg-white border-slate-200/80 hover:border-blue-400 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {pt.term}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {pt.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Slide Bottom Bar: Formal Scientific Conclusion & Citation */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-600/20">
                Core Finding
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 italic">
                "{currentSlide.keyConclusion}"
              </p>
            </div>
            {currentSlide.academicCitation && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {currentSlide.academicCitation}
              </p>
            )}
          </div>

          {/* Quick Navigation Action */}
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentSlideIndex === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-30 cursor-pointer border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentSlideIndex === RESEARCH_SLIDES.length - 1}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-30 cursor-pointer shadow-sm transition-colors"
            >
              Next Slide →
            </button>
          </div>
        </div>
      </div>

      {/* PRESENTER SCRIPT DRAWER (Under 30 Seconds Speaking Script for Juries) */}
      {showNotes && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl print:hidden animate-fadeIn space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> 30-Second Presenter Script (Slide {currentSlide.id})
              </h3>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
              Designed for clear oral delivery
            </span>
          </div>

          <p className="text-sm font-serif leading-relaxed text-slate-800 dark:text-amber-100/90 bg-white/70 dark:bg-slate-950/80 p-4 rounded-xl border border-amber-500/20 italic">
            "{currentSlide.presenterScript}"
          </p>
        </div>
      )}

      {/* PRINT-ONLY CSS RULES (Formats cleanly for landscape PDF export) */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, aside, header, .print\\:hidden {
            display: none !important;
          }
          #research-presentation-deck {
            margin: 0 !important;
            padding: 0 !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
};

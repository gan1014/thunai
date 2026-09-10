/**
 * THUNAI Voice Interaction Context
 * 
 * Provides end-to-end voice-first, speech-to-speech interaction loop:
 * Hands-free STT → Intent normalization → Auto-camera activation →
 * Continuous visual perception → Spatial exit & obstacle fusion → Priority TTS.
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { centralResponseManager, AssistantState } from '../services/centralResponseManager';
import { emergencyManager } from '../services/emergencyManager';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useCamera } from '../hooks/useCamera';
import { useProfile } from './ProfileContext';
import { api } from '../api/client';
import { DetectedObject, LanguageCode, NavigationPathData } from '../types';

interface VoiceInteractionContextType {
  state: AssistantState;
  isListening: boolean;
  isCameraActive: boolean;
  currentTranscript: string;
  interimTranscript: string;
  lastResponseText: string;
  liveDetections: DetectedObject[];
  activeNavigationPath: NavigationPathData | null;
  startVoiceLoop: () => void;
  stopVoiceLoop: () => void;
  openCameraByVoice: () => Promise<void>;
  closeCameraByVoice: () => void;
  processVoiceQuery: (text: string) => Promise<void>;
  interruptSpeech: () => void;
  setActiveNavigationPath: (path: NavigationPathData | null) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const VoiceInteractionContext = createContext<VoiceInteractionContextType | null>(null);

export const VoiceInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useProfile();
  const [state, setState] = useState<AssistantState>('IDLE');
  const [lastResponseText, setLastResponseText] = useState<string>('');
  const [liveDetections, setLiveDetections] = useState<DetectedObject[]>([]);
  const [activeNavigationPath, setActiveNavigationPath] = useState<NavigationPathData | null>(null);
  const [lastTargetLandmark, setLastTargetLandmark] = useState<string>('exit');

  const {
    videoRef,
    canvasRef,
    isActive: isCameraActive,
    startCamera,
    stopCamera,
    captureFrame,
    error: cameraError,
  } = useCamera();

  const isProcessingRef = useRef(false);
  const lastProcessedTextRef = useRef('');
  const lastProcessedTimeRef = useRef(0);

  // Subscribe to central response state machine
  useEffect(() => {
    const unsub = centralResponseManager.subscribe((newState, text) => {
      setState(newState);
      if (text) setLastResponseText(text);
    });
    return unsub;
  }, []);

  // Voice Camera Control
  const openCameraByVoice = useCallback(async () => {
    centralResponseManager.setState('CAMERA_STARTING');
    const lang = profile.preferred_language || 'en';
    try {
      await startCamera();
      const msg =
        lang === 'ta'
          ? 'கேமரா தயாராக உள்ளது.'
          : lang === 'te'
          ? 'కెమెరా సిద్ధంగా ఉంది.'
          : lang === 'hi'
          ? 'कैमरा तैयार है।'
          : 'Camera is ready.';
      centralResponseManager.speak(msg, 'NORMAL_GUIDANCE', lang);
    } catch (err: any) {
      const errMsg =
        lang === 'ta'
          ? 'கேமராவை இயக்க முடியவில்லை. தயவுசெய்து அமைப்புகளில் அனுமதி அளியுங்கள்.'
          : lang === 'te'
          ? 'కెమెరాను ఆన్ చేయడం సాధ్యపడలేదు. దయచేసి కెమెరా అనుమతిని ఇవ్వండి.'
          : lang === 'hi'
          ? 'कैमरा शुरू नहीं किया जा सका। कृपया कैमरा अनुमति दें।'
          : 'I cannot access the camera. Please allow camera access in your browser settings.';
      centralResponseManager.speak(errMsg, 'USER_DIRECT_QUESTION', lang);
      centralResponseManager.setState('ERROR');
    }
  }, [startCamera, profile]);

  const closeCameraByVoice = useCallback(() => {
    stopCamera();
    setLiveDetections([]);
    const lang = profile.preferred_language || 'en';
    const msg =
      lang === 'ta'
        ? 'கேமரா நிறுத்தப்பட்டது.'
        : lang === 'te'
        ? 'కెమెరా ఆపబడింది.'
        : lang === 'hi'
        ? 'कैमरा बंद कर दिया गया।'
        : 'Camera closed.';
    centralResponseManager.speak(msg, 'NORMAL_GUIDANCE', lang);
  }, [stopCamera, profile]);

  // Handle Voice Command
  const processVoiceQuery = useCallback(
    async (rawText: string) => {
      if (!rawText || !rawText.trim()) return;
      const text = rawText.trim();

      // Debounce identical queries within 1.5s
      const now = Date.now();
      if (text.toLowerCase() === lastProcessedTextRef.current.toLowerCase() && now - lastProcessedTimeRef.current < 1500) {
        return;
      }
      lastProcessedTextRef.current = text;
      lastProcessedTimeRef.current = now;

      // 1. Check for immediate Barge-In / Stop commands
      const lower = text.toLowerCase();
      if (/^(stop|be quiet|stop talking|stop speaking|cancel|hush|silence|பேசாதே|நிறுத்து|మాట్లాడకు|ఆపు|chup)$/i.test(lower)) {
        centralResponseManager.interrupt();
        return;
      }

      // 2. Classify Voice Intent
      centralResponseManager.setState('PROCESSING_COMMAND');
      let intentData: any = null;
      try {
        const res = await api.classifyVoiceIntent(text, lastTargetLandmark);
        intentData = res;
      } catch (e) {
        // Local fallback intent classification
        const isCameraOpen = /\b(open|start|turn on)\s+(the\s+)?camera\b/i.test(lower);
        const isCameraClose = /\b(close|stop|turn off)\s+(the\s+)?camera\b/i.test(lower);
        const isExit = /\b(exit|door|way out|வெளியேறும்|బయటికి|నिकास)\b/i.test(lower);
        intentData = {
          intent: isCameraOpen ? 'CAMERA_OPEN' : isCameraClose ? 'CAMERA_CLOSE' : isExit ? 'FIND_EXIT' : 'CHECK_OBSTACLES',
          requiresCamera: isExit || isCameraOpen,
          targetObject: isExit ? 'exit' : undefined,
          language: profile.preferred_language || 'en',
        };
      }

      const lang: LanguageCode = intentData.language || profile.preferred_language || 'en';

      // 3. Dispatch based on intent
      if (intentData.intent === 'CAMERA_OPEN') {
        await openCameraByVoice();
        return;
      }

      if (intentData.intent === 'CAMERA_CLOSE') {
        closeCameraByVoice();
        return;
      }

      if (intentData.intent === 'STOP_SPEECH') {
        centralResponseManager.interrupt();
        return;
      }

      if (intentData.intent === 'REPEAT') {
        const last = centralResponseManager.getLastSpokenText();
        if (last) {
          centralResponseManager.speak(last, 'USER_DIRECT_QUESTION', lang);
        } else {
          const nothingMsg =
            lang === 'ta'
              ? 'மீண்டும் சொல்ல எதுவும் இல்லை.'
              : lang === 'te'
              ? 'పునరావృతం చేయడానికి ఏమీ లేదు.'
              : lang === 'hi'
              ? 'दोहराने के लिए कुछ नहीं है।'
              : 'Nothing to repeat yet.';
          centralResponseManager.speak(nothingMsg, 'USER_DIRECT_QUESTION', lang);
        }
        return;
      }

      if (intentData.intent === 'CONFIRM_CANCEL_SOS' || (emergencyManager.getSnapshot().isConfirmingCancel && /confirm|safe|yes|ஆம்|అవును|हाँ/i.test(lower))) {
        await emergencyManager.confirmCancel();
        return;
      }

      if (intentData.intent === 'CANCEL_SOS') {
        emergencyManager.requestCancel();
        return;
      }

      if (intentData.intent === 'EMERGENCY') {
        await emergencyManager.triggerSOS('VOICE_COMMAND');
        return;
      }

      if (intentData.intent === 'GREETING') {
        const greetMsg =
          lang === 'ta'
            ? 'வணக்கம்! நான் துணை. உங்களுக்கு நான் எவ்வாறு உதவ முடியும்?'
            : lang === 'te'
            ? 'నమస్కారం! నేను తుణై. మీకు నేను ఎలా సహాయపడగలను?'
            : lang === 'hi'
            ? 'नमस्ते! मैं थुनै हूँ। मैं आपकी क्या मदद कर सकता हूँ?'
            : 'Hello! I am THUNAI. How can I guide you today?';
        centralResponseManager.speak(greetMsg, 'USER_DIRECT_QUESTION', lang);
        return;
      }

      // 4. Visual Analysis Queries (Exit, Obstacles, Direction, Surroundings, Distance)
      if (intentData.requiresCamera || intentData.isVisualCommand) {
        centralResponseManager.setState('ANALYZING');

        // Auto-start camera if currently inactive
        let frame: string | null = null;
        if (!isCameraActive) {
          try {
            await startCamera();
            // Allow 350ms for video frame buffer
            await new Promise((r) => setTimeout(r, 350));
          } catch (err) {
            const errMsg =
              lang === 'ta'
                ? 'கேமராவை அணுக முடியவில்லை. அனுமதியை சரிபார்க்கவும்.'
                : lang === 'te'
                ? 'కెమెరాను తెరవలేకపోయాము. దయచేసి అనుమతిని తనిఖీ చేయండి.'
                : lang === 'hi'
                ? 'कैमरा शुरू नहीं किया जा सका। कृपया अनुमति जांचें।'
                : 'I cannot access the camera. Please allow camera access in your browser settings.';
            centralResponseManager.speak(errMsg, 'USER_DIRECT_QUESTION', lang);
            return;
          }
        }

        frame = captureFrame();

        // Send to Exit & Obstacle Spatial Reasoning Pipeline
        try {
          const analysis = await api.analyzeExitAndObstacles({
            image_base64: frame || undefined,
            query_type: intentData.intent,
            language: lang,
            target_landmark: intentData.targetObject || lastTargetLandmark,
          });

          if (analysis.navigationPath) {
            setActiveNavigationPath(analysis.navigationPath);
          }

          if (analysis.exitObject?.label) {
            setLastTargetLandmark(analysis.exitObject.label);
          }

          if (analysis.detected_objects) {
            setLiveDetections(analysis.detected_objects);
          }

          // Speak synthesized spatial fusion response
          centralResponseManager.speak(
            analysis.spokenResponse,
            analysis.pathStatus === 'OBSTRUCTED' ? 'CRITICAL_OBSTACLE' : 'USER_DIRECT_QUESTION',
            lang
          );
        } catch (err) {
          console.error('Exit & obstacle analysis error:', err);
          const fallback =
            lang === 'ta'
              ? 'காட்சித் தரவை பகுப்பாய்வு செய்வதில் சிக்கல். தயவுசெய்து மீண்டும் கேட்கவும்.'
              : lang === 'te'
              ? 'దృశ్య విశ్లేషణలో లోపం ఏర్పడింది. దయచేసి మళ్లీ అడగండి.'
              : lang === 'hi'
              ? 'दृश्य विश्लेषण में समस्या आई। कृपया पुनः पूछें।'
              : 'I could not analyze the current view. Please ask again.';
          centralResponseManager.speak(fallback, 'USER_DIRECT_QUESTION', lang);
        }
        return;
      }

      // 5. General conversation fallback
      try {
        const res = await api.voiceChat({
          text,
          language: lang,
          sessionId: 'voice_session',
        });
        centralResponseManager.speak(res.text, 'USER_DIRECT_QUESTION', lang);
      } catch (e) {
        const listeningMsg =
          lang === 'ta'
            ? 'நான் கேட்டுக்கொண்டிருக்கிறேன். உங்கள் சுற்றுப்புறம் அல்லது வெளியேறும் வழி குறித்து கேளுங்கள்.'
            : lang === 'te'
            ? 'నేను వింటున్నాను. మీ పరిసరాలు లేదా బయటికి వెళ్లే మార్గం గురించి అడగండి.'
            : lang === 'hi'
            ? 'मैं सुन रहा हूँ। अपने आसपास या निकास के बारे में पूछें।'
            : 'I am listening. Ask about your surroundings or exits.';
        centralResponseManager.speak(listeningMsg, 'USER_DIRECT_QUESTION', lang);
      }
    },
    [isCameraActive, startCamera, stopCamera, captureFrame, openCameraByVoice, closeCameraByVoice, profile, lastTargetLandmark]
  );

  // Speech Recognition hook
  const sttLang =
    profile.preferred_language === 'ta'
      ? 'ta-IN'
      : profile.preferred_language === 'te'
      ? 'te-IN'
      : profile.preferred_language === 'hi'
      ? 'hi-IN'
      : 'en-IN';

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    language: sttLang,
    continuous: true,
    interimResults: true,
    onResult: (t, isFinal) => {
      // Barge-in check on any speech during TTS
      if (centralResponseManager.getState() === 'RESPONDING') {
        const lower = t.toLowerCase();
        if (lower.includes('stop') || lower.includes('quiet') || lower.includes('cancel') || lower.includes('போதும்') || lower.includes('చాలు') || lower.includes('ruko')) {
          centralResponseManager.interrupt();
          return;
        }
      }

      if (isFinal && t.trim()) {
        processVoiceQuery(t);
      }
    },
    onError: (err) => {
      console.warn('Voice STT warning:', err);
    },
  });

  // Start voice loop on mount
  useEffect(() => {
    startListening();
    centralResponseManager.setState('LISTENING');
    return () => {
      stopListening();
    };
  }, [startListening, stopListening]);

  return (
    <VoiceInteractionContext.Provider
      value={{
        state,
        isListening,
        isCameraActive,
        currentTranscript: transcript,
        interimTranscript,
        lastResponseText,
        liveDetections,
        activeNavigationPath,
        startVoiceLoop: startListening,
        stopVoiceLoop: stopListening,
        openCameraByVoice,
        closeCameraByVoice,
        processVoiceQuery,
        interruptSpeech: () => centralResponseManager.interrupt(),
        setActiveNavigationPath,
        videoRef,
        canvasRef,
      }}
    >
      {children}
    </VoiceInteractionContext.Provider>
  );
};

export const useVoiceInteraction = () => {
  const ctx = useContext(VoiceInteractionContext);
  if (!ctx) {
    throw new Error('useVoiceInteraction must be used within a VoiceInteractionProvider');
  }
  return ctx;
};

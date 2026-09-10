import { useState, useCallback, useRef, useEffect } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { useCamera } from './useCamera';
import { api } from '../api/client';
import {
  VoiceMessage,
  VoiceConversationState,
  VoiceProvider,
  VoiceProviderStatus,
  DetectedObject,
  LanguageCode,
} from '../types';

interface UseVoiceConversationOptions {
  autoSpeak?: boolean;
  continuousListening?: boolean;
  language?: string;
}

interface UseVoiceConversationReturn {
  state: VoiceConversationState;
  messages: VoiceMessage[];
  providerStatus: VoiceProviderStatus | null;
  startListening: () => void;
  stopListening: () => void;
  sendText: (text: string) => Promise<void>;
  clearMessages: () => void;
  isSupported: boolean;
}

let messageCounter = 0;

export function useVoiceConversation(
  options: UseVoiceConversationOptions = {}
): UseVoiceConversationReturn {
  const { autoSpeak = true, continuousListening = true, language = 'en-IN' } = options;

  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeProvider, setActiveProvider] = useState<VoiceProvider>('gemini');
  const [providerStatus, setProviderStatus] = useState<VoiceProviderStatus | null>(null);
  const [error, setError] = useState<string | undefined>();

  const sessionIdRef = useRef(`voice_${Date.now()}`);
  const isSpeakingRef = useRef(false);
  const lastCameraObjectsRef = useRef<DetectedObject[]>([]);

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening: startSTT,
    stopListening: stopSTT,
    isSupported: sttSupported,
  } = useSpeechRecognition({ language });

  const { speak, stop: stopSpeak, isSpeaking } = useSpeechSynthesis();
  const { captureFrame } = useCamera();

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    api.getVoiceStatus().then(setProviderStatus).catch(() => {});
  }, []);

  const captureEnvironmentalContext = useCallback(async () => {
    try {
      const frame = captureFrame();
      if (!frame) return undefined;

      const visionResult = await api.describeScene(frame);
      lastCameraObjectsRef.current = visionResult.objects || [];

      return {
        objects: (visionResult.objects || []).map((o) => ({
          label: o.label,
          distance: o.distance_meters,
          direction: o.spatial?.direction || 'CENTER',
          movement: o.spatial?.movement,
          proximity: o.spatial?.proximity,
        })),
        spatialRelations: visionResult.spatial_relations?.relations || [],
      };
    } catch {
      return undefined;
    }
  }, [captureFrame]);

  const processUserInput = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;

      const userMessage: VoiceMessage = {
        id: `msg_${++messageCounter}`,
        role: 'user',
        text: userText.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);
      setError(undefined);

      try {
        const environmental = await captureEnvironmentalContext();

        const response = await api.voiceChat({
          text: userText.trim(),
          language: language.split('-')[0],
          sessionId: sessionIdRef.current,
          environmental,
        });

        const assistantMessage: VoiceMessage = {
          id: `msg_${++messageCounter}`,
          role: 'assistant',
          text: response.text,
          provider: response.provider,
          model: response.model,
          latencyMs: response.latencyMs,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setActiveProvider(response.provider);

        if (autoSpeak && response.text) {
          const lang = detectLanguage(response.text);
          speak(response.text, lang);
        }
      } catch (err: any) {
        const errorMsg = 'Sorry, something went wrong. Please try again.';
        setError(errorMsg);

        const errorMessage: VoiceMessage = {
          id: `msg_${++messageCounter}`,
          role: 'assistant',
          text: errorMsg,
          provider: 'local',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [autoSpeak, language, speak, captureEnvironmentalContext]
  );

  useEffect(() => {
    if (transcript && !isProcessing && !isSpeakingRef.current) {
      processUserInput(transcript);
    }
  }, [transcript, isProcessing, processUserInput]);

  const startListening = useCallback(() => {
    stopSpeak();
    startSTT();
  }, [stopSpeak, startSTT]);

  const stopListening = useCallback(() => {
    stopSTT();
  }, [stopSTT]);

  const sendText = useCallback(
    async (text: string) => {
      stopSpeak();
      await processUserInput(text);
    },
    [processUserInput, stopSpeak]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(undefined);
  }, []);

  return {
    state: {
      messages,
      isListening,
      isProcessing,
      isSpeaking,
      activeProvider,
      error,
    },
    messages,
    providerStatus,
    startListening,
    stopListening,
    sendText,
    clearMessages,
    isSupported: sttSupported,
  };
}

function detectLanguage(text: string): LanguageCode {
  const tamilPattern = /[\u0B80-\u0BFF]/;
  const hindiPattern = /[\u0900-\u097F]/;

  if (tamilPattern.test(text)) return 'ta';
  if (hindiPattern.test(text)) return 'hi';
  return 'en';
}

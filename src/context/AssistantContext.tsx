import React, { createContext, useContext, useEffect, useState } from 'react';
import { AssistantResponse, MultimodalInput, SessionMetrics, LanguageCode } from '../types';
import { api } from '../api/client';
import { useProfile } from './ProfileContext';
import { playAlertSound } from '../utils/helpers';
import { sonarEngine } from '../utils/sonarEngine';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { emergencyManager } from '../services/emergencyManager';

interface AssistantContextType {
  responses: AssistantResponse[];
  latestResponse: AssistantResponse | null;
  isProcessing: boolean;
  sessionId: number;
  metrics: SessionMetrics | null;
  conversationHistory: Array<{ role: string; content: string; timestamp: number }>;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  sonarActive: boolean;
  toggleSonar: () => void;
  isEmergencyOpen: boolean;
  openEmergency: () => void;
  closeEmergency: () => void;
  isShortcutsOpen: boolean;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  wsConnected: boolean;
  speak: (text: string, language?: LanguageCode) => void;
  stopSpeak: () => void;
  isSpeaking: boolean;
  sendStreamFrame: (data: Partial<MultimodalInput>) => void;
  sendMultimodal: (data: Partial<MultimodalInput>) => Promise<AssistantResponse>;
  startNewSession: () => Promise<number>;
  endCurrentSession: () => Promise<void>;
  clearConversation: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
}

const AssistantContext = createContext<AssistantContextType | null>(null);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useProfile();
  const { speak, stop: stopSpeak, isSpeaking } = useSpeechSynthesis();
  const [responses, setResponses] = useState<AssistantResponse[]>([]);
  const [latestResponse, setLatestResponse] = useState<AssistantResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState(101);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: string; content: string; timestamp: number }>
  >([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sonarActive, setSonarActive] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = React.useRef<WebSocket | null>(null);

  // Maintain real-time WebSocket connection to backend
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connect = () => {
      try {
        if (typeof window === 'undefined') return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:4000';
        const wsUrl = `${protocol}//${host}/ws/assistant`;
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'response' && msg.data) {
              setLatestResponse(msg.data);
              if (msg.data.detected_objects) {
                sonarEngine.updateObjects(msg.data.detected_objects);
              }
            }
          } catch (e) {}
        };

        socket.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          setWsConnected(false);
        };
      } catch (e) {
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);

  const sendStreamFrame = (data: Partial<MultimodalInput>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          profile_id: profile.id,
          session_id: sessionId,
          ...data,
        })
      );
    }
  };

  const toggleSonar = () => {
    if (sonarActive) {
      sonarEngine.stop();
      setSonarActive(false);
    } else {
      sonarEngine.start();
      setSonarActive(true);
    }
  };

  const openEmergency = () => {
    if (!emergencyManager.isEmergencyActive()) {
      emergencyManager.triggerSOS('MANUAL_BUTTON');
    }
    setIsEmergencyOpen(true);
  };
  const closeEmergency = () => {
    if (emergencyManager.isEmergencyActive()) {
      emergencyManager.requestCancel();
    }
    setIsEmergencyOpen(false);
  };
  const openShortcuts = () => setIsShortcutsOpen(true);
  const closeShortcuts = () => setIsShortcutsOpen(false);

  // Auto-open modal whenever SOS is triggered
  useEffect(() => {
    const unsub = emergencyManager.subscribe((snap) => {
      if (
        snap.state === 'SOS_TRIGGERED' ||
        snap.state === 'COUNTDOWN_ACTIVE' ||
        snap.state === 'CANCELLATION_WINDOW' ||
        snap.state === 'ESCALATION_PENDING' ||
        snap.state === 'ESCALATING' ||
        snap.state === 'NOTIFICATION_SENT' ||
        snap.state === 'DELIVERY_FAILED'
      ) {
        setIsEmergencyOpen(true);
      }
    });
    return unsub;
  }, []);

  // Sync objects with sonar engine
  useEffect(() => {
    if (latestResponse?.detected_objects) {
      sonarEngine.updateObjects(latestResponse.detected_objects);
    }
  }, [latestResponse]);

  const startNewSession = async (): Promise<number> => {
    try {
      const res = await api.startSession(profile.id);
      setSessionId(res.session_id);
      setResponses([]);
      setLatestResponse(null);
      await refreshMetrics();
      return res.session_id;
    } catch (err) {
      console.warn('Failed to start session on backend, using local ID:', err);
      const newId = Date.now();
      setSessionId(newId);
      return newId;
    }
  };

  const endCurrentSession = async () => {
    try {
      const res = await api.endSession(sessionId);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.warn('Failed to end session on backend:', err);
    }
  };

  const refreshMetrics = async () => {
    try {
      const m = await api.getSessionMetrics(sessionId);
      setMetrics(m);
    } catch (err) {
      console.warn('Could not fetch metrics:', err);
    }
  };

  const clearConversation = async () => {
    try {
      await api.clearHistory();
    } catch (err) {
      console.warn('Could not clear backend history:', err);
    }
    setResponses([]);
    setLatestResponse(null);
    setConversationHistory([]);
  };

  useEffect(() => {
    refreshMetrics();
  }, [sessionId]);

  const sendMultimodal = async (data: Partial<MultimodalInput>): Promise<AssistantResponse> => {
    setIsProcessing(true);
    const input: MultimodalInput = {
      profile_id: profile.id,
      session_id: sessionId,
      ...data,
    };

    try {
      const response = await api.processMultimodal(input);

      // Sound notification based on risk
      if (soundEnabled) {
        if (response.risk.risk_level === 'critical') {
          playAlertSound('critical');
        } else if (response.risk.risk_level === 'high') {
          playAlertSound('warning');
        } else {
          playAlertSound('chime');
        }

        // Real-time voice speech output
        const speechText = response.voice_text || response.text;
        if (speechText) {
          speak(speechText, response.language || profile.preferred_language || 'en');
        }
      }

      setLatestResponse(response);
      setResponses((prev) => [...prev, response]);

      // Update conversation history
      const userText = data.text_input || (data.audio_base64 ? 'Voice message' : data.image_base64 ? 'Camera capture' : 'Sensory query');
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: userText, timestamp: Date.now() },
        { role: 'assistant', content: response.text, timestamp: Date.now() },
      ]);

      // Refresh metrics in background
      refreshMetrics();

      return response;
    } catch (err: any) {
      console.error('Error in sendMultimodal:', err);
      // Construct fallback safety response
      const fallbackResponse: AssistantResponse = {
        text: 'Sensory pipeline warning: connection re-establishing. Proceed carefully.',
        voice_text: 'Connection re-establishing. Proceed with caution.',
        visual_text: 'PROCEED CAREFULLY',
        language: profile.preferred_language,
        modality: profile.preferred_output,
        urgency: 'normal',
        safety_warnings: ['Reconnecting to sensory telemetry'],
        display_config: {
          text_size: profile.text_size,
          high_contrast: profile.high_contrast,
          auto_read: false,
        },
        reasoning_trace: ['Sensory frame handled via client safety contingency'],
        aas_score: 72,
        timestamp: Date.now(),
        detected_objects: [],
        intent: {
          primary_intent: 'safety',
          confidence: 0.8,
          secondary_intents: [],
          reasoning: 'Fallback contingency activated',
        },
        risk: {
          risk_level: 'medium',
          risk_score: 0.4,
          risk_factors: ['Network delay noted'],
          confidence_concern: true,
          recommended_caution: 'Verify footsteps manually',
        },
        latency_ms: 150,
      };
      if (soundEnabled) {
        speak(fallbackResponse.voice_text, profile.preferred_language || 'en');
      }
      setLatestResponse(fallbackResponse);
      setResponses((prev) => [...prev, fallbackResponse]);
      return fallbackResponse;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AssistantContext.Provider
      value={{
        responses,
        latestResponse,
        isProcessing,
        sessionId,
        metrics,
        conversationHistory,
        soundEnabled,
        setSoundEnabled,
        sonarActive,
        toggleSonar,
        isEmergencyOpen,
        openEmergency,
        closeEmergency,
        isShortcutsOpen,
        openShortcuts,
        closeShortcuts,
        wsConnected,
        speak,
        stopSpeak,
        isSpeaking,
        sendStreamFrame,
        sendMultimodal,
        startNewSession,
        endCurrentSession,
        clearConversation,
        refreshMetrics,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = (): AssistantContextType => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};

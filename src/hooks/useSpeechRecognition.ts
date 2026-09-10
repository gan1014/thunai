import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({
  language = 'en-IN',
  continuous = true,
  interimResults = true,
  onResult,
  onError,
}: SpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
  }, []);

  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = languageRef.current || 'en-IN';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            currentFinal += text + ' ';
          } else {
            currentInterim += text;
          }
        }

        if (currentFinal) {
          setTranscript((prev) => {
            const updated = (prev + ' ' + currentFinal).trim();
            if (onResult) onResult(updated, true);
            return updated;
          });
          setInterimTranscript('');
        } else if (currentInterim) {
          setInterimTranscript(currentInterim);
          if (onResult) onResult(currentInterim, false);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // No speech detected, keep listening if continuous
          return;
        }
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access in browser settings.');
          shouldListenRef.current = false;
          setIsListening(false);
          if (onError) onError('Microphone permission denied');
          return;
        }
        setError(event.error);
        if (onError) onError(event.error);
      };

      recognition.onend = () => {
        // Auto-restart if continuous mode was desired
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Wait brief moment and retry
            setTimeout(() => {
              if (shouldListenRef.current) {
                try {
                  recognition.start();
                } catch (err) {
                  setIsListening(false);
                }
              }
            }, 300);
          }
        } else {
          setIsListening(false);
        }
      };

      return recognition;
    } catch (err: any) {
      console.error('Failed to create SpeechRecognition instance:', err);
      return null;
    }
  }, [continuous, interimResults, onResult, onError]);

  const startListening = useCallback(() => {
    setError(null);
    shouldListenRef.current = true;

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = languageRef.current || 'en-IN';
        recognitionRef.current.start();
      } catch (e: any) {
        // Recognition might already be started
        console.log('Recognition already active or starting:', e);
      }
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Update language dynamically if changed
  useEffect(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.lang = language;
        // Stop and restart with new language
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
  }, [language, isListening]);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}

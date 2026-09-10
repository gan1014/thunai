import { useCallback, useEffect, useState } from 'react';
import { LanguageCode } from '../types';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (v.length > 0 && !selectedVoice) {
        // Pick an English or default voice
        const enVoice = v.find((voice) => voice.lang.startsWith('en')) || v[0];
        setSelectedVoice(enVoice);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string, language: LanguageCode = 'en') => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Map language code to BCP 47
      let langCode = 'en-IN';
      if (language === 'hi') langCode = 'hi-IN';
      else if (language === 'ta') langCode = 'ta-IN';
      else if (language === 'te') langCode = 'te-IN';
      else if (language === 'bn') langCode = 'bn-IN';
      else if (language === 'mr') langCode = 'mr-IN';
      else if (language === 'kn') langCode = 'kn-IN';
      else if (language === 'en') langCode = 'en-IN';

      utterance.lang = langCode;

      // Try finding best matching voice for the target language
      const matchVoice = voices.find((v) => v.lang.startsWith(langCode.split('-')[0])) || selectedVoice;
      if (matchVoice) {
        utterance.voice = matchVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [voices, selectedVoice]
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
}

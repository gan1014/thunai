import { useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { useAssistant } from '../context/AssistantContext';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { TextSize } from '../types';

export function useAccessibilityShortcuts() {
  const { profile, updateProfile } = useProfile();
  const {
    toggleSonar,
    openEmergency,
    closeEmergency,
    isEmergencyOpen,
    openShortcuts,
    closeShortcuts,
    isShortcutsOpen,
  } = useAssistant();
  const { stop: stopSpeech } = useSpeechSynthesis();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Emergency Silence on Escape
      if (e.key === 'Escape') {
        stopSpeech();
        if (isEmergencyOpen) closeEmergency();
        if (isShortcutsOpen) closeShortcuts();
        return;
      }

      // Check for Alt key combinations
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 's': // Toggle Sonar
            e.preventDefault();
            toggleSonar();
            break;
          case 'e': // Emergency SOS
            e.preventDefault();
            openEmergency();
            break;
          case 'h': // Toggle High Contrast
            e.preventDefault();
            updateProfile({ high_contrast: !profile.high_contrast });
            break;
          case 't': // Cycle Text Size
            e.preventDefault();
            const order: TextSize[] = ['small', 'medium', 'large', 'xlarge'];
            const nextIdx = (order.indexOf(profile.text_size) + 1) % order.length;
            updateProfile({ text_size: order[nextIdx] });
            break;
          case 'k': // Shortcuts guide
            e.preventDefault();
            openShortcuts();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    profile,
    updateProfile,
    toggleSonar,
    openEmergency,
    closeEmergency,
    isEmergencyOpen,
    openShortcuts,
    closeShortcuts,
    isShortcutsOpen,
    stopSpeech,
  ]);
}

import { useCallback } from 'react';
import { TextToSpeechService } from '../services/textToSpeechService';

export interface DialoguesTrackingOptions {
  onDialoguesListened: () => void;
  languageCode?: string;
}

export const useDialoguesTracking = ({
  onDialoguesListened,
  languageCode = 'es-ES'
}: DialoguesTrackingOptions) => {
  
  const playAudio = useCallback(async (text: string) => {
    try {
      console.log('🔊 Playing audio for:', text);
      const success = await TextToSpeechService.speakText(text, languageCode);
      
      if (success) {
        console.log('🎧 Dialogues listened!');
        onDialoguesListened();
      } else {
        console.warn('⚠️ Audio playback failed, but continuing...');
      }
    } catch (error) {
      console.error('❌ Error playing audio:', error);
    }
  }, [onDialoguesListened, languageCode]);

  return { playAudio };
};



















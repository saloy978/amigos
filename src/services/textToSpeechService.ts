import { getApiKey, isServiceEnabled } from '../config/apiKeys';

interface TTSRequest {
  text: string;
  languageCode: string;
  voiceName?: string;
  ssmlGender?: 'MALE' | 'FEMALE';
}

interface TTSResponse {
  audioContent: string;
  success: boolean;
  error?: string;
}

export class TextToSpeechService {
  private static baseUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';

  /**
   * Проверка доступных голосов на устройстве
   */
  static checkAvailableVoices(): void {
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      console.log('🔊 Available voices on device:');
      voices.forEach(voice => {
        console.log(`  - ${voice.name} (${voice.lang}) - ${voice.gender || 'unknown gender'}`);
      });
      
      const spanishVoices = voices.filter(voice => voice.lang.startsWith('es'));
      console.log('🇪🇸 Spanish voices:', spanishVoices.map(v => `${v.name} (${v.lang})`));
    } else {
      console.log('❌ Speech Synthesis not supported');
    }
  }

  /**
   * Простой тест Web Speech API
   */
  static testWebSpeechAPI(): boolean {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Hola');
        utterance.lang = 'es-ES';
        utterance.rate = 0.7;
        utterance.volume = 0.8;
        
        window.speechSynthesis.speak(utterance);
        console.log('🔊 Web Speech API test: SUCCESS');
        return true;
      } else {
        console.log('❌ Web Speech API not supported');
        return false;
      }
    } catch (error) {
      console.error('❌ Web Speech API test failed:', error);
      return false;
    }
  }

  /**
   * Тестовая функция для проверки API
   */
  static async testAPI(): Promise<boolean> {
    try {
      console.log('🧪 Testing Google TTS API...');
      
      if (!isServiceEnabled('GOOGLE_TTS')) {
        console.error('❌ Google TTS service is not enabled');
        return false;
      }

      const apiKey = getApiKey('GOOGLE_TTS_API_KEY');
      console.log('🔑 API Key:', apiKey ? 'Present' : 'Missing');
      if (!apiKey) {
        console.error('❌ Google TTS API key is not configured');
        return false;
      }

      const testRequest = {
        input: { text: 'Hola' },
        voice: {
          languageCode: 'es-ES',
          name: 'es-ES-Standard-A',
          ssmlGender: 'FEMALE' as const
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: 0.8,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      };

      console.log('📤 Test request:', testRequest);

      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest)
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        return false;
      }

      const data = await response.json();
      console.log('✅ API Test successful:', data);
      return true;

    } catch (error) {
      console.error('❌ API Test failed:', error);
      return false;
    }
  }

  /**
   * Преобразует текст в речь с помощью Google Text-to-Speech API
   */
  static async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      console.log('🔊 Google TTS: Starting speech synthesis...');
      console.log('Request:', request);

      if (!isServiceEnabled('GOOGLE_TTS')) {
        throw new Error('Google Text-to-Speech service is not enabled');
      }

      const apiKey = getApiKey('GOOGLE_TTS_API_KEY');
      console.log('🔑 API Key:', apiKey ? 'Present' : 'Missing');
      if (!apiKey) {
        throw new Error('Google Text-to-Speech API key is not configured');
      }

      // Определяем голос по умолчанию в зависимости от языка
      const defaultVoice = this.getDefaultVoice(request.languageCode);
      const voiceName = request.voiceName || defaultVoice.name;
      const ssmlGender = request.ssmlGender || defaultVoice.gender;

      const requestUrl = `${this.baseUrl}?key=${apiKey}`;
      console.log('🌐 Request URL:', requestUrl);
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: request.text },
          voice: {
            languageCode: request.languageCode,
            name: voiceName,
            ssmlGender: ssmlGender
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: request.languageCode === 'es-ES' ? 0.8 : 0.9, // Медленнее для испанского
            pitch: request.languageCode === 'es-ES' ? 0.0 : 0.0, // Нормальная высота тона
            volumeGainDb: 0.0
          }
        })
      });

      console.log('📡 Response status:', response.status, response.statusText);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(`Google TTS API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ Google TTS: Speech synthesis completed');
      
      return {
        audioContent: data.audioContent,
        success: true
      };

    } catch (error) {
      console.error('❌ Google TTS: Speech synthesis failed:', error);
      
      return {
        audioContent: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Воспроизводит аудио из base64 строки
   */
  static playAudio(base64Audio: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        
        // Настройки для мобильных устройств
        audio.preload = 'auto';
        audio.volume = 1.0;
        
        audio.onended = () => {
          console.log('🔊 Audio playback completed');
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error('❌ Audio playback failed:', error);
          reject(error);
        };
        
        // На мобильных устройствах может потребоваться загрузка
        audio.oncanplaythrough = () => {
          console.log('🔊 Audio ready to play');
        };
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('🔊 Audio started playing');
          }).catch((error) => {
            console.error('❌ Audio play failed:', error);
            reject(error);
          });
        }
      } catch (error) {
        console.error('❌ Audio creation failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Преобразует текст в речь и сразу воспроизводит (Google TTS + Web Speech API fallback)
   */
  static async speakText(text: string, languageCode: string): Promise<boolean> {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');
    
    try {
      const result = await this.synthesizeSpeech({ text, languageCode });
      
      if (result.success && result.audioContent) {
        await this.playAudio(result.audioContent);
        return true;
      } else {
        console.error('❌ Google TTS failed, trying Web Speech API:', result.error);
        // На мобильных устройствах все равно пробуем Web Speech API
        return this.speakWithWebSpeechAPI(text, languageCode);
      }
    } catch (error) {
      console.error('❌ Google TTS error, trying Web Speech API:', error);
      // На мобильных устройствах все равно пробуем Web Speech API
      return this.speakWithWebSpeechAPI(text, languageCode);
    }
  }

  /**
   * Fallback метод с использованием Web Speech API
   */
  private static speakWithWebSpeechAPI(text: string, languageCode: string): boolean {
    try {
      if ('speechSynthesis' in window) {
        // Остановить предыдущее воспроизведение
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Найти подходящий испанский голос
        const voices = window.speechSynthesis.getVoices();
        console.log('🔊 Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
        
        // Ищем испанский голос с приоритетом
        let spanishVoice = voices.find(voice => 
          voice.lang === 'es-ES' || voice.lang === 'es'
        );
        
        // Если не найден точный, ищем любой испанский
        if (!spanishVoice) {
          spanishVoice = voices.find(voice => 
            voice.lang.startsWith('es') && 
            (voice.name.includes('Spanish') || voice.name.includes('Español') || voice.name.includes('es-'))
          );
        }
        
        if (spanishVoice) {
          utterance.voice = spanishVoice;
          console.log('🔊 Using Spanish voice:', spanishVoice.name, spanishVoice.lang);
        } else {
          // Если испанский голос не найден, принудительно устанавливаем язык
          utterance.lang = 'es-ES';
          console.log('🔊 Spanish voice not found, using language code:', utterance.lang);
        }
        
        utterance.rate = 0.7; // Медленнее для лучшего понимания
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Обработчики событий для диагностики
        utterance.onstart = () => {
          console.log('🔊 Web Speech API: Speech started');
        };
        
        utterance.onend = () => {
          console.log('🔊 Web Speech API: Speech ended');
        };
        
        utterance.onerror = (event) => {
          console.error('❌ Web Speech API error:', event.error);
        };
        
        window.speechSynthesis.speak(utterance);
        console.log('🔊 Using Web Speech API fallback');
        return true;
      } else {
        console.error('❌ Web Speech API not supported');
        return false;
      }
    } catch (error) {
      console.error('❌ Web Speech API error:', error);
      return false;
    }
  }


  /**
   * Получает голос по умолчанию для языка
   */
  private static getDefaultVoice(languageCode: string): { name: string; gender: 'MALE' | 'FEMALE' } {
      const voices: Record<string, { name: string; gender: 'MALE' | 'FEMALE' }> = {
      'es-ES': { name: 'es-ES-Standard-A', gender: 'FEMALE' }, // Испанский (Испания) - женский голос
      'es-US': { name: 'es-US-Standard-A', gender: 'FEMALE' }, // Испанский (США) - женский голос
      'ru-RU': { name: 'ru-RU-Standard-A', gender: 'FEMALE' },
      'en-US': { name: 'en-US-Standard-A', gender: 'FEMALE' },
      'en-GB': { name: 'en-GB-Standard-A', gender: 'FEMALE' },
      'fr-FR': { name: 'fr-FR-Standard-A', gender: 'FEMALE' },
      'de-DE': { name: 'de-DE-Standard-A', gender: 'FEMALE' },
      'it-IT': { name: 'it-IT-Standard-A', gender: 'FEMALE' },
      'pt-BR': { name: 'pt-BR-Standard-A', gender: 'FEMALE' },
      'ja-JP': { name: 'ja-JP-Standard-A', gender: 'FEMALE' },
      'ko-KR': { name: 'ko-KR-Standard-A', gender: 'FEMALE' },
      'zh-CN': { name: 'zh-CN-Standard-A', gender: 'FEMALE' }
    };

    return voices[languageCode] || { name: 'en-US-Standard-A', gender: 'FEMALE' };
  }

  /**
   * Определяет код языка на основе направления обучения
   * ВСЕГДА произносим только изучаемый язык (испанский)
   */
  static getLanguageCode(isKnownToLearning: boolean, learningLanguageCode: string = 'es'): string {
    // Всегда произносим изучаемый язык, независимо от направления
    switch (learningLanguageCode.toLowerCase()) {
      case 'es':
        return 'es-ES';
      case 'en':
        return 'en-US';
      case 'fr':
        return 'fr-FR';
      case 'de':
        return 'de-DE';
      case 'it':
        return 'it-IT';
      case 'pt':
        return 'pt-BR';
      case 'ja':
        return 'ja-JP';
      case 'ko':
        return 'ko-KR';
      case 'zh':
        return 'zh-CN';
      default:
        return 'es-ES'; // По умолчанию испанский
    }
  }
}

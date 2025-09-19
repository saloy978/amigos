import { getApiKey, isServiceEnabled } from '../config/apiKeys';

interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslationResponse {
  translatedText: string;
  success: boolean;
  error?: string;
}

export class GoogleTranslateService {
  private static baseUrl = 'https://translation.googleapis.com/language/translate/v2';

  /**
   * Переводит текст с одного языка на другой
   */
  static async translate(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      console.log('🌍 Google Translate: Starting translation...');
      console.log('Request:', request);

      if (!isServiceEnabled('GOOGLE_TRANSLATE')) {
        throw new Error('Google Translate service is not enabled');
      }

      const apiKey = getApiKey('GOOGLE_TRANSLATE_API_KEY');
      if (!apiKey) {
        throw new Error('Google Translate API key is not configured');
      }

      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: request.text,
          source: request.sourceLanguage,
          target: request.targetLanguage,
          format: 'text'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Translate API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data?.translations?.[0]?.translatedText) {
        const translatedText = data.data.translations[0].translatedText;
        console.log('✅ Google Translate: Translation successful');
        console.log(`"${request.text}" → "${translatedText}"`);
        
        return {
          translatedText,
          success: true
        };
      } else {
        throw new Error('Invalid response format from Google Translate API');
      }

    } catch (error) {
      console.error('❌ Google Translate: Translation failed:', error);
      return {
        translatedText: '',
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed'
      };
    }
  }

  /**
   * Переводит слово на английский язык
   */
  static async translateToEnglish(word: string, sourceLanguage: string): Promise<TranslationResponse> {
    return this.translate({
      text: word,
      sourceLanguage: sourceLanguage,
      targetLanguage: 'en'
    });
  }

  /**
   * Переводит слово с английского на целевой язык
   */
  static async translateFromEnglish(word: string, targetLanguage: string): Promise<TranslationResponse> {
    return this.translate({
      text: word,
      sourceLanguage: 'en',
      targetLanguage: targetLanguage
    });
  }

  /**
   * Получает информацию о сервисе
   */
  static getServiceInfo(): {name: string, description: string, free: boolean} {
    return {
      name: 'Google Translate',
      description: 'Автоматический перевод слов с помощью Google Translate API',
      free: false // Google Translate API платный
    };
  }

  /**
   * Проверяет доступность сервиса
   */
  static isAvailable(): boolean {
    return isServiceEnabled('GOOGLE_TRANSLATE') && !!getApiKey('GOOGLE_TRANSLATE_API_KEY');
  }

  /**
   * Получает инструкции по настройке
   */
  static getSetupInstructions(): string {
    return `
Для использования автоматического перевода необходимо настроить Google Translate API:

1. Перейдите в Google Cloud Console: https://console.cloud.google.com/
2. Создайте новый проект или выберите существующий
3. Включите Google Translate API:
   - Перейдите в "APIs & Services" > "Library"
   - Найдите "Cloud Translation API"
   - Нажмите "Enable"
4. Создайте API ключ:
   - Перейдите в "APIs & Services" > "Credentials"
   - Нажмите "Create Credentials" > "API Key"
   - Скопируйте созданный ключ
5. Замените YOUR_GOOGLE_TRANSLATE_API_KEY в src/config/apiKeys.ts
6. Установите enabled: true для GOOGLE_TRANSLATE в SERVICE_STATUS

Примечание: Google Translate API платный, но первые 500,000 символов в месяц бесплатны.
    `;
  }
}









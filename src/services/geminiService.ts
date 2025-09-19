interface GeminiRequest {
  userLevel: string;
  languagePair: {
    learning: string;
    known: string;
  };
  topic?: string;
  count: number;
  existingWords: string[];
}

interface GeminiResponse {
  words: Array<{
    term: string;
    translation: string;
    english: string;
    example: string;
    difficulty: string;
  }>;
  success: boolean;
  error?: string;
}

import { getApiKey, isServiceEnabled } from '../config/apiKeys';

export class GeminiService {
  private static baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  /**
   * Получает API ключ из конфигурации
   */
  private static getApiKey(): string | null {
    return getApiKey('GEMINI_API_KEY');
  }

  /**
   * Проверяет доступность сервиса
   */
  static isAvailable(): boolean {
    return isServiceEnabled('GEMINI') && !!this.getApiKey();
  }

  /**
   * Генерирует слова через Google Gemini API
   */
  static async generateWords(request: GeminiRequest): Promise<GeminiResponse> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      return {
        words: [],
        success: false,
        error: 'Google Gemini API key is not configured'
      };
    }

    try {
      console.log('🤖 Gemini: Starting word generation...');
      
      const prompt = this.buildPrompt(request);
      console.log('📝 Gemini: Generated prompt:', prompt);

      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Gemini API error:', errorData);
        throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('📥 Gemini: Raw response:', data);

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('No content in response');
      }

      const words = this.parseResponse(content);
      console.log('📚 Gemini: Parsed words:', words);

      return {
        words,
        success: true
      };

    } catch (error) {
      console.error('❌ Gemini generation error:', error);
      return {
        words: [],
        success: false,
        error: error.message || 'Ошибка генерации через Google Gemini'
      };
    }
  }

  /**
   * Строит промпт для Gemini
   */
  private static buildPrompt(request: GeminiRequest): string {
    const { userLevel, languagePair, topic, count, existingWords } = request;
    
    let prompt = `Сгенерируй ${count} слов для изучения языка на трех языках.\n\n`;
    prompt += `Языковая пара: ${languagePair.learning} → ${languagePair.known} → English\n`;
    prompt += `Уровень: ${userLevel}\n\n`;
    
    if (topic) {
      prompt += `Тема: ${topic}\n\n`;
    }
    
    if (existingWords.length > 0) {
      prompt += `Исключи эти слова: ${existingWords.join(', ')}\n\n`;
    }
    
    prompt += `Требования:\n`;
    prompt += `- Слова должны соответствовать уровню ${userLevel}\n`;
    prompt += `- Каждое слово должно быть на трех языках: ${languagePair.learning} → ${languagePair.known} → English\n`;
    prompt += `- Добавь пример использования на ${languagePair.learning}\n`;
    prompt += `- Укажи сложность (A1, A2, B1, B2, C1, C2)\n`;
    prompt += `- Английское слово будет использоваться для генерации изображений\n\n`;
    
    if (topic) {
      prompt += `Фокус на теме: ${topic}\n\n`;
    }
    
    prompt += `Ответ в формате JSON:\n`;
    prompt += `[\n`;
    prompt += `  {\n`;
    prompt += `    "term": "слово на ${languagePair.learning}",\n`;
    prompt += `    "translation": "перевод на ${languagePair.known}",\n`;
    prompt += `    "english": "перевод на английский",\n`;
    prompt += `    "example": "пример использования на ${languagePair.learning}",\n`;
    prompt += `    "difficulty": "уровень сложности"\n`;
    prompt += `  }\n`;
    prompt += `]\n\n`;
    prompt += `Только JSON, без дополнительного текста.`;

    return prompt;
  }

  /**
   * Парсит ответ от Gemini
   */
  private static parseResponse(content: string): Array<{
    term: string;
    translation: string;
    english: string;
    example: string;
    difficulty: string;
  }> {
    try {
      // Очищаем контент от возможных markdown блоков
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/, '').replace(/```\n?$/, '');
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/, '').replace(/```\n?$/, '');
      }

      const parsed = JSON.parse(cleanContent);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed.map(item => ({
        term: item.term || '',
        translation: item.translation || '',
        english: item.english || '',
        example: item.example || '',
        difficulty: item.difficulty || 'A1'
      }));

    } catch (error) {
      console.error('❌ Gemini parse error:', error);
      console.error('Raw content:', content);
      throw new Error(`Failed to parse Gemini response: ${error.message}`);
    }
  }

  /**
   * Получает информацию о сервисе
   */
  static getServiceInfo(): {name: string, description: string, free: boolean} {
    return {
      name: 'Google Gemini',
      description: 'Google Gemini AI для генерации слов',
      free: true
    };
  }
}



























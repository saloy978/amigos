interface ChatGPTRequest {
  userLevel: string;
  languagePair: {
    learning: string;
    known: string;
  };
  topic?: string;
  count: number;
  existingWords: string[];
}

interface ChatGPTResponse {
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

export class ChatGPTService {
  private static baseUrl = 'https://api.openai.com/v1/chat/completions';

  /**
   * Получает API ключ из конфигурации
   */
  private static getApiKey(): string | null {
    return getApiKey('OPENAI_API_KEY');
  }

  /**
   * Получает статус API ключа
   */
  static getApiStatus(): { configured: boolean; hasKey: boolean } {
    const hasKey = !!this.getApiKey();
    const isEnabled = isServiceEnabled('OPENAI');
    
    return {
      configured: hasKey && isEnabled,
      hasKey: hasKey
    };
  }

  /**
   * Генерирует слова через ChatGPT API
   */
  static async generateWords(request: ChatGPTRequest): Promise<ChatGPTResponse> {
    console.log('🤖 ChatGPTService: Starting generation with request:', request);

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('⚠️ ChatGPT API key not configured');
      return {
        words: [],
        success: false,
        error: 'API ключ не настроен'
      };
    }

    try {
      const prompt = this.buildPrompt(request);
      console.log('📝 Generated prompt:', prompt);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Ты помощник для изучения языков. Генерируй слова в формате JSON с полями: term, translation, example, difficulty.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ ChatGPT API error:', errorData);
        throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ ChatGPT API response:', data);

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from ChatGPT');
      }

      const words = this.parseResponse(content);
      console.log('📚 Parsed words:', words);

      return {
        words,
        success: true
      };

    } catch (error) {
      console.error('❌ ChatGPT generation error:', error);
      return {
        words: [],
        success: false,
        error: error.message || 'Ошибка генерации через ChatGPT'
      };
    }
  }

  /**
   * Строит промпт для ChatGPT
   */
  private static buildPrompt(request: ChatGPTRequest): string {
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
   * Парсит ответ от ChatGPT
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
      console.error('❌ Error parsing ChatGPT response:', error);
      console.error('Raw content:', content);
      
      // Попробуем извлечь JSON из текста
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed.map(item => ({
            term: item.term || '',
            translation: item.translation || '',
            example: item.example || '',
            difficulty: item.difficulty || 'A1'
          }));
        } catch (e) {
          console.error('❌ Failed to parse extracted JSON:', e);
        }
      }
      
      throw new Error('Не удалось распарсить ответ от ChatGPT');
    }
  }

  /**
   * Тестирует подключение к ChatGPT API
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: 'API ключ не настроен'
      };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Hello, test message'
            }
          ],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'API Error'
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Connection error'
      };
    }
  }
}

interface FreeAIRequest {
  userLevel: string;
  languagePair: {
    learning: string;
    known: string;
  };
  topic?: string;
  count: number;
  existingWords: string[];
}

interface FreeAIResponse {
  words: Array<{
    term: string;
    translation: string;
    english: string;
    example: string;
    difficulty: string;
  }>;
  success: boolean;
  error?: string;
  service: string;
}

export enum FreeAIServiceEnum {
  GEMINI = 'gemini',
  HUGGING_FACE = 'huggingface',
  COHERE = 'cohere'
}

import { getApiKey, isServiceEnabled, getServicePriority, getFirstAvailableService } from '../config/apiKeys';

export class FreeAIService {
  /**
   * Получает API ключ для сервиса из конфигурации
   */
  private static getApiKey(service: FreeAIServiceEnum): string | null {
    const keyMap = {
      [FreeAIServiceEnum.GEMINI]: 'GEMINI_API_KEY',
      [FreeAIServiceEnum.HUGGING_FACE]: 'HUGGING_FACE_API_KEY',
      [FreeAIServiceEnum.COHERE]: 'COHERE_API_KEY'
    };
    
    return getApiKey(keyMap[service] as any);
  }

  /**
   * Получает статус всех сервисов
   */
  static getServicesStatus(): Record<FreeAIServiceEnum, { configured: boolean; hasKey: boolean }> {
    return {
      [FreeAIServiceEnum.GEMINI]: {
        configured: !!this.getApiKey(FreeAIServiceEnum.GEMINI) && isServiceEnabled('GEMINI'),
        hasKey: !!this.getApiKey(FreeAIServiceEnum.GEMINI)
      },
      [FreeAIServiceEnum.HUGGING_FACE]: {
        configured: !!this.getApiKey(FreeAIServiceEnum.HUGGING_FACE) && isServiceEnabled('HUGGING_FACE'),
        hasKey: !!this.getApiKey(FreeAIServiceEnum.HUGGING_FACE)
      },
      [FreeAIServiceEnum.COHERE]: {
        configured: !!this.getApiKey(FreeAIServiceEnum.COHERE) && isServiceEnabled('COHERE'),
        hasKey: !!this.getApiKey(FreeAIServiceEnum.COHERE)
      },
    };
  }

  /**
   * Получает информацию о сервисах
   */
  static getServicesInfo(): Record<FreeAIServiceEnum, { name: string; description: string; free: boolean; url: string }> {
    return {
      [FreeAIServiceEnum.GEMINI]: {
        name: 'Google Gemini',
        description: 'Google Gemini AI для генерации слов',
        free: true,
        url: 'https://aistudio.google.com/app/apikey'
      },
      [FreeAIServiceEnum.HUGGING_FACE]: {
        name: 'Hugging Face',
        description: 'Бесплатные открытые модели ИИ',
        free: true,
        url: 'https://huggingface.co/inference-api'
      },
      [FreeAIServiceEnum.COHERE]: {
        name: 'Cohere',
        description: 'Бесплатный тариф до 1000 запросов/месяц',
        free: true,
        url: 'https://cohere.ai'
      },
    };
  }

  /**
   * Генерирует слова через выбранный бесплатный AI сервис
   */
  static async generateWords(request: FreeAIRequest): Promise<FreeAIResponse> {
    console.log('🤖 FreeAIService: Starting generation with request:', request);

    // Находим первый доступный сервис
    const availableService = this.findAvailableService();
    if (!availableService) {
      return {
        words: [],
        success: false,
        error: 'Нет настроенных бесплатных AI сервисов',
        service: 'none'
      };
    }

    try {
      switch (availableService) {
        case FreeAIServiceEnum.GEMINI:
          return await this.generateWithGemini(request);
        case FreeAIServiceEnum.HUGGING_FACE:
          return await this.generateWithHuggingFace(request);
        case FreeAIServiceEnum.COHERE:
          return await this.generateWithCohere(request);
        default:
          throw new Error('Unsupported service');
      }
    } catch (error) {
      console.error('❌ FreeAI generation error:', error);
      return {
        words: [],
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка генерации через бесплатный AI',
        service: availableService
      };
    }
  }

  /**
   * Находит первый доступный сервис
   */
  private static findAvailableService(): FreeAIServiceEnum | null {
    const priority = getServicePriority();
    console.log('🔍 FreeAIService: Service priority order:', priority);
    
    for (const serviceKey of priority) {
      if (serviceKey === 'OPENAI') continue; // Пропускаем ChatGPT, он обрабатывается отдельно
      
      const service = this.mapServiceKeyToEnum(serviceKey);
      if (service) {
        const status = this.getServicesStatus()[service];
        console.log(`🔍 FreeAIService: Checking ${serviceKey} (${service}):`, status);
        
        if (status.configured) {
          console.log(`✅ FreeAIService: Selected ${serviceKey} (${service}) as primary service`);
          return service;
        }
      }
    }
    
    console.log('❌ FreeAIService: No available services found');
    return null;
  }

  /**
   * Маппинг ключей сервисов в enum
   */
  private static mapServiceKeyToEnum(serviceKey: string): FreeAIServiceEnum | null {
    const mapping = {
      'GEMINI': FreeAIServiceEnum.GEMINI,
      'HUGGING_FACE': FreeAIServiceEnum.HUGGING_FACE,
      'COHERE': FreeAIServiceEnum.COHERE
    };
    
    return mapping[serviceKey as keyof typeof mapping] || null;
  }

  /**
   * Генерация через Google Gemini
   */
  private static async generateWithGemini(request: FreeAIRequest): Promise<FreeAIResponse> {
    console.log('🤖 FreeAIService: Starting Gemini generation...');
    const apiKey = this.getApiKey(FreeAIServiceEnum.GEMINI);
    const prompt = this.buildPrompt(request);
    
    console.log('🤖 FreeAIService: Gemini API key available:', !!apiKey);
    console.log('🤖 FreeAIService: Gemini prompt length:', prompt.length);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
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
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const words = this.parseGeminiResponse(data, request);
      
      console.log(`✅ FreeAIService: Gemini generated ${words.length} words successfully`);
      
      return {
        words,
        success: true,
        service: FreeAIServiceEnum.GEMINI
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Gemini error: ${errorMessage}`);
    }
  }

  /**
   * Генерация через Hugging Face (бесплатно)
   */
  private static async generateWithHuggingFace(request: FreeAIRequest): Promise<FreeAIResponse> {
    const apiKey = this.getApiKey(FreeAIServiceEnum.HUGGING_FACE);
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 500,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.statusText}`);
      }

      const data = await response.json();
      const words = this.parseHuggingFaceResponse(data, request);
      
      return {
        words,
        success: true,
        service: FreeAIServiceEnum.HUGGING_FACE
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Hugging Face error: ${errorMessage}`);
    }
  }

  /**
   * Генерация через Cohere (бесплатно до 1000 запросов/месяц)
   */
  private static async generateWithCohere(request: FreeAIRequest): Promise<FreeAIResponse> {
    const apiKey = this.getApiKey(FreeAIServiceEnum.COHERE);
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'command-light',
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.statusText}`);
      }

      const data = await response.json();
      const words = this.parseCohereResponse(data, request);
      
      return {
        words,
        success: true,
        service: FreeAIServiceEnum.COHERE
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Cohere error: ${errorMessage}`);
    }
  }



  /**
   * Строит промпт для генерации
   */
  private static buildPrompt(request: FreeAIRequest): string {
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
   * Парсит ответ от Hugging Face
   */
  private static parseHuggingFaceResponse(data: any, request: FreeAIRequest): Array<{
    term: string;
    translation: string;
    english: string;
    example: string;
    difficulty: string;
  }> {
    // Hugging Face возвращает текст, нужно его парсить
    const text = data[0]?.generated_text || '';
    return this.parseTextResponse(text, request);
  }

  /**
   * Парсит ответ от Gemini
   */
  private static parseGeminiResponse(data: any, request: FreeAIRequest): Array<{
    term: string;
    translation: string;
    english: string;
    example: string;
    difficulty: string;
  }> {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return this.parseTextResponse(text, request);
  }

  /**
   * Парсит ответ от Cohere
   */
  private static parseCohereResponse(data: any, request: FreeAIRequest): Array<{
    term: string;
    translation: string;
    english: string;
    example: string;
    difficulty: string;
  }> {
    const text = data.generations?.[0]?.text || '';
    return this.parseTextResponse(text, request);
  }


  /**
   * Парсит текстовый ответ в JSON
   */
  private static parseTextResponse(text: string, request: FreeAIRequest): Array<{
    term: string;
    translation: string;
    english: string;
    example: string;
    difficulty: string;
  }> {
    try {
      // Очищаем контент от возможных markdown блоков
      let cleanContent = text.trim();
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
      console.error('❌ Error parsing AI response:', error);
      console.error('Raw content:', text);
      
      // Fallback - возвращаем пустой массив
      return [];
    }
  }

  /**
   * Тестирует подключение к выбранному сервису
   */
  static async testConnection(service: FreeAIServiceEnum): Promise<{ success: boolean; error?: string }> {
    const apiKey = this.getApiKey(service);
    if (!apiKey) {
      return {
        success: false,
        error: 'API ключ не настроен'
      };
    }

    try {
      switch (service) {
        case FreeAIServiceEnum.HUGGING_FACE:
          return await this.testHuggingFace(apiKey);
        case FreeAIServiceEnum.COHERE:
          return await this.testCohere(apiKey);
        default:
          return { success: false, error: 'Unsupported service' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection error'
      };
    }
  }

  private static async testHuggingFace(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: 'Hello, test message',
          parameters: { max_length: 10 }
        })
      });

      return { success: response.ok };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  private static async testCohere(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'command-light',
          prompt: 'Hello, test message',
          max_tokens: 10
        })
      });

      return { success: response.ok };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

}

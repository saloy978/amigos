/**
 * Сервис для генерации изображений с помощью Leonardo.ai API
 * Документация: https://docs.leonardo.ai/docs/getting-started
 */

import { getApiKey, isServiceEnabled } from '../config/apiKeys';
import { CardService } from './cardService';
import { ImageMetadata } from './imageStorageService';

export interface LeonardoImageRequest {
  word: string;
  language: string;
  style?: 'cartoon' | 'realistic' | 'artistic' | 'simple';
  size?: 'small' | 'medium' | 'large';
  model?: 'leonardo-xl' | 'leonardo-diffusion' | 'leonardo-creative' | 'flux';
}

export interface LeonardoImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  service?: string;
  prompt?: string;
  model?: string;
  seed?: number;
}

export interface LeonardoGenerationRequest {
  prompt: string;
  modelId?: string;
  width?: number;
  height?: number;
  num_images?: number;
  guidance_scale?: number;
  seed?: number;
  // Параметры для FLUX
  contrast?: number;
  ultra?: boolean;
  styleUUID?: string;
  enhancePrompt?: boolean;
}

export interface LeonardoGenerationResponse {
  sdGenerationJob?: {
    generationId: string;
    status: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface LeonardoGenerationStatus {
  generations_by_pk?: {
    id: string;
    status: string;
    generated_images?: Array<{
      id: string;
      url: string;
    }>;
  };
  error?: {
    message: string;
    code: string;
  };
}

export class LeonardoImageGeneratorService {
  private static readonly API_BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1';
  
  // Доступные модели Leonardo.ai (протестированы)
  private static readonly AVAILABLE_MODELS: Record<string, {
    id: string;
    name: string;
    description: string;
    cost: number;
    styleUUID?: string;
  }> = {
    'leonardo-xl': {
      id: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3',
      name: 'Leonardo Diffusion XL',
      description: 'Основная модель Leonardo для высококачественной генерации',
      cost: 6
    },
    'leonardo-diffusion': {
      id: 'ac614f96-1082-45bf-be9d-757f2d31c174',
      name: 'Leonardo Diffusion',
      description: 'Классическая модель Leonardo',
      cost: 6
    },
    'leonardo-creative': {
      id: 'e316348f-7773-490e-adcd-46757c738eb7',
      name: 'Leonardo Creative',
      description: 'Креативная модель для художественных изображений',
      cost: 6
    },
    'flux': {
      id: 'b2614463-296c-462a-9586-aafdb8f00e36',
      name: 'FLUX',
      description: 'Модель FLUX для высококачественной генерации',
      cost: 11,
      styleUUID: '111dc692-d470-4eec-b791-3475abac4c46'
    }
  };
  
  private static readonly FALLBACK_IMAGES = [
    'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=200&h=200&fit=crop&crop=face'
  ];

  /**
   * Генерирует изображение для слова используя Leonardo.ai API
   */
  static async generateImage(request: LeonardoImageRequest): Promise<LeonardoImageResponse> {
    console.log('🎨 LeonardoImageGeneratorService: Generating image for:', request);
    
    try {
      // Проверяем доступность сервиса
      if (!isServiceEnabled('LEONARDO')) {
        console.warn('⚠️ Leonardo.ai service is not enabled');
        return {
          success: false,
          error: 'Сервис Leonardo.ai отключен в настройках'
        };
      }

      const apiKey = getApiKey('LEONARDO_API_KEY');
      if (!apiKey) {
        console.warn('⚠️ Leonardo.ai API key is not configured');
        return {
          success: false,
          error: 'API ключ Leonardo.ai не настроен'
        };
      }

      // Строим промпт для генерации
      const prompt = this.buildPrompt(request.word, request.language, request.style);
      
      // Выбираем модель (FLUX по умолчанию)
      const selectedModel = this.getModelInfo(request.model || 'flux');
      
      // Создаем задачу генерации
      const generationRequest: LeonardoGenerationRequest = {
        prompt: prompt,
        modelId: selectedModel.id,
        width: 320, // Фиксированный размер 512x512
        height: 320,
        num_images: 1,
        seed: this.generateSeed(request.word)
      };

      // Добавляем параметры в зависимости от модели
      if (request.model === 'flux') {
        // Параметры для FLUX
        generationRequest.contrast = 3.5;
        generationRequest.ultra = true;
        generationRequest.enhancePrompt = true;
        if (selectedModel.styleUUID) {
          generationRequest.styleUUID = selectedModel.styleUUID;
        }
      } else {
        // Параметры для Leonardo моделей
        generationRequest.guidance_scale = 4;
      }

      console.log('🚀 Creating Leonardo.ai generation job...');
      const generationResponse = await this.createGeneration(generationRequest, apiKey);
      
      if (!generationResponse.success || !generationResponse.generationId) {
        console.error('❌ Failed to create generation job:', generationResponse.error);
        return {
          success: false,
          error: `Не удалось создать задачу генерации: ${generationResponse.error || 'Неизвестная ошибка'}`
        };
      }

      console.log('⏳ Waiting for image generation to complete...');
      const imageUrl = await this.waitForGeneration(generationResponse.generationId, apiKey);
      
      if (imageUrl) {
        console.log('✅ Image generated successfully with Leonardo.ai');
        return {
          success: true,
          imageUrl: imageUrl,
          service: 'Leonardo.ai',
          prompt: prompt,
          model: selectedModel.name,
          seed: generationRequest.seed
        };
      } else {
        console.warn('⚠️ Image generation failed');
        return {
          success: false,
          error: 'Генерация изображения не завершилась успешно'
        };
      }
      
    } catch (error) {
      console.error('❌ LeonardoImageGeneratorService: Error generating image:', error);
      return {
        success: false,
        error: `Ошибка при генерации изображения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      };
    }
  }

  /**
   * Создает задачу генерации изображения
   */
  private static async createGeneration(
    request: LeonardoGenerationRequest, 
    apiKey: string
  ): Promise<{ success: boolean; generationId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          prompt: request.prompt,
          modelId: request.modelId || 'b2614463-296c-462a-9586-aafdb8f00e36', // FLUX по умолчанию
          width: request.width || 320,
          height: request.height || 320,
          num_images: request.num_images || 1,
          seed: request.seed,
          // Параметры для Leonardo моделей
          ...(request.guidance_scale && { guidance_scale: Math.round(request.guidance_scale) }),
          // Параметры для FLUX
          ...(request.contrast && { contrast: request.contrast }),
          ...(request.ultra && { ultra: request.ultra }),
          ...(request.styleUUID && { styleUUID: request.styleUUID }),
          ...(request.enhancePrompt && { enhancePrompt: request.enhancePrompt })
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.sdGenerationJob && data.sdGenerationJob.generationId) {
        return {
          success: true,
          generationId: data.sdGenerationJob.generationId
        };
      } else {
        return {
          success: false,
          error: 'No generation job created'
        };
      }
    } catch (error) {
      console.error('Error creating generation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Ожидает завершения генерации и возвращает URL изображения
   */
  private static async waitForGeneration(
    generationId: string, 
    apiKey: string, 
    maxAttempts: number = 30
  ): Promise<string | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.API_BASE_URL}/generations/${generationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.generations_by_pk) {
          throw new Error('Generation not found');
        }

        const generation = data.generations_by_pk;
        console.log(`📊 Generation status: ${generation.status} (attempt ${attempt + 1}/${maxAttempts})`);

        if (generation.status === 'COMPLETE' && generation.generated_images?.length > 0) {
          return generation.generated_images[0].url;
        } else if (generation.status === 'FAILED') {
          throw new Error('Generation failed');
        }

        // Ждем 3 секунды перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Error checking generation status (attempt ${attempt + 1}):`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    throw new Error('Generation timeout');
  }

  /**
   * Строит промпт для генерации изображения
   */
  private static buildPrompt(word: string, language: string, style: string = 'cartoon'): string {
    // Переводим слово на английский для лучшего понимания ИИ
    const translations: Record<string, Record<string, string>> = {
      'es': {
        'manzana': 'apple',
        'perro': 'dog',
        'casa': 'house',
        'agua': 'water',
        'libro': 'book',
        'gato': 'cat',
        'sol': 'sun',
        'luna': 'moon',
        'árbol': 'tree',
        'flor': 'flower',
        'coche': 'car',
        'avión': 'airplane',
        'comida': 'food',
        'música': 'music',
        'deporte': 'sport',
        'familia': 'family',
        'amigo': 'friend',
        'escuela': 'school',
        'trabajo': 'work',
        'tiempo': 'time',
        'dinero': 'money',
        'feliz': 'happy',
        'triste': 'sad',
        'grande': 'big',
        'pequeño': 'small',
        'rojo': 'red',
        'azul': 'blue',
        'verde': 'green',
        'amarillo': 'yellow',
        'negro': 'black',
        'blanco': 'white',
        // Дополнительные слова из новых шаблонов
        'madre': 'mother',
        'padre': 'father',
        'hermana': 'sister',
        'hermano': 'brother',
        'abuela': 'grandmother',
        'abuelo': 'grandfather',
        'bebé': 'baby',
        'niño': 'child',
        'hombre': 'man',
        'mujer': 'woman',
        'plátano': 'banana',
        'naranja': 'orange',
        'pan': 'bread',
        'leche': 'milk',
        'café': 'coffee',
        'té': 'tea',
        'jugo': 'juice',
        'pastel': 'cake',
        'pizza': 'pizza',
        'pollo': 'chicken',
        'pescado': 'fish',
        'arroz': 'rice',
        'pasta': 'pasta',
        'pájaro': 'bird',
        'pez': 'fish',
        'caballo': 'horse',
        'vaca': 'cow',
        'cerdo': 'pig',
        'oveja': 'sheep',
        'conejo': 'rabbit',
        'ratón': 'mouse',
        'habitación': 'room',
        'cocina': 'kitchen',
        'dormitorio': 'bedroom',
        'baño': 'bathroom',
        'sala': 'living room',
        'mesa': 'table',
        'silla': 'chair',
        'cama': 'bed',
        'puerta': 'door',
        'ventana': 'window',
        'escalera': 'stairs',
        'gris': 'gray',
        'marrón': 'brown',
        'rosa': 'pink',
        'uno': 'one',
        'dos': 'two',
        'tres': 'three',
        'cuatro': 'four',
        'cinco': 'five',
        'seis': 'six',
        'siete': 'seven',
        'ocho': 'eight',
        'nueve': 'nine',
        'diez': 'ten'
      }
    };

    const englishWord = translations[language]?.[word.toLowerCase()] || word;
    
    // Создаем промпт оптимизированный для FLUX Schnell с Auto/Dynamic настройками
    const basePrompt = `A single ${englishWord}, clearly visible and recognizable, educational flashcard style`;
    
    // Добавляем стилевые дескрипторы (Dynamic стиль будет автоматически адаптироваться)
    const stylePrompts = {
      'cartoon': 'cartoon illustration, bright colors, simple lines, child-friendly style, educational material',
      'realistic': 'realistic photograph, high quality, detailed, clear and sharp',
      'artistic': 'artistic illustration, beautiful colors, creative style, educational',
      'simple': 'simple line drawing, minimal style, clean and clear, educational'
    };

    const stylePrompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.cartoon;
    
    // Добавляем специфичные дескрипторы для точности (Auto Prompt Enhance будет их оптимизировать)
    const specificityPrompts = [
      'pure white background',
      'centered composition',
      'no other objects',
      'no text or words',
      'no decorative elements',
      'clear and recognizable',
      'educational flashcard quality',
      'high contrast',
      'well-defined edges',
      'FLUX quality'
    ];

    return `${basePrompt}, ${stylePrompt}, ${specificityPrompts.join(', ')}`;
  }

  /**
   * Получает ширину изображения в зависимости от размера
   */
  private static getImageWidth(): number {
    // Всегда возвращаем 512 для квадратных изображений
    return 512;
  }

  /**
   * Получает высоту изображения в зависимости от размера
   */
  private static getImageHeight(): number {
    // Всегда возвращаем 512 для квадратных изображений
    return 512;
  }

  /**
   * Генерирует seed на основе слова для консистентности
   */
  private static generateSeed(word: string): number {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      const char = word.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Получает информацию о модели
   */
  private static getModelInfo(modelKey: string) {
    const model = this.AVAILABLE_MODELS[modelKey as keyof typeof this.AVAILABLE_MODELS];
    if (!model) {
      console.warn(`⚠️ Модель ${modelKey} не найдена, используем FLUX`);
      return this.AVAILABLE_MODELS['flux'];
    }
    return model;
  }

  /**
   * Возвращает fallback изображение
   */
  private static getFallbackImage(): LeonardoImageResponse {
    const randomIndex = Math.floor(Math.random() * this.FALLBACK_IMAGES.length);
    return {
      success: true,
      imageUrl: this.FALLBACK_IMAGES[randomIndex],
      service: 'Fallback'
    };
  }

  /**
   * Получает список доступных моделей
   */
  static getAvailableModels(): Array<{value: string, label: string, description: string, cost: number, isFlux?: boolean}> {
    return Object.entries(this.AVAILABLE_MODELS).map(([key, model]) => ({
      value: key,
      label: model.name,
      description: model.description,
      cost: model.cost,
      isFlux: key === 'flux'
    }));
  }

  /**
   * Получает список доступных стилей
   */
  static getAvailableStyles(): Array<{value: string, label: string}> {
    return [
      { value: 'cartoon', label: 'Мультяшный' },
      { value: 'realistic', label: 'Реалистичный' },
      { value: 'artistic', label: 'Художественный' },
      { value: 'simple', label: 'Простой' }
    ];
  }

  /**
   * Получает информацию о сервисе
   */
  static getServiceInfo(): {name: string, description: string, free: boolean, defaultModel: string} {
    return {
      name: 'Leonardo.ai',
      description: 'Высококачественная генерация изображений с помощью ИИ (FLUX по умолчанию)',
      free: false,
      defaultModel: 'FLUX'
    };
  }

  /**
   * Генерирует изображение и сохраняет его в Storage
   */
  static async generateAndSaveImage(
    cardId: number,
    word: string,
    language: string = 'es',
    style: 'cartoon' | 'realistic' | 'artistic' | 'simple' = 'cartoon',
    isPublic: boolean = false
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      console.log('🎨 LeonardoImageGenerator: Starting generation and save process');
      
      // Generate image using existing method
      const generationResult = await this.generateImage({
        word,
        language,
        style
      });
      
      if (!generationResult.success || !generationResult.imageUrl) {
        return {
          success: false,
          error: generationResult.error || 'Failed to generate image'
        };
      }

      console.log('🎨 LeonardoImageGenerator: Image generated, importing to storage...');

      // Create metadata for the generated image
      const metadata: ImageMetadata = {
        source: 'leonardo',
        prompt: generationResult.prompt || word,
        model: generationResult.model || 'FLUX',
        seed: generationResult.seed?.toString(),
        generated_at: new Date().toISOString(),
        original_url: generationResult.imageUrl,
        style: style,
        language: language
      };

      // Import image to storage
      const storageResult = await CardService.importCardImageFromUrl(
        cardId,
        generationResult.imageUrl,
        isPublic,
        metadata
      );

      console.log('🎨 LeonardoImageGenerator: Image saved to storage:', storageResult.path);

      return {
        success: true,
        imageUrl: storageResult.url
      };

    } catch (error) {
      console.error('🎨 LeonardoImageGenerator: Error in generateAndSaveImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Генерирует изображение для карточки с автоматическим сохранением
   */
  static async generateForCard(
    cardId: number,
    term: string,
    translation: string,
    english?: string,
    style: 'cartoon' | 'realistic' | 'artistic' | 'simple' = 'cartoon'
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      console.log('🎨 LeonardoImageGenerator: Generating image for card:', { cardId, term, translation, english });

      // Create a descriptive prompt
      const prompt = this.createImagePrompt(term, translation, english);
      
      // Generate and save image
      const result = await this.generateAndSaveImage(cardId, prompt, 'es', style, false);
      
      if (result.success) {
        console.log('🎨 LeonardoImageGenerator: Successfully generated and saved image for card:', cardId);
      } else {
        console.error('🎨 LeonardoImageGenerator: Failed to generate image for card:', cardId, result.error);
      }

      return result;

    } catch (error) {
      console.error('🎨 LeonardoImageGenerator: Error generating for card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image for card'
      };
    }
  }

  /**
   * Создает промпт для генерации изображения на основе слова и перевода
   */
  private static createImagePrompt(term: string, translation: string, english?: string): string {
    const basePrompt = `A clear, simple illustration of "${term}" (${translation})`;
    
    if (english) {
      return `${basePrompt}, which means "${english}" in English`;
    }
    
    return basePrompt;
  }

  /**
   * Генерирует несколько вариантов изображений для карточки
   */
  static async generateMultipleVariants(
    cardId: number,
    term: string,
    translation: string,
    english?: string,
    count: number = 3
  ): Promise<{ success: boolean; images?: Array<{ url: string; style: string }>; error?: string }> {
    try {
      console.log('🎨 LeonardoImageGenerator: Generating multiple variants for card:', cardId);

      const styles: Array<'cartoon' | 'realistic' | 'artistic' | 'simple'> = ['cartoon', 'artistic', 'simple'];
      const results: Array<{ url: string; style: string }> = [];

      // Generate images with different styles
      for (let i = 0; i < Math.min(count, styles.length); i++) {
        const style = styles[i];
        const result = await this.generateForCard(cardId, term, translation, english, style);
        
        if (result.success && result.imageUrl) {
          results.push({
            url: result.imageUrl,
            style: style
          });
        }
      }

      if (results.length === 0) {
        return {
          success: false,
          error: 'Failed to generate any images'
        };
      }

      console.log('🎨 LeonardoImageGenerator: Generated', results.length, 'variants for card:', cardId);

      return {
        success: true,
        images: results
      };

    } catch (error) {
      console.error('🎨 LeonardoImageGenerator: Error generating multiple variants:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate multiple variants'
      };
    }
  }
}

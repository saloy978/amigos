/**
 * Сервис для генерации изображений с помощью Leonardo.ai
 */

import { LeonardoImageGeneratorService, LeonardoImageRequest, LeonardoImageResponse } from './leonardoImageGenerator';

export interface ImageGenerationRequest {
  word: string;
  language: string;
  style?: 'cartoon' | 'realistic' | 'artistic' | 'simple';
  size?: 'small' | 'medium' | 'large';
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  service?: string;
}

export class ImageGenerationService {
  /**
   * Генерирует изображение для слова используя Leonardo.ai
   */
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    console.log('🖼️ ImageGenerationService: Generating image for:', request);
    
    try {
      // Проверяем настройки генерации изображений
      const settings = this.getImageGenerationSettings();
      if (!this.shouldGenerateImage(settings)) {
        console.log('🚫 Image generation disabled by settings');
        return this.getFallbackImage(request);
      }

      // Используем Leonardo.ai для генерации изображений
      const leonardoRequest: LeonardoImageRequest = {
        word: request.word,
        language: request.language,
        style: request.style || 'cartoon',
        size: request.size || 'medium'
      };

      const result = await LeonardoImageGeneratorService.generateImage(leonardoRequest);
      
      if (result.success && result.imageUrl) {
        console.log(`✅ Image generated successfully using ${result.service}`);
        return {
          success: true,
          imageUrl: result.imageUrl,
          service: result.service
        };
      } else {
        console.warn('⚠️ Leonardo.ai failed, using fallback');
        return this.getFallbackImage(request);
      }
      
    } catch (error) {
      console.error('❌ ImageGenerationService: Error generating image:', error);
      return this.getFallbackImage(request);
    }
  }

  /**
   * Fallback - возвращает случайное изображение из предустановленных
   */
  private static getFallbackImage(request: ImageGenerationRequest): ImageGenerationResponse {
    const fallbackImages = [
      'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=200&h=200&fit=crop&crop=face'
    ];
    
    const randomIndex = Math.floor(Math.random() * fallbackImages.length);
    return {
      success: true,
      imageUrl: fallbackImages[randomIndex],
      service: 'Fallback'
    };
  }

  /**
   * Получает список доступных стилей
   */
  static getAvailableStyles(): Array<{value: string, label: string}> {
    return LeonardoImageGeneratorService.getAvailableStyles();
  }

  /**
   * Получает информацию о доступных сервисах
   */
  static getAvailableServices(): Array<{name: string, description: string, free: boolean}> {
    return [
      LeonardoImageGeneratorService.getServiceInfo(),
      { 
        name: 'Fallback', 
        description: 'Резервные изображения', 
        free: true 
      }
    ];
  }

  /**
   * Получает настройки генерации изображений из localStorage
   */
  private static getImageGenerationSettings(): {
    style: string;
    enabledServices: string[];
  } | null {
    try {
      const saved = localStorage.getItem('imageGenerationSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to parse image generation settings:', error);
    }
    return null;
  }

  /**
   * Проверяет, нужно ли генерировать изображения на основе настроек
   */
  private static shouldGenerateImage(settings: {
    style: string;
    enabledServices: string[];
  } | null): boolean {
    if (!settings || !settings.enabledServices) {
      // Если настройки не найдены, используем значения по умолчанию
      return true;
    }
    
    // Проверяем, есть ли хотя бы один включенный сервис
    const hasEnabledServices = settings.enabledServices.length > 0;
    
    if (!hasEnabledServices) {
      console.log('🚫 Image generation disabled - no services enabled');
      return false;
    }
    
    // Проверяем, что включен хотя бы один реальный сервис (не только Fallback)
    const hasRealServices = settings.enabledServices.some(service => 
      service !== 'Fallback' && service !== 'Unsplash' && service !== 'Pexels' && service !== 'Pixabay' && service !== 'Craiyon'
    );
    
    if (!hasRealServices) {
      console.log('🚫 Image generation disabled - only fallback services enabled');
      return false;
    }
    
    return true;
  }
}


import { ImageGenerationService, ImageGenerationRequest as NewImageRequest, ImageGenerationResponse as NewImageResponse } from './imageGenerationService';

interface ImageGenerationRequest {
  term: string;
  translation: string;
  language: string;
}

interface ImageGenerationResponse {
  imageUrl: string;
  success: boolean;
  error?: string;
}

export class ImageGeneratorService {
  
  // Fallback изображения для разных категорий
  private static readonly FALLBACK_IMAGES = {
    animals: [
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?w=400&h=300&fit=crop'
    ],
    food: [
      'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400&h=300&fit=crop'
    ],
    nature: [
      'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?w=400&h=300&fit=crop'
    ],
    objects: [
      'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?w=400&h=300&fit=crop'
    ],
    people: [
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=400&h=300&fit=crop'
    ],
    default: [
      'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?w=400&h=300&fit=crop',
      'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?w=400&h=300&fit=crop'
    ]
  };

  /**
   * Генерирует изображение для слова используя новый сервис с бесплатными ИИ
   */
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    console.log('🖼️ ImageGeneratorService: Generating image for:', request);
    
    try {
      // Используем новый сервис с бесплатными ИИ
      const newRequest: NewImageRequest = {
        word: request.term,
        language: request.language,
        style: 'cartoon' // По умолчанию мультяшный стиль
      };

      const result = await ImageGenerationService.generateImage(newRequest);
      
      if (result.success && result.imageUrl) {
        console.log(`✅ Image generated successfully using ${result.service}`);
        return {
          imageUrl: result.imageUrl,
          success: true
        };
      } else {
        console.warn('⚠️ New image service failed, using fallback');
        return this.getFallbackImage(request);
      }
      
    } catch (error) {
      console.error('❌ ImageGeneratorService: Error generating image:', error);
      return this.getFallbackImage(request);
    }
  }

  /**
   * Пробует получить изображение через Unsplash API
   */
  private static async tryUnsplash(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.UNSPLASH_ACCESS_KEY || this.UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
      console.log('⚠️ Unsplash API key not configured');
      return { imageUrl: '', success: false, error: 'API key not configured' };
    }

    try {
      const searchQuery = this.buildSearchQuery(request);
      const url = `${this.UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.UNSPLASH_ACCESS_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const image = data.results[0];
        return {
          imageUrl: `${image.urls.regular}?w=400&h=300&fit=crop`,
          success: true
        };
      }

      return { imageUrl: '', success: false, error: 'No images found' };
    } catch (error) {
      console.error('❌ Unsplash API error:', error);
      return { imageUrl: '', success: false, error: error.message };
    }
  }

  /**
   * Пробует получить изображение через Pexels API
   */
  private static async tryPexels(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.PEXELS_API_KEY || this.PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
      console.log('⚠️ Pexels API key not configured');
      return { imageUrl: '', success: false, error: 'API key not configured' };
    }

    try {
      const searchQuery = this.buildSearchQuery(request);
      const url = `${this.PEXELS_BASE_URL}/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': this.PEXELS_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.photos && data.photos.length > 0) {
        const photo = data.photos[0];
        return {
          imageUrl: `${photo.src.medium}?w=400&h=300&fit=crop`,
          success: true
        };
      }

      return { imageUrl: '', success: false, error: 'No images found' };
    } catch (error) {
      console.error('❌ Pexels API error:', error);
      return { imageUrl: '', success: false, error: error.message };
    }
  }

  /**
   * Строит поисковый запрос для API
   */
  private static buildSearchQuery(request: ImageGenerationRequest): string {
    const { term, translation, language } = request;
    
    // Определяем, какое слово использовать для поиска
    let searchTerm = term;
    
    // Если изучаемый язык не английский, используем перевод для поиска
    if (language !== 'en' && language !== 'english') {
      searchTerm = translation;
    }
    
    // Очищаем от лишних символов и приводим к нижнему регистру
    searchTerm = searchTerm.toLowerCase()
      .replace(/[^\w\s]/g, '') // Убираем знаки препинания
      .replace(/\s+/g, ' ')    // Заменяем множественные пробелы на один
      .trim();
    
    console.log('🔍 Search query built:', searchTerm);
    return searchTerm;
  }

  /**
   * Возвращает fallback изображение на основе категории слова
   */
  private static getFallbackImage(request: ImageGenerationRequest): ImageGenerationResponse {
    const category = this.categorizeWord(request.term, request.translation);
    const images = this.FALLBACK_IMAGES[category] || this.FALLBACK_IMAGES.default;
    
    // Выбираем случайное изображение из категории
    const randomIndex = Math.floor(Math.random() * images.length);
    const imageUrl = images[randomIndex];
    
    console.log('🎲 Using fallback image for category:', category);
    
    return {
      imageUrl,
      success: true
    };
  }

  /**
   * Определяет категорию слова для выбора подходящего fallback изображения
   */
  private static categorizeWord(term: string, translation: string): keyof typeof ImageGeneratorService.FALLBACK_IMAGES {
    const word = (term + ' ' + translation).toLowerCase();
    
    // Животные
    if (this.matchesCategory(word, ['dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'rabbit', 'mouse', 'собака', 'кот', 'птица', 'рыба', 'лошадь', 'корова', 'свинья', 'овца', 'кролик', 'мышь'])) {
      return 'animals';
    }
    
    // Еда
    if (this.matchesCategory(word, ['apple', 'banana', 'orange', 'bread', 'milk', 'coffee', 'tea', 'water', 'juice', 'cake', 'pizza', 'chicken', 'rice', 'pasta', 'яблоко', 'банан', 'апельсин', 'хлеб', 'молоко', 'кофе', 'чай', 'вода', 'сок', 'торт', 'пицца', 'курица', 'рис', 'паста'])) {
      return 'food';
    }
    
    // Природа
    if (this.matchesCategory(word, ['sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'wind', 'tree', 'flower', 'grass', 'mountain', 'river', 'sea', 'beach', 'forest', 'солнце', 'луна', 'звезда', 'облако', 'дождь', 'снег', 'ветер', 'дерево', 'цветок', 'трава', 'гора', 'река', 'море', 'пляж', 'лес'])) {
      return 'nature';
    }
    
    // Люди
    if (this.matchesCategory(word, ['mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather', 'baby', 'child', 'man', 'woman', 'teacher', 'doctor', 'nurse', 'police', 'cook', 'driver', 'farmer', 'artist', 'мама', 'папа', 'сестра', 'брат', 'бабушка', 'дедушка', 'малыш', 'ребёнок', 'мужчина', 'женщина', 'учитель', 'врач', 'медсестра', 'полиция', 'повар', 'водитель', 'фермер', 'художник'])) {
      return 'people';
    }
    
    // Предметы
    if (this.matchesCategory(word, ['house', 'room', 'kitchen', 'bedroom', 'bathroom', 'table', 'chair', 'bed', 'sofa', 'window', 'door', 'wall', 'floor', 'ceiling', 'lamp', 'shirt', 'pants', 'dress', 'shoes', 'hat', 'coat', 'jacket', 'socks', 'gloves', 'scarf', 'car', 'bus', 'train', 'plane', 'bike', 'boat', 'taxi', 'truck', 'дом', 'комната', 'кухня', 'спальня', 'ванная', 'стол', 'стул', 'кровать', 'диван', 'окно', 'дверь', 'стена', 'пол', 'потолок', 'лампа', 'рубашка', 'брюки', 'платье', 'туфли', 'шляпа', 'пальто', 'куртка', 'носки', 'перчатки', 'шарф', 'машина', 'автобус', 'поезд', 'самолёт', 'велосипед', 'лодка', 'такси', 'грузовик'])) {
      return 'objects';
    }
    
    return 'default';
  }

  /**
   * Проверяет, содержит ли слово ключевые слова категории
   */
  private static matchesCategory(word: string, keywords: string[]): boolean {
    return keywords.some(keyword => word.includes(keyword));
  }

  /**
   * Генерирует изображения для массива слов
   */
  static async generateImagesForWords(words: Array<{ term: string; translation: string; language: string }>): Promise<Array<{ term: string; translation: string; imageUrl: string }>> {
    console.log('🖼️ Generating images for', words.length, 'words');
    
    const results = await Promise.allSettled(
      words.map(async (word) => {
        const imageResult = await this.generateImage({
          term: word.term,
          translation: word.translation,
          language: word.language
        });
        
        return {
          term: word.term,
          translation: word.translation,
          imageUrl: imageResult.imageUrl
        };
      })
    );
    
    return results
      .filter((result): result is PromiseFulfilledResult<{ term: string; translation: string; imageUrl: string }> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Проверяет доступность API ключей
   */
  static getApiStatus(): { unsplash: boolean; pexels: boolean } {
    return {
      unsplash: !!(this.UNSPLASH_ACCESS_KEY && this.UNSPLASH_ACCESS_KEY !== 'YOUR_UNSPLASH_ACCESS_KEY'),
      pexels: !!(this.PEXELS_API_KEY && this.PEXELS_API_KEY !== 'YOUR_PEXELS_API_KEY')
    };
  }

  /**
   * Получает инструкции по настройке API ключей
   */
  static getSetupInstructions(): string {
    return `
Для генерации правильных изображений под слова необходимо настроить API ключи:

1. Unsplash API (рекомендуется):
   - Зарегистрируйтесь на https://unsplash.com/developers
   - Создайте новое приложение
   - Скопируйте Access Key
   - Замените YOUR_UNSPLASH_ACCESS_KEY в коде

2. Pexels API (альтернатива):
   - Зарегистрируйтесь на https://www.pexels.com/api/
   - Получите API ключ
   - Замените YOUR_PEXELS_API_KEY в коде

3. Без API ключей система будет использовать fallback изображения по категориям.
    `;
  }
}

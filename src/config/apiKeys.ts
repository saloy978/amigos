/**
 * Конфигурация API ключей для AI сервисов
 * Эти ключи должны быть установлены в переменных окружения
 */

export const API_KEYS = {
  // OpenAI ChatGPT API - получите на https://platform.openai.com/api-keys
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,

  // Hugging Face API - получите на https://huggingface.co/settings/tokens
  HUGGING_FACE_API_KEY: import.meta.env.VITE_HUGGING_FACE_API_KEY,

  // Cohere API - получите на https://dashboard.cohere.ai/api-keys
  COHERE_API_KEY: import.meta.env.VITE_COHERE_API_KEY,

  // Leonardo.ai API - получите на https://leonardo.ai
  LEONARDO_API_KEY: import.meta.env.VITE_LEONARDO_API_KEY,

  // Google Translate API - получите на https://console.cloud.google.com/apis/credentials
  GOOGLE_TRANSLATE_API_KEY: import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY,

  // Google Gemini API - получите на https://aistudio.google.com/app/apikey
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,

  // Google Text-to-Speech API - получите на https://console.cloud.google.com/apis/credentials
  GOOGLE_TTS_API_KEY: import.meta.env.VITE_GOOGLE_TTS_API_KEY
};

/**
 * Статус доступности каждого сервиса
 */
export const SERVICE_STATUS = {
  OPENAI: {
    enabled: false, // Установите true если есть валидный ключ
    name: 'ChatGPT',
    description: 'OpenAI GPT-3.5/4 API'
  },
  HUGGING_FACE: {
    enabled: true, // Бесплатный сервис, обычно доступен
    name: 'Hugging Face',
    description: 'Бесплатные открытые модели ИИ'
  },
  COHERE: {
    enabled: true, // Бесплатный тариф
    name: 'Cohere',
    description: 'Бесплатный тариф до 1000 запросов/месяц'
  },
  LEONARDO: {
    enabled: true, // Установите true если есть валидный ключ
    name: 'Leonardo.ai',
    description: 'Генерация изображений с помощью ИИ'
  },
  GOOGLE_TRANSLATE: {
    enabled: true, // Установите true если есть валидный ключ
    name: 'Google Translate',
    description: 'Автоматический перевод слов'
  },
  GEMINI: {
    enabled: true, // Установите true если есть валидный ключ
    name: 'Google Gemini',
    description: 'Google Gemini AI для генерации слов'
  },
  GOOGLE_TTS: {
    enabled: true, // Установите true если есть валидный ключ
    name: 'Google Text-to-Speech',
    description: 'Преобразование текста в речь'
  }
};

/**
 * Получить API ключ для сервиса
 */
export function getApiKey(service: keyof typeof API_KEYS): string | undefined {
  const key = API_KEYS[service];

  // Проверяем, что ключ существует и не является placeholder'ом
  if (!key || key.includes('xxxxxxxx') || key.includes('your-') || key.includes('here')) {
    return undefined;
  }

  return key;
}

/**
 * Проверить, доступен ли сервис
 */
export function isServiceEnabled(service: keyof typeof SERVICE_STATUS): boolean {
  return SERVICE_STATUS[service].enabled;
}

/**
 * Получить список доступных сервисов
 */
export function getAvailableServices(): Array<{
  key: keyof typeof SERVICE_STATUS;
  name: string;
  description: string;
  enabled: boolean;
}> {
  return Object.entries(SERVICE_STATUS).map(([key, config]) => ({
    key: key as keyof typeof SERVICE_STATUS,
    name: config.name,
    description: config.description,
    enabled: config.enabled
  }));
}

/**
 * Получить приоритетный порядок сервисов
 */
export function getServicePriority(): Array<keyof typeof SERVICE_STATUS> {
  return [
    'GEMINI',      // Основной сервис - Google Gemini, высокое качество, бесплатный
    'OPENAI',      // Резервный - платный, но лучший
    'HUGGING_FACE', // Бесплатный сервис, обычно доступен
    'COHERE'       // Хорошее качество, бесплатный тариф
  ];
}

/**
 * Получить приоритетный порядок сервисов для генерации изображений
 */
export function getImageServicePriority(): Array<keyof typeof SERVICE_STATUS> {
  return [
    'LEONARDO'     // Leonardo.ai для генерации изображений
  ];
}

/**
 * Получить первый доступный сервис
 */
export function getFirstAvailableService(): keyof typeof SERVICE_STATUS | null {
  const priority = getServicePriority();
  
  for (const service of priority) {
    if (isServiceEnabled(service)) {
      return service;
    }
  }
  
  return null;
}

/**
 * Получить первый доступный сервис для генерации изображений
 */
export function getFirstAvailableImageService(): keyof typeof SERVICE_STATUS | null {
  const priority = getImageServicePriority();
  
  for (const service of priority) {
    if (isServiceEnabled(service)) {
      return service;
    }
  }
  
  return null;
}

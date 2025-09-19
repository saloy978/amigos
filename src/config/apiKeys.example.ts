/**
 * ПРИМЕР конфигурации API ключей для AI сервисов
 * Скопируйте этот файл в apiKeys.ts и замените placeholder'ы на реальные ключи
 */

export const API_KEYS = {
  // OpenAI ChatGPT API - получите на https://platform.openai.com/api-keys
  OPENAI_API_KEY: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  
  // Hugging Face API - получите на https://huggingface.co/settings/tokens
  HUGGING_FACE_API_KEY: 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  
  // Cohere API - получите на https://dashboard.cohere.ai/api-keys
  COHERE_API_KEY: 'co_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  
  // YandexGPT API - получите на https://yandex.ru/dev/gpt
  YANDEX_GPT_API_KEY: 'AQVNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  
  // GigaChat API - получите на https://developers.sber.ru/portal/products/gigachat
  GIGACHAT_API_KEY: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
};

/**
 * Статус доступности каждого сервиса
 * Установите enabled: true для сервисов, которые хотите использовать
 */
export const SERVICE_STATUS = {
  OPENAI: {
    enabled: false, // Установите true если есть валидный ключ ChatGPT
    name: 'ChatGPT',
    description: 'OpenAI GPT-3.5/4 API - платный, но лучший'
  },
  HUGGING_FACE: {
    enabled: true, // Бесплатный сервис, обычно доступен
    name: 'Hugging Face',
    description: 'Бесплатные открытые модели ИИ'
  },
  COHERE: {
    enabled: true, // Бесплатный тариф до 1000 запросов/месяц
    name: 'Cohere',
    description: 'Бесплатный тариф до 1000 запросов/месяц'
  },
  YANDEX_GPT: {
    enabled: true, // Российский сервис, хорошая поддержка русского языка
    name: 'YandexGPT',
    description: 'Российская модель от Яндекса'
  },
  GIGACHAT: {
    enabled: true, // Российский сервис от Сбера
    name: 'GigaChat',
    description: 'Российская модель от Сбера'
  }
};

/**
 * Получить API ключ для сервиса
 */
export function getApiKey(service: keyof typeof API_KEYS): string | null {
  const key = API_KEYS[service];
  
  // Проверяем, что ключ не является placeholder'ом
  if (key.includes('xxxxxxxx') || key.includes('your-') || key.includes('here')) {
    return null;
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
    'OPENAI',      // Высший приоритет - платный, но лучший
    'COHERE',      // Хорошее качество, бесплатный тариф
    'YANDEX_GPT',  // Российский сервис, хорошая поддержка русского
    'GIGACHAT',    // Российский сервис
    'HUGGING_FACE' // Fallback - может быть медленным
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




























import React, { useState, useEffect } from 'react';
import { X, Sparkles, Brain, Check, Plus, Loader2, Image } from 'lucide-react';
import { Card, CardState, ReviewDirection, UserCardWithContent } from '../../types';
import { AIWordGeneratorService } from '../../services/aiWordGenerator';
import { UserService } from '../../services/userService';
import { DatabaseService } from '../../services/database';
import { ImageApiSetupModal } from './ImageApiSetupModal';
import { AIStatusModal } from './AIStatusModal';
import { ImageGenerationSettingsModal } from './ImageGenerationSettingsModal';
import { ChatGPTService } from '../../services/chatgptService';
import { FreeAIService } from '../../services/freeAIService';
import { ImageGenerationService } from '../../services/imageGenerationService';

interface AIWordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cards: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  existingCards: UserCardWithContent[];
}

interface WordSuggestion {
  term: string;
  translation: string;
  english?: string;
  imageUrl?: string;
  example?: string;
  difficulty: string;
  selected: boolean;
}

export const AIWordGeneratorModal: React.FC<AIWordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCards
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [showAIStatus, setShowAIStatus] = useState(false);
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [topic, setTopic] = useState('');
  const [isTopicsCollapsed, setIsTopicsCollapsed] = useState(true);
  const [currentUser] = useState(() => UserService.getCurrentUser());
  const [currentSettings] = useState(() => {
    const settings = UserService.getUserSettings();
    const dbSettings = DatabaseService.getLanguagePair();
    return settings || dbSettings;
  });
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [imageGenerationSettings, setImageGenerationSettings] = useState<{
    style: string;
    enabledServices: string[];
  }>(() => {
    // Загружаем настройки из localStorage или используем значения по умолчанию
    const saved = localStorage.getItem('imageGenerationSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse saved image generation settings:', error);
      }
    }
    return { 
      style: 'cartoon', 
      enabledServices: ['Leonardo.ai', 'Fallback'] 
    };
  });
  
  // Список тем для автоматической генерации
  const autoTopics = [
    'еда и напитки',
    'семья и друзья',
    'дом и квартира',
    'работа и профессии',
    'путешествия и транспорт',
    'покупки и магазины',
    'здоровье и медицина',
    'спорт и отдых',
    'природа и животные',
    'время и календарь',
    'цвета и числа',
    'одежда и мода',
    'образование и школа',
    'технологии и интернет',
    'музыка и искусство'
  ];
  
  // Функция для получения случайной темы
  const getRandomTopic = (): string => {
    const availableTopics = autoTopics.filter(t => t !== topic.trim());
    if (availableTopics.length === 0) {
      return autoTopics[Math.floor(Math.random() * autoTopics.length)];
    }
    return availableTopics[Math.floor(Math.random() * availableTopics.length)];
  };
  
  // Функция для повторной генерации с новой темой
  const retryGenerationWithNewTopic = async (currentRetryCount: number): Promise<void> => {
    if (isRetrying) {
      console.log('⏳ Retry already in progress, skipping...');
      return;
    }
    
    setIsRetrying(true);
    const newTopic = getRandomTopic();
    const newRetryCount = currentRetryCount + 1;
    console.log(`🔄 Retrying generation with new topic: "${newTopic}" (attempt ${newRetryCount})`);
    
    setTopic(newTopic);
    setRetryCount(newRetryCount);
    
    // Небольшая задержка перед повторной генерацией
    setTimeout(() => {
      setIsRetrying(false);
      handleGenerateWithRetryCountAndTopic(newRetryCount, newTopic);
    }, 1000); // Увеличили задержку до 1 секунды
  };
  
  // Load user level on component mount
  useEffect(() => {
    const loadUserLevel = async () => {
      try {
        const level = await getUserLevel();
        setSelectedLevel(level);
      } catch (error) {
        console.warn('Error loading user level:', error);
        const fallbackLevel = currentUser?.level || 'A1';
        setSelectedLevel(fallbackLevel);
      }
    };
    
    loadUserLevel();
  }, [currentSettings, currentUser]);
  
  // Get user level from settings (preferred) or fallback to currentUser
  const getUserLevel = async (): Promise<string> => {
    try {
      console.log('🔍 Getting user level from database...');
      
      // Try to get from database directly first
      const dbUser = await UserService.getCurrentUserFromDB();
      if (dbUser?.level) {
        console.log('✅ Got level from database:', dbUser.level);
        return dbUser.level;
      }
      
      // Try to get fresh settings from database
      const freshSettings = UserService.getUserSettings();
      if (freshSettings?.level) {
        console.log('✅ Got level from fresh settings:', freshSettings.level);
        return freshSettings.level;
      }
      
      // Try to get from current settings
      if (currentSettings && 'level' in currentSettings && currentSettings.level) {
        console.log('✅ Got level from current settings:', currentSettings.level);
        return currentSettings.level as string;
      }
      
      // Fallback to currentUser level
      const fallbackLevel = currentUser?.level || 'A1';
      console.log('⚠️ Using fallback level:', fallbackLevel);
      return fallbackLevel;
    } catch (error) {
      console.warn('❌ Error getting user level, using fallback:', error);
      const fallbackLevel = currentUser?.level || 'A1';
      console.log('⚠️ Using fallback level after error:', fallbackLevel);
      return fallbackLevel;
    }
  };

  /**
   * Генерирует изображения для массива слов
   */
  const generateImagesForWords = async (words: WordSuggestion[]): Promise<WordSuggestion[]> => {
    console.log('🖼️ Generating images for', words.length, 'words');
    
    const results = await Promise.all(
      words.map(async (word) => {
        // Извлекаем английское слово из поля english или примера
        const englishWord = extractEnglishWordFromExample(word);
        console.log(`🖼️ Generating image for "${word.term}" using English word: "${englishWord}"`);
        
        let imageUrl = '';
        
        try {
          const imageResult = await ImageGenerationService.generateImage({
            word: englishWord,
            language: 'en', // Всегда используем английский для генерации изображений
            style: 'cartoon'
          });
          
          if (imageResult.success && imageResult.imageUrl) {
            imageUrl = imageResult.imageUrl;
            console.log(`✅ Image generated for "${word.term}": ${imageUrl}`);
          } else {
            console.warn(`⚠️ Image generation failed for "${word.term}": ${imageResult.error}`);
            // Используем fallback изображение
            imageUrl = `https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400&h=300&fit=crop`;
          }
        } catch (error) {
          console.warn(`⚠️ Image generation error for "${word.term}":`, error);
          // Используем fallback изображение
          imageUrl = `https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400&h=300&fit=crop`;
        }
        
        return {
          ...word,
          imageUrl: imageUrl
        };
      })
    );
    
    console.log('✅ Images generated for all words');
    return results;
  };

  /**
   * Извлекает английское слово из примера предложения
   */
  const extractEnglishWordFromExample = (word: any): string => {
    // Если есть поле english, используем его
    if (word.english && word.english.trim()) {
      return word.english.trim();
    }
    
    // Иначе извлекаем из примера
    const example = word.example || '';
    const words = example.toLowerCase()
      .replace(/[.,!?;:]/g, '') // Убираем знаки препинания
      .split(' ')
      .filter((word: string) => word.length > 2) // Убираем короткие слова
      .filter((word: string) => !['the', 'and', 'are', 'is', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'can', 'could', 'should', 'may', 'might', 'voy', 'a', 'la', 'el', 'de', 'en', 'con', 'por', 'para', 'que', 'como', 'muy', 'más', 'muy', 'bien', 'mal', 'bueno', 'buena', 'nuevo', 'nueva'].includes(word)); // Убираем служебные слова
    
    // Возвращаем первое подходящее слово
    return words[0] || 'object';
  };

  const handleGenerateWithRetryCount = async (currentRetryCount: number = 0) => {
    // Защита от множественных одновременных генераций
    if (isGenerating && currentRetryCount === 0) {
      console.log('⏳ Generation already in progress, skipping...');
      return;
    }
    
    const now = Date.now();
    const timeSinceLastGeneration = now - lastGenerationTime;
    
    // Защита от слишком частых попыток (минимум 1 секунда между попытками)
    if (timeSinceLastGeneration < 1000 && currentRetryCount > 0) {
      console.log('⏳ Too soon since last generation, waiting...');
      setTimeout(() => {
        handleGenerateWithRetryCount(currentRetryCount);
      }, 1000 - timeSinceLastGeneration);
      return;
    }
    
    setLastGenerationTime(now);
    console.log('🚀 Starting AI word generation...');
    console.log('Current user:', currentUser);
    console.log('Current settings:', currentSettings);
    console.log('Existing cards count:', existingCards.length);
    
    if (!currentUser) {
      console.error('❌ No current user found');
      alert('Ошибка: не удалось получить данные пользователя');
      return;
    }

    // Get current language settings
    const languageSettings = UserService.getUserSettings() || DatabaseService.getLanguagePair();
    console.log('Language settings:', languageSettings);
    
    if (!languageSettings) {
      console.error('❌ No language settings found');
      alert('Ошибка: не удалось получить настройки языков');
      return;
    }
    
    setIsGenerating(true);
    setSuggestions([]);

    try {
      // Получаем существующие слова из базы данных
      const existingWordsFromDB = existingCards.map(card => card.term);
      
      // Получаем слова из предыдущей генерации (если есть)
      const previousGeneratedWords = suggestions.map(suggestion => suggestion.term);
      
      // Объединяем все существующие слова
      const existingWords = [...existingWordsFromDB, ...previousGeneratedWords];
      
      console.log('Existing words from DB:', existingWordsFromDB);
      console.log('Previous generated words:', previousGeneratedWords);
      console.log('All existing words:', existingWords);
      console.log('🎯 Using selected level for generation:', selectedLevel);
      console.log('🎯 Selected level type:', typeof selectedLevel);
      
      // Проверяем доступные AI сервисы
      const chatGPTStatus = ChatGPTService.getApiStatus();
      const freeAIStatus = FreeAIService.getServicesStatus();
      const hasFreeAI = Object.values(freeAIStatus).some(status => status.configured);
      
      let generatedWords: any[] = [];
      
      // Сначала пробуем FreeAI сервисы (включая Gemini как основной)
      if (hasFreeAI) {
        console.log('💎 Using Free AI services (Gemini priority) for generation...');
        try {
          const freeAIRequest = {
            userLevel: selectedLevel,
            languagePair: {
              learning: languageSettings.learning_language,
              known: languageSettings.known_language
            },
            topic: topic.trim() || undefined,
            count: 10,
            existingWords
          };
          
          console.log('🚀 FreeAI request with level:', freeAIRequest.userLevel);
          
          const freeAIResponse = await FreeAIService.generateWords(freeAIRequest);
          
          if (freeAIResponse.success && freeAIResponse.words.length > 0) {
            const wordsWithoutImages = freeAIResponse.words.map(word => ({
              term: word.term,
              translation: word.translation,
              english: word.english,
              imageUrl: '', // Будет сгенерировано
              example: word.example,
              difficulty: word.difficulty,
              selected: false
            }));
            
            // Генерируем изображения для слов
            generatedWords = await generateImagesForWords(wordsWithoutImages);
            console.log(`✅ Free AI (${freeAIResponse.service}) generated words with images:`, generatedWords.length);
          } else {
            throw new Error(freeAIResponse.error || 'Free AI generation failed');
          }
        } catch (error) {
          console.warn('⚠️ Free AI error, trying ChatGPT as fallback:', error);
          // Fallback to ChatGPT
          if (chatGPTStatus.configured) {
            try {
              const chatGPTRequest = {
                userLevel: selectedLevel,
                languagePair: {
                  learning: languageSettings.learning_language,
                  known: languageSettings.known_language
                },
                topic: topic.trim() || undefined,
                count: 10,
                existingWords
              };
              
              console.log('🤖 ChatGPT request with level:', chatGPTRequest.userLevel);
              
              const chatGPTResponse = await ChatGPTService.generateWords(chatGPTRequest);
              
              if (chatGPTResponse.success && chatGPTResponse.words.length > 0) {
                const wordsWithoutImages = chatGPTResponse.words.map(word => ({
                  term: word.term,
                  translation: word.translation,
                  english: word.english,
                  imageUrl: '', // Будет сгенерировано
                  example: word.example,
                  difficulty: word.difficulty,
                  selected: false
                }));
                
                // Генерируем изображения для слов
                generatedWords = await generateImagesForWords(wordsWithoutImages);
                console.log('✅ ChatGPT generated words with images:', generatedWords.length);
              } else {
                throw new Error(chatGPTResponse.error || 'ChatGPT generation failed');
              }
            } catch (chatGPTError) {
              console.warn('⚠️ ChatGPT error, falling back to local generation:', chatGPTError);
              // Fallback to local generation
              console.log('📚 Fallback local generation with level:', selectedLevel);
              generatedWords = await AIWordGeneratorService.generateWords({
                knownLanguage: languageSettings.known_language,
                learningLanguage: languageSettings.learning_language,
                knownLanguageCode: languageSettings.known_language_code,
                learningLanguageCode: languageSettings.learning_language_code,
                userLevel: selectedLevel,
                existingWords,
                topic: topic.trim() || undefined,
                imageGenerationSettings: imageGenerationSettings
              });
            }
          } else {
            // Fallback to local generation
            console.log('📚 FreeAI fallback local generation with level:', selectedLevel);
            generatedWords = await AIWordGeneratorService.generateWords({
              knownLanguage: languageSettings.known_language,
              learningLanguage: languageSettings.learning_language,
              knownLanguageCode: languageSettings.known_language_code,
              learningLanguageCode: languageSettings.learning_language_code,
              userLevel: selectedLevel,
              existingWords,
              topic: topic.trim() || undefined,
              imageGenerationSettings: imageGenerationSettings
            });
          }
        }
      } else if (chatGPTStatus.configured) {
        console.log('🤖 Using ChatGPT API for generation...');
        try {
          const chatGPTRequest = {
            userLevel: selectedLevel,
            languagePair: {
              learning: languageSettings.learning_language,
              known: languageSettings.known_language
            },
            topic: topic.trim() || undefined,
            count: 10,
            existingWords
          };
          
          console.log('🤖 Main ChatGPT request with level:', chatGPTRequest.userLevel);
          
          const chatGPTResponse = await ChatGPTService.generateWords(chatGPTRequest);
          
          if (chatGPTResponse.success && chatGPTResponse.words.length > 0) {
            const wordsWithoutImages = chatGPTResponse.words.map(word => ({
              term: word.term,
              translation: word.translation,
              english: word.english,
              imageUrl: '', // Будет сгенерировано
              example: word.example,
              difficulty: word.difficulty,
              selected: false
            }));
            
            // Генерируем изображения для слов
            generatedWords = await generateImagesForWords(wordsWithoutImages);
            console.log('✅ ChatGPT generated words with images:', generatedWords.length);
          } else {
            throw new Error(chatGPTResponse.error || 'ChatGPT generation failed');
          }
        } catch (error) {
          console.warn('⚠️ ChatGPT error, falling back to local generation:', error);
          // Fallback to local generation
          console.log('📚 ChatGPT fallback local generation with level:', selectedLevel);
          generatedWords = await AIWordGeneratorService.generateWords({
            knownLanguage: languageSettings.known_language,
            learningLanguage: languageSettings.learning_language,
            knownLanguageCode: languageSettings.known_language_code,
            learningLanguageCode: languageSettings.learning_language_code,
            userLevel: selectedLevel,
            existingWords,
            topic: topic.trim() || undefined,
            imageGenerationSettings: imageGenerationSettings
          });
        }
      } else {
        console.log('📚 Using local generation...');
        console.log('📚 Local generation request with level:', selectedLevel);
        generatedWords = await AIWordGeneratorService.generateWords({
          knownLanguage: languageSettings.known_language,
          learningLanguage: languageSettings.learning_language,
          knownLanguageCode: languageSettings.known_language_code,
          learningLanguageCode: languageSettings.learning_language_code,
          userLevel: selectedLevel,
          existingWords,
          topic: topic.trim() || undefined,
          imageGenerationSettings: imageGenerationSettings
        });
      }

      console.log('✅ Generated words:', generatedWords);
      
      if (generatedWords.length === 0) {
        console.warn('⚠️ No words generated');
        alert('Не удалось сгенерировать новые слова. Попробуйте изменить уровень или языковую пару.');
        return;
      }
      
      // Фильтруем дубликаты - убираем слова, которые уже есть у пользователя или были в предыдущей генерации
      const existingTerms = existingWords.map(term => term.toLowerCase());
      const uniqueWords = generatedWords.filter(word => 
        !existingTerms.includes(word.term.toLowerCase())
      );
      
      console.log(`📊 Generated: ${generatedWords.length}, Unique: ${uniqueWords.length}, Duplicates: ${generatedWords.length - uniqueWords.length}`);
      
      if (uniqueWords.length === 0) {
        console.warn('⚠️ All generated words are duplicates');
        
        // Если это первая попытка, пробуем автоматически с новой темой
        if (currentRetryCount < 2) { // Максимум 2 попытки (всего 3 генерации)
          console.log(`🔄 Auto-retrying with new topic (attempt ${currentRetryCount + 1}/3)`);
          await retryGenerationWithNewTopic(currentRetryCount);
          return;
        } else {
          // Если уже было 3 попытки, показываем сообщение пользователю
          alert('Все сгенерированные слова уже есть в вашей коллекции или были в предыдущей генерации. Попробуйте изменить уровень или тему.');
          setRetryCount(0); // Сбрасываем счетчик попыток
          return;
        }
      }
      
      const wordsWithSelection = uniqueWords.map(word => ({
        ...word,
        selected: true
      }));

      setSuggestions(wordsWithSelection);
      setSelectedCount(wordsWithSelection.length);
      setRetryCount(0); // Сбрасываем счетчик попыток при успешной генерации
      console.log('✅ Words set in state:', wordsWithSelection.length);
      console.log('📊 Words by theme:', wordsWithSelection.map(w => `${w.term} -> ${w.translation}`));
    } catch (error) {
      console.error('Error generating words:', error);
      const errorMessage = error instanceof Error ? error.message : 'Попробуйте позже.';
      alert(`Ошибка генерации слов: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Функция генерации с переданной темой (для повторных попыток)
  const handleGenerateWithRetryCountAndTopic = async (currentRetryCount: number, topicToUse: string) => {
    const now = Date.now();
    const timeSinceLastGeneration = now - lastGenerationTime;
    
    // Защита от множественных одновременных генераций
    if (isGenerating && currentRetryCount === 0) {
      console.log('⏳ Generation already in progress, skipping...');
      return;
    }
    
    // Защита от слишком частых попыток (минимум 1 секунда между попытками)
    if (timeSinceLastGeneration < 1000 && currentRetryCount > 0) {
      console.log('⏳ Too soon since last generation, waiting...');
      setTimeout(() => {
        handleGenerateWithRetryCountAndTopic(currentRetryCount, topicToUse);
      }, 1000 - timeSinceLastGeneration);
      return;
    }
    
    setLastGenerationTime(now);
    console.log('🚀 Starting AI word generation with topic:', topicToUse);
    console.log('Current user:', currentUser);
    console.log('Current settings:', currentSettings);
    console.log('Existing cards count:', existingCards.length);
    
    if (!currentUser) {
      console.error('❌ No current user found');
      alert('Ошибка: не удалось получить данные пользователя');
      return;
    }

    setIsGenerating(true);
    
    try {
      const languageSettings = currentSettings || DatabaseService.getLanguagePair();
      if (!languageSettings) {
        console.error('❌ No language settings found');
        alert('Ошибка: не удалось получить настройки языка');
        return;
      }
      console.log('🌐 Language settings:', languageSettings);
      
      // Получаем существующие слова для проверки дубликатов
      const existingWordsFromDB = existingCards.map(card => card.term);
      const previousGeneratedWords = suggestions.map(suggestion => suggestion.term);
      const existingWords = [...existingWordsFromDB, ...previousGeneratedWords];
      
      console.log('📊 Existing words count:', existingWords.length);
      console.log('📊 Previous generated words:', previousGeneratedWords.length);
      
      let generatedWords: WordSuggestion[] = [];
      
      // Проверяем доступность Free AI сервисов
      const freeAIStatus = FreeAIService.getServicesStatus();
      const chatGPTStatus = ChatGPTService.getApiStatus();
      
      console.log('🔍 Free AI services status:', freeAIStatus);
      console.log('🔍 ChatGPT status:', chatGPTStatus);
      
      // Проверяем, есть ли хотя бы один настроенный Free AI сервис
      const hasConfiguredFreeAI = Object.values(freeAIStatus).some(status => status.configured);
      
      if (hasConfiguredFreeAI) {
        console.log('💎 Using Free AI services (Gemini priority) for generation...');
        try {
          const freeAIRequest = {
            userLevel: selectedLevel,
            languagePair: {
              learning: languageSettings.learning_language,
              known: languageSettings.known_language
            },
            count: 10,
            existingWords,
            topic: topicToUse.trim() || undefined
          };
          console.log('🚀 FreeAI request with level:', freeAIRequest.userLevel);
          console.log('🚀 FreeAI request with topic:', freeAIRequest.topic);
          
          const freeAIResponse = await FreeAIService.generateWords(freeAIRequest);
          generatedWords = freeAIResponse.words.map(word => ({
            ...word,
            selected: true
          }));
          console.log('✅ FreeAI generated words:', generatedWords.length);
        } catch (freeAIError) {
          console.warn('⚠️ FreeAI error, trying ChatGPT:', freeAIError);
          if (chatGPTStatus.configured) {
            try {
              const chatGPTRequest = {
                userLevel: selectedLevel,
                languagePair: {
                  learning: languageSettings.learning_language,
                  known: languageSettings.known_language
                },
                count: 10,
                existingWords,
                topic: topicToUse.trim() || undefined
              };
              console.log('🤖 ChatGPT request with level:', chatGPTRequest.userLevel);
              console.log('🤖 ChatGPT request with topic:', chatGPTRequest.topic);
              
              const chatGPTResponse = await ChatGPTService.generateWords(chatGPTRequest);
              generatedWords = chatGPTResponse.words.map(word => ({
                ...word,
                selected: true
              }));
              console.log('✅ ChatGPT generated words:', generatedWords.length);
            } catch (chatGPTError) {
              console.warn('⚠️ ChatGPT error, falling back to local generation:', chatGPTError);
              // Fallback to local generation
              console.log('📚 Fallback local generation with level:', selectedLevel);
              const localWords = await AIWordGeneratorService.generateWords({
                knownLanguage: languageSettings.known_language,
                learningLanguage: languageSettings.learning_language,
                knownLanguageCode: languageSettings.known_language_code,
                learningLanguageCode: languageSettings.learning_language_code,
                userLevel: selectedLevel,
                existingWords,
                topic: topicToUse.trim() || undefined,
                imageGenerationSettings: imageGenerationSettings
              });
              generatedWords = localWords.map(word => ({
                ...word,
                selected: true
              }));
            }
          } else {
            // Fallback to local generation
            console.log('📚 FreeAI fallback local generation with level:', selectedLevel);
            const localWords = await AIWordGeneratorService.generateWords({
              knownLanguage: languageSettings.known_language,
              learningLanguage: languageSettings.learning_language,
              knownLanguageCode: languageSettings.known_language_code,
              learningLanguageCode: languageSettings.learning_language_code,
              userLevel: selectedLevel,
              existingWords,
              topic: topicToUse.trim() || undefined,
              imageGenerationSettings: imageGenerationSettings
            });
            generatedWords = localWords.map(word => ({
              ...word,
              selected: true
            }));
          }
        }
      } else if (chatGPTStatus.configured) {
        console.log('🤖 Using ChatGPT API for generation...');
        try {
          const chatGPTRequest = {
            userLevel: selectedLevel,
            languagePair: {
              learning: languageSettings.learning_language,
              known: languageSettings.known_language
            },
            count: 10,
            existingWords,
            topic: topicToUse.trim() || undefined
          };
          console.log('🤖 ChatGPT request with level:', chatGPTRequest.userLevel);
          console.log('🤖 ChatGPT request with topic:', chatGPTRequest.topic);
          
          const chatGPTResponse = await ChatGPTService.generateWords(chatGPTRequest);
          generatedWords = chatGPTResponse.words.map(word => ({
            ...word,
            selected: true
          }));
          console.log('✅ ChatGPT generated words:', generatedWords.length);
        } catch (error) {
          console.warn('⚠️ ChatGPT error, falling back to local generation:', error);
          // Fallback to local generation
          console.log('📚 ChatGPT fallback local generation with level:', selectedLevel);
          const localWords = await AIWordGeneratorService.generateWords({
            knownLanguage: languageSettings.known_language,
            learningLanguage: languageSettings.learning_language,
            knownLanguageCode: languageSettings.known_language_code,
            learningLanguageCode: languageSettings.learning_language_code,
            userLevel: selectedLevel,
            existingWords,
            topic: topicToUse.trim() || undefined,
            imageGenerationSettings: imageGenerationSettings
          });
          generatedWords = localWords.map(word => ({
            ...word,
            selected: true
          }));
        }
      } else {
        console.log('📚 Using local generation...');
        console.log('📚 Local generation request with level:', selectedLevel);
        const localWords = await AIWordGeneratorService.generateWords({
          knownLanguage: languageSettings.known_language,
          learningLanguage: languageSettings.learning_language,
          knownLanguageCode: languageSettings.known_language_code,
          learningLanguageCode: languageSettings.learning_language_code,
          userLevel: selectedLevel,
          existingWords,
          topic: topicToUse.trim() || undefined,
          imageGenerationSettings: imageGenerationSettings
        });
        generatedWords = localWords.map(word => ({
          ...word,
          selected: true
        }));
      }

      console.log('✅ Generated words:', generatedWords);
      
      if (generatedWords.length === 0) {
        console.warn('⚠️ No words generated');
        alert('Не удалось сгенерировать новые слова. Попробуйте изменить уровень или языковую пару.');
        return;
      }
      
      // Фильтруем дубликаты - убираем слова, которые уже есть у пользователя или были в предыдущей генерации
      const existingTerms = existingWords.map(term => term.toLowerCase());
      const uniqueWords = generatedWords.filter(word => 
        !existingTerms.includes(word.term.toLowerCase())
      );
      
      console.log(`📊 Generated: ${generatedWords.length}, Unique: ${uniqueWords.length}, Duplicates: ${generatedWords.length - uniqueWords.length}`);
      
      if (uniqueWords.length === 0) {
        console.warn('⚠️ All generated words are duplicates');
        
        // Если это первая попытка, пробуем автоматически с новой темой
        if (currentRetryCount < 2) { // Максимум 2 попытки (всего 3 генерации)
          console.log(`🔄 Auto-retrying with new topic (attempt ${currentRetryCount + 1}/3)`);
          await retryGenerationWithNewTopic(currentRetryCount);
          return;
        } else {
          // Если уже было 3 попытки, показываем сообщение пользователю
          alert('Все сгенерированные слова уже есть в вашей коллекции или были в предыдущей генерации. Попробуйте изменить уровень или тему.');
          setRetryCount(0); // Сбрасываем счетчик попыток
          return;
        }
      }
      
      const wordsWithSelection = uniqueWords.map(word => ({
        ...word,
        selected: true
      }));

      setSuggestions(wordsWithSelection);
      setSelectedCount(wordsWithSelection.length);
      setRetryCount(0); // Сбрасываем счетчик попыток при успешной генерации
      console.log('✅ Words set in state:', wordsWithSelection.length);
      console.log('📊 Words by theme:', wordsWithSelection.map(w => `${w.term} -> ${w.translation}`));
    } catch (error) {
      console.error('Error generating words:', error);
      const errorMessage = error instanceof Error ? error.message : 'Попробуйте позже.';
      alert(`Ошибка генерации слов: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Обычная функция генерации для вызова из UI
  const handleGenerate = async () => {
    setRetryCount(0); // Сбрасываем счетчик при новой генерации
    await handleGenerateWithRetryCount(0);
  };

  const toggleWordSelection = (index: number) => {
    const newSuggestions = [...suggestions];
    newSuggestions[index].selected = !newSuggestions[index].selected;
    setSuggestions(newSuggestions);
    setSelectedCount(newSuggestions.filter(s => s.selected).length);
  };

  const handleSave = () => {
    console.log('💾 Starting to save words...');
    const selectedWords = suggestions.filter(s => s.selected);
    console.log('Selected words for saving:', selectedWords);
    
    if (selectedWords.length === 0) {
      console.warn('⚠️ No words selected');
      alert('Выберите хотя бы одно слово для добавления');
      return;
    }

    // Проверяем дубликаты перед сохранением
    const existingTerms = existingCards.map(card => card.term.toLowerCase());
    const uniqueWords = selectedWords.filter(word => 
      !existingTerms.includes(word.term.toLowerCase())
    );
    
    console.log('🔍 Duplicate check:');
    console.log('  - Existing cards count:', existingCards.length);
    console.log('  - Existing terms:', existingTerms);
    console.log('  - Selected words:', selectedWords.map(w => w.term));
    console.log(`📊 Selected: ${selectedWords.length}, Unique: ${uniqueWords.length}, Duplicates: ${selectedWords.length - uniqueWords.length}`);
    
    if (uniqueWords.length === 0) {
      alert('Все выбранные слова уже есть в вашей коллекции.');
      return;
    }

    // Get current language pair settings
    const settings = UserService.getUserSettings() || DatabaseService.getLanguagePair();
    console.log('Settings for language pair:', settings);
    const languagePairId = settings ? DatabaseService.generateLanguagePairId(
      settings.known_language_code,
      settings.learning_language_code
    ) : 'ru-es';
    console.log('Generated language pair ID:', languagePairId);

    const cards: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>[] = uniqueWords.map(word => ({
      term: word.term,
      translation: word.translation,
      english: word.english,
      imageUrl: word.imageUrl,
      progress: 0,
      state: CardState.LEARN,
      dueAt: new Date(),
      reviewCount: 0,
      successfulReviews: 0,
      direction: ReviewDirection.KNOWN_TO_LEARNING,
      languagePairId,
      easeFactor: 2.5,
      intervalDays: 0
    }));

    console.log('Cards to save:', cards);
    
    try {
      onSave(cards);
      console.log('✅ Cards sent to onSave callback successfully');
      
      // Показываем успешное сообщение с деталями
      const duplicateCount = selectedWords.length - uniqueWords.length;
      let message = `🎉 Успешно добавлено ${uniqueWords.length} новых слов!`;
      
      if (duplicateCount > 0) {
        message += `\n\n⏭️ Пропущено ${duplicateCount} дубликатов`;
      }
      
      message += `\n\nУровень: ${selectedLevel}`;
      alert(message);
    } catch (error) {
      console.error('❌ Error saving cards:', error);
      alert('Ошибка при сохранении слов. Попробуйте еще раз.');
      return;
    }
    
    console.log('✅ Cards sent to onSave callback');
    onClose();
    setSuggestions([]);
    setSelectedCount(0);
    setRetryCount(0); // Сбрасываем счетчик попыток при закрытии
    setIsRetrying(false); // Сбрасываем флаг повторной генерации
  };

  const selectAll = () => {
    const newSuggestions = suggestions.map(s => ({ ...s, selected: true }));
    setSuggestions(newSuggestions);
    setSelectedCount(newSuggestions.length);
  };

  const deselectAll = () => {
    const newSuggestions = suggestions.map(s => ({ ...s, selected: false }));
    setSuggestions(newSuggestions);
    setSelectedCount(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              ИИ помощник
            </h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setShowAIStatus(true)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Статус AI сервисов"
            >
              <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setShowImageSettings(true)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Настройки генерации изображений"
            >
              <Image className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {/* Level Selection */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-3">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="font-medium text-gray-900 text-sm sm:text-base">
                Уровень
              </span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="ml-auto p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="A1">A1 - Начальный</option>
                <option value="A2">A2 - Элементарный</option>
                <option value="B1">B1 - Средний</option>
                <option value="B2">B2 - Средне-продвинутый</option>
                <option value="C1">C1 - Продвинутый</option>
                <option value="C2">C2 - Владение</option>
              </select>
            </div>
          </div>

          {/* Topic Input */}
          {suggestions.length === 0 && (
            <div className="mb-3 sm:mb-4">
              <label htmlFor="topic-input" className="block text-sm font-medium text-gray-700 mb-2">
                Тема слов (необязательно)
              </label>
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: еда, животные, путешествия, работа..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Укажите тему для генерации слов по конкретной области. Если оставить пустым, будут сгенерированы слова общего уровня.
              </p>
              <div className="mt-2">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsTopicsCollapsed(!isTopicsCollapsed)}
                >
                  <p className="text-xs text-gray-600 font-medium">Доступные темы:</p>
                  <div className={`transform transition-transform ${isTopicsCollapsed ? 'rotate-180' : ''}`}>
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {!isTopicsCollapsed && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {AIWordGeneratorService.getAvailableTopics().map(topicName => (
                      <button
                        key={topicName}
                        onClick={() => setTopic(topicName)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        title={AIWordGeneratorService.getTopicDescription(topicName)}
                      >
                        {topicName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generate Button */}
          {suggestions.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 sm:py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Генерируем слова...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {topic.trim() 
                    ? `Добавить слова по теме "${topic.trim()}"` 
                    : 'Добавить слова с помощью ИИ'
                  }
                </>
              )}
            </button>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {topic.trim() 
                    ? `Подбираем слова по теме "${topic.trim()}" для уровня ${selectedLevel}...`
                    : `Подбираем слова для уровня ${selectedLevel}...`
                  }
                  {retryCount > 0 && (
                    <span className="text-blue-600 ml-2">
                      (попытка {retryCount + 1})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Generated Words */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Выбрано: <span className="font-medium text-blue-600">{selectedCount}</span> из {suggestions.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Все
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Ничего
                  </button>
                </div>
              </div>

              {/* Words List */}
              <div className="max-h-40 sm:max-h-60 overflow-y-auto space-y-2">
                {suggestions.map((word, index) => (
                  <div
                    key={index}
                    onClick={() => toggleWordSelection(index)}
                    className={`p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      word.selected
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{word.term}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-blue-600">{word.translation}</span>
                        </div>
                        {word.example && (
                          <div className="text-xs text-gray-500 italic">
                            {word.example}
                          </div>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        word.selected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {word.selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Topic Display */}
              {topic.trim() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-800">Тема:</span>
                    <span className="text-sm text-blue-700">"{topic.trim()}"</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Сгенерировать заново
                </button>
                <button
                  onClick={handleSave}
                  disabled={selectedCount === 0 || isGenerating}
                  className="flex-1 px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить ({selectedCount})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image API Setup Modal */}
      <ImageApiSetupModal
        isOpen={showApiSetup}
        onClose={() => setShowApiSetup(false)}
      />

      {/* AI Status Modal */}
      <AIStatusModal
        isOpen={showAIStatus}
        onClose={() => setShowAIStatus(false)}
      />

      {/* Image Generation Settings Modal */}
      <ImageGenerationSettingsModal
        isOpen={showImageSettings}
        onClose={() => setShowImageSettings(false)}
        onSave={(settings) => {
          console.log('Image generation settings saved:', settings);
          setImageGenerationSettings(settings);
          // Сохраняем настройки в localStorage
          localStorage.setItem('imageGenerationSettings', JSON.stringify(settings));
        }}
        currentSettings={imageGenerationSettings}
      />
    </div>
  );
};
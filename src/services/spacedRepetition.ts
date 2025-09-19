import { Card, CardState, ReviewResult, ReviewDirection, DisplayMode } from '../types';
import { CardDisplayConfigUtils } from '../config/cardDisplayConfig';

export class SpacedRepetitionService {
  // Фиксированный график повторений согласно спецификации
  private static REVIEW_INTERVALS = [
    { minutes: 1 },      // 1-й успешный ответ
    { minutes: 10 },     // 2-й успешный ответ  
    { minutes: 30 },     // 3-й успешный ответ
    { hours: 24 },       // 4-й успешный ответ
    { days: 7 },         // 5-й успешный ответ
    { days: 24 }         // 6-й успешный ответ
  ];

  static processReview(card: Card, result: ReviewResult): Card {
    const updatedCard = { ...card };
    const now = new Date();

    if (result.correct) {
      // Успешный ответ: используем настраиваемое увеличение прогресса
      const progressIncrease = CardDisplayConfigUtils.getProgressIncrease();
      updatedCard.progress = Math.min(100, card.progress + progressIncrease);
      updatedCard.successfulReviews += 1;
      updatedCard.reviewCount += 1;
      updatedCard.lastReviewedAt = now;
      updatedCard.updatedAt = now;

      // Определяем следующий интервал по настраиваемому графику
      const nextInterval = CardDisplayConfigUtils.getNextReviewInterval(updatedCard.successfulReviews);
      
      // Используем полноценную систему интервальных повторений
      updatedCard.dueAt = this.addInterval(now, nextInterval);
      
      console.log(`✅ SpacedRepetitionService: Card "${updatedCard.term}" correct answer, progress=${updatedCard.progress} (+${progressIncrease}%), successfulReviews=${updatedCard.successfulReviews}, next interval=${JSON.stringify(nextInterval)}, dueAt=${updatedCard.dueAt}`);

    } else {
      // Неуспешный ответ: используем настраиваемое уменьшение прогресса
      const progressDecrease = CardDisplayConfigUtils.getProgressDecrease();
      updatedCard.progress = Math.max(0, card.progress - progressDecrease);
      updatedCard.reviewCount += 1;
      updatedCard.lastReviewedAt = now;
      updatedCard.updatedAt = now;

      // При ошибке сбрасываем счетчик успешных повторений для более щадящего режима
      const resetThreshold = CardDisplayConfigUtils.getResetSuccessfulReviewsThreshold();
      if (updatedCard.progress < resetThreshold) {
        updatedCard.successfulReviews = Math.max(0, updatedCard.successfulReviews - 1);
      }
      
      // Неправильный ответ - используем настраиваемую задержку из конфигурации
      const incorrectAnswerDelay = CardDisplayConfigUtils.getIncorrectAnswerDelay();
      updatedCard.dueAt = new Date(now.getTime() + incorrectAnswerDelay);
      
      console.log(`❌ SpacedRepetitionService: Card "${updatedCard.term}" incorrect answer, progress=${updatedCard.progress} (-${progressDecrease}%), successfulReviews=${updatedCard.successfulReviews}, resetThreshold=${resetThreshold}%, delay=${incorrectAnswerDelay}ms, dueAt=${updatedCard.dueAt}`);
    }

    // Обновляем состояние карточки на основе прогресса и времени до повторения
    updatedCard.state = this.getCardState(updatedCard.progress, updatedCard.dueAt);
    
    return updatedCard;
  }

  static getDisplayMode(card: Card): DisplayMode {
    const progress = card.progress;
    const successfulReviews = card.successfulReviews;
    
    // Режимы показа согласно обновленной спецификации
    if (progress < 20) {
      return DisplayMode.DEMONSTRATION; // 0-19: Демонстрация
    } else if (progress < 30) {
      return DisplayMode.WORD; // 20-29: Слово (перевод по тапу)
    } else if (progress < 50) {
      // 30-49: чередование "Слово" и "Перевод"
      return card.reviewCount % 2 === 0 ? DisplayMode.WORD : DisplayMode.TRANSLATION;
    } else if (progress < 70) {
      // 50-69: чередование "Перевод" и "Перевод к слову"
      return card.reviewCount % 2 === 0 ? DisplayMode.TRANSLATION : DisplayMode.TRANSLATION_TO_WORD;
    } else {
      // ≥70: "Перевод к слову"
      return DisplayMode.TRANSLATION_TO_WORD;
    }
  }

  static shouldUseInputMode(card: Card): boolean {
    // Ввод слова активируется при прогрессе ≥50% (режим TRANSLATION_TO_WORD)
    return card.progress >= 50;
  }

  static getReviewDirection(card: Card): ReviewDirection {
    const progress = card.progress;
    
    // Увеличиваем долю L→K с ростом прогресса
    if (progress >= 80) {
      // При прогрессе ≥80: 50% показов в обратном направлении
      return Math.random() < 0.5 ? ReviewDirection.LEARNING_TO_KNOWN : ReviewDirection.KNOWN_TO_LEARNING;
    } else if (progress >= 60) {
      // При прогрессе 60-79: 30% показов в обратном направлении
      return Math.random() < 0.3 ? ReviewDirection.LEARNING_TO_KNOWN : ReviewDirection.KNOWN_TO_LEARNING;
    }
    
    // По умолчанию K→L (из "Знаю язык" к "Учу язык")
    return ReviewDirection.KNOWN_TO_LEARNING;
  }


  private static addInterval(date: Date, interval: any): Date {
    const newDate = new Date(date);
    
    if (interval.minutes) {
      newDate.setMinutes(newDate.getMinutes() + interval.minutes);
    } else if (interval.hours) {
      newDate.setHours(newDate.getHours() + interval.hours);
    } else if (interval.days) {
      newDate.setDate(newDate.getDate() + interval.days);
    }
    
    return newDate;
  }

  private static getCardState(progress: number, dueAt: Date): CardState {
    const now = new Date();
    
    // Если карточка просрочена (dueAt <= now), она должна быть изучена
    if (dueAt <= now) {
      return CardState.LEARN; // Учить (просроченные карточки)
    }
    
    // Если карточка не просрочена, определяем по прогрессу
    if (progress >= 10 && progress < 70) {
      return CardState.REVIEW; // Знаю (прогресс 10-69%, интервал не подошел)
    }
    
    return CardState.SUSPENDED; // Выучено (прогресс 70-100%)
  }

  static updateCardStateBasedOnDueTime(card: Card): Card {
    const now = new Date();
    const updatedCard = { ...card };
    
    // Определяем статус по прогрессу и времени до повторения
    updatedCard.state = this.getCardState(card.progress, card.dueAt);
    
    return updatedCard;
  }

  static getDueCards(cards: Card[]): Card[] {
    const now = new Date();
    console.log('🔍 SpacedRepetitionService: getDueCards called with', cards.length, 'cards');
    console.log('🔍 SpacedRepetitionService: Current time:', now);
    
    const dueCards = cards
      .filter(card => {
        // Карточка готова к показу если время пришло (dueAt <= now)
        const isDue = card.dueAt <= now;
        console.log(`🔍 Card "${card.term}": dueAt=${card.dueAt}, progress=${card.progress}, isDue=${isDue}`);
        return isDue;
      })
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
    
    console.log('🔍 SpacedRepetitionService: Found', dueCards.length, 'due cards');
    return dueCards;
  }

  // Get cards from a lesson in order for first-time learning
  static getLessonCardsInOrder(cards: Card[], lessonId: string): Card[] {
    console.log('📚 SpacedRepetitionService: getLessonCardsInOrder called for lesson:', lessonId);
    
    // Filter cards from the specific lesson that have lesson_order
    const lessonCards = cards.filter(card => 
      (card as any).lessonId === lessonId && 
      (card as any).lessonOrder !== null && 
      (card as any).lessonOrder !== undefined
    );
    
    // Sort by lesson_order
    const orderedCards = lessonCards.sort((a, b) => 
      ((a as any).lessonOrder || 0) - ((b as any).lessonOrder || 0)
    );
    
    console.log(`📚 SpacedRepetitionService: Found ${orderedCards.length} cards for lesson ${lessonId}`);
    return orderedCards;
  }

  // Get next card to show - prioritize lesson order for new lessons, then spaced repetition
  static getNextCardToShow(cards: Card[], currentLessonId?: string): Card | null {
    console.log('🎯 SpacedRepetitionService: getNextCardToShow called');
    
    // If we have a current lesson, check if there are new cards from that lesson
    if (currentLessonId) {
      const lessonCards = this.getLessonCardsInOrder(cards, currentLessonId);
      
      // Find the first card from the lesson that hasn't been reviewed yet (progress = 0)
      const newLessonCard = lessonCards.find(card => card.progress === 0);
      
      if (newLessonCard) {
        console.log('🎯 SpacedRepetitionService: Showing new lesson card:', newLessonCard.term);
        return newLessonCard;
      }
    }
    
    // Otherwise, use the normal spaced repetition logic
    const dueCards = this.getDueCards(cards);
    
    if (dueCards.length > 0) {
      // Sort by due time (earliest first)
      const sortedDueCards = dueCards.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
      console.log('🎯 SpacedRepetitionService: Showing due card:', sortedDueCards[0].term);
      
      // Clear currentLessonId if we're showing non-lesson cards
      const currentLessonId = localStorage.getItem('currentLessonId');
      if (currentLessonId && !(sortedDueCards[0] as any).lessonId) {
        console.log('🎯 SpacedRepetitionService: Showing non-lesson card, clearing currentLessonId');
        localStorage.removeItem('currentLessonId');
      }
      
      return sortedDueCards[0];
    }
    
    console.log('🎯 SpacedRepetitionService: No cards to show');
    return null;
  }

  static getNextDueCard(cards: Card[]): Card | null {
    const now = new Date();
    const futureCards = cards
      .filter(card => card.dueAt > now)
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
    
    return futureCards.length > 0 ? futureCards[0] : null;
  }

  // Вспомогательный метод для определения поддерживающего режима при ошибках
  static getSupportiveMode(progress: number): DisplayMode {
    if (progress < 20) {
      return DisplayMode.DEMONSTRATION;
    }
    return DisplayMode.WORD;
  }

  // Метод для получения времени до следующей карточки в удобном формате
  static getTimeUntilNext(nextCard: Card | null): string {
    if (!nextCard) return '';
    
    const now = new Date();
    const diff = nextCard.dueAt.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `через ${days}д`;
    if (hours > 0) return `через ${hours}ч`;
    if (minutes > 0) return `через ${minutes}м`;
    return 'сейчас';
  }

  // Проверка на дубликаты в языковой паре
  static checkForDuplicates(cards: Card[], newTerm: string, newTranslation: string, languagePairId: string): Card | null {
    return cards.find(card => 
      card.languagePairId === languagePairId &&
      (card.term.toLowerCase() === newTerm.toLowerCase() || 
       card.translation.toLowerCase() === newTranslation.toLowerCase())
    ) || null;
  }
}
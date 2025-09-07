import { Card, CardState, ReviewResult, ReviewDirection, DisplayMode } from '../types';

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
      // Успешный ответ: +10 к прогрессу
      updatedCard.progress = Math.min(100, card.progress + 10);
      updatedCard.successfulReviews += 1;
      updatedCard.reviewCount += 1;
      updatedCard.lastReviewedAt = now;
      updatedCard.updatedAt = now;

      // Определяем следующий интервал по фиксированному графику
      const nextInterval = this.getNextInterval(updatedCard.successfulReviews);
      updatedCard.dueAt = this.addInterval(now, nextInterval);

    } else {
      // Неуспешный ответ: -20 к прогрессу, возврат через 1 минуту
      updatedCard.progress = Math.max(0, card.progress - 20);
      updatedCard.reviewCount += 1;
      updatedCard.lastReviewedAt = now;
      updatedCard.updatedAt = now;

      // Возврат через 1 минуту для неправильных ответов
      updatedCard.dueAt = new Date(now.getTime() + 60 * 1000);
      
      // При ошибке сбрасываем счетчик успешных повторений для более щадящего режима
      if (updatedCard.progress < 40) {
        updatedCard.successfulReviews = Math.max(0, updatedCard.successfulReviews - 1);
      }
    }

    // Обновляем состояние карточки на основе прогресса
    updatedCard.state = this.getCardState(updatedCard.progress);
    
    return updatedCard;
  }

  static getDisplayMode(card: Card): DisplayMode {
    const progress = card.progress;
    const successfulReviews = card.successfulReviews;
    
    // Режимы показа согласно спецификации
    if (progress < 40) {
      return DisplayMode.DEMONSTRATION; // 0-39: Демонстрация
    } else if (progress < 60) {
      return DisplayMode.WORD; // 40-59: Слово (перевод по тапу)
    } else if (progress < 90) {
      // 60-89: чередование "Слово" и "Перевод"
      return card.reviewCount % 2 === 0 ? DisplayMode.WORD : DisplayMode.TRANSLATION;
    } else {
      // ≥90: чередование "Перевод" и "Ввод слова"
      return card.reviewCount % 2 === 0 ? DisplayMode.TRANSLATION : DisplayMode.INPUT;
    }
  }

  static shouldUseInputMode(card: Card): boolean {
    // Ввод слова активируется с 4-го показа (после 3 успешных ответов)
    // или при прогрессе > 30 согласно спецификации
    return card.successfulReviews >= 3 || card.progress > 30;
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

  private static getNextInterval(successfulReviews: number): any {
    // Используем фиксированный график из спецификации
    const index = Math.min(successfulReviews - 1, this.REVIEW_INTERVALS.length - 1);
    
    if (index < 0) {
      // Для первого показа
      return { minutes: 1 };
    }
    
    return this.REVIEW_INTERVALS[index];
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

  private static getCardState(progress: number): CardState {
    // Переходы состояний согласно спецификации
    if (progress < 60) return CardState.LEARN;    // 0-59: Учить
    if (progress < 90) return CardState.KNOW;     // 60-89: Знаю
    return CardState.MASTERED;                    // 90-100: Выучено
  }

  static updateCardStateBasedOnDueTime(card: Card): Card {
    const now = new Date();
    const updatedCard = { ...card };
    
    // Если у карточки есть время до показа (dueAt > now), она имеет статус "Знаю"
    if (card.dueAt > now && card.progress >= 10) {
      updatedCard.state = CardState.KNOW;
    } else if (card.dueAt <= now) {
      // Если карточка готова к показу, определяем статус по прогрессу
      updatedCard.state = this.getCardState(card.progress);
    }
    
    return updatedCard;
  }

  static getDueCards(cards: Card[]): Card[] {
    const now = new Date();
    return cards
      .filter(card => card.dueAt <= now)
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
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
    if (progress < 40) {
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
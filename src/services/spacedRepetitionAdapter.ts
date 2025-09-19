// Временный адаптер для совместимости SpacedRepetitionService с новой схемой
import { UserCardWithContent, LegacyCard, DisplayMode, ReviewDirection } from '../types';
import { SpacedRepetitionService } from './spacedRepetition';

export class SpacedRepetitionAdapter {
  // Конвертируем UserCardWithContent в LegacyCard для SpacedRepetitionService
  private static userCardToCard(userCard: UserCardWithContent): LegacyCard {
    console.log('🔍 SpacedRepetitionAdapter: Converting userCard to card:', {
      cardId: userCard.cardId,
      term: userCard.term,
      translation: userCard.translation,
      progress: userCard.progress
    });
    
    return {
      id: userCard.cardId.toString(),
      languagePairId: userCard.languagePairId,
      term: userCard.term,
      translation: userCard.translation,
      imageUrl: userCard.imageUrl,
      progress: userCard.progress,
      state: userCard.state,
      dueAt: userCard.dueAt,
      reviewCount: userCard.reviewCount,
      successfulReviews: userCard.successfulReviews,
      direction: userCard.direction,
      createdAt: userCard.createdAt,
      updatedAt: userCard.updatedAt,
      lastReviewedAt: userCard.lastReviewedAt,
      easeFactor: userCard.easeFactor,
      intervalDays: userCard.intervalDays,
      lessonId: userCard.lessonId,
      lessonOrder: userCard.lessonOrder
    };
  }

  // Конвертируем LegacyCard обратно в UserCardWithContent
  private static cardToUserCard(card: LegacyCard, userCard: UserCardWithContent): UserCardWithContent {
    return {
      ...userCard,
      cardId: parseInt(card.id),
      progress: card.progress,
      state: card.state,
      dueAt: card.dueAt,
      reviewCount: card.reviewCount,
      successfulReviews: card.successfulReviews,
      direction: card.direction,
      updatedAt: card.updatedAt,
      lastReviewedAt: card.lastReviewedAt,
      easeFactor: card.easeFactor,
      intervalDays: card.intervalDays
    };
  }

  // Адаптированные методы
  static getDueCards(userCards: UserCardWithContent[]): UserCardWithContent[] {
    const cards = userCards.map(this.userCardToCard);
    const dueCards = SpacedRepetitionService.getDueCards(cards);
    
    return dueCards.map(dueCard => {
      const originalUserCard = userCards.find(uc => uc.cardId.toString() === dueCard.id);
      return originalUserCard ? this.cardToUserCard(dueCard, originalUserCard) : userCards[0];
    });
  }

  static getNextDueCard(userCards: UserCardWithContent[]): UserCardWithContent | null {
    const cards = userCards.map(this.userCardToCard);
    const nextCard = SpacedRepetitionService.getNextDueCard(cards);
    
    if (!nextCard) return null;
    
    const originalUserCard = userCards.find(uc => uc.cardId.toString() === nextCard.id);
    return originalUserCard ? this.cardToUserCard(nextCard, originalUserCard) : null;
  }

  static getTimeUntilNext(userCard: UserCardWithContent): string {
    const card = this.userCardToCard(userCard);
    return SpacedRepetitionService.getTimeUntilNext(card);
  }

  static processReview(userCard: UserCardWithContent, result: any): UserCardWithContent {
    const card = this.userCardToCard(userCard);
    const updatedCard = SpacedRepetitionService.processReview(card, result);
    return this.cardToUserCard(updatedCard, userCard);
  }

  static checkForDuplicates(userCards: UserCardWithContent[], newTerm: string, newTranslation: string, languagePairId: string): UserCardWithContent | null {
    const cards = userCards.map(this.userCardToCard);
    const duplicate = SpacedRepetitionService.checkForDuplicates(cards, newTerm, newTranslation, languagePairId);
    
    if (!duplicate) return null;
    
    const originalUserCard = userCards.find(uc => uc.cardId.toString() === duplicate.id);
    return originalUserCard || null;
  }

  static getDisplayMode(userCard: UserCardWithContent): DisplayMode {
    const card = this.userCardToCard(userCard);
    return SpacedRepetitionService.getDisplayMode(card);
  }

  static getReviewDirection(userCard: UserCardWithContent): ReviewDirection {
    const card = this.userCardToCard(userCard);
    return SpacedRepetitionService.getReviewDirection(card);
  }

  static getNextCardToShow(userCards: UserCardWithContent[], currentLessonId?: string): UserCardWithContent | null {
    const cards = userCards.map(this.userCardToCard);
    const nextCard = SpacedRepetitionService.getNextCardToShow(cards, currentLessonId);
    
    if (!nextCard) return null;
    
    const originalUserCard = userCards.find(uc => uc.cardId.toString() === nextCard.id);
    return originalUserCard ? this.cardToUserCard(nextCard, originalUserCard) : null;
  }
}

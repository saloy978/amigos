import { createClient } from '@supabase/supabase-js';
import { Card, CardState, ReviewDirection } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export class CardService {
  // Get all cards for current user
  static async getUserCards(): Promise<Card[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapDatabaseToCard);
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
  }

  // Create new card
  static async createCard(cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<Card> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const dbCard = {
        user_id: user.id,
        language_pair_id: cardData.languagePairId,
        term: cardData.term,
        translation: cardData.translation,
        image_url: cardData.imageUrl || null,
        progress: cardData.progress,
        state: cardData.state,
        due_at: cardData.dueAt.toISOString(),
        review_count: cardData.reviewCount,
        successful_reviews: cardData.successfulReviews,
        direction: cardData.direction,
        ease_factor: cardData.easeFactor,
        interval_days: cardData.intervalDays,
        last_reviewed_at: cardData.lastReviewedAt?.toISOString() || null
      };

      const { data, error } = await supabase
        .from('cards')
        .insert([dbCard])
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseToCard(data);
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  // Update existing card
  static async updateCard(card: Card): Promise<Card> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const dbCard = {
        term: card.term,
        translation: card.translation,
        image_url: card.imageUrl || null,
        progress: card.progress,
        state: card.state,
        due_at: card.dueAt.toISOString(),
        review_count: card.reviewCount,
        successful_reviews: card.successfulReviews,
        direction: card.direction,
        ease_factor: card.easeFactor,
        interval_days: card.intervalDays,
        last_reviewed_at: card.lastReviewedAt?.toISOString() || null
      };

      const { data, error } = await supabase
        .from('cards')
        .update(dbCard)
        .eq('id', card.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseToCard(data);
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  }

  // Delete card
  static async deleteCard(cardId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  }

  // Get cards for specific language pair
  static async getCardsForLanguagePair(languagePairId: string): Promise<Card[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_pair_id', languagePairId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapDatabaseToCard);
    } catch (error) {
      console.error('Error fetching cards for language pair:', error);
      return [];
    }
  }

  // Map database record to Card type
  private static mapDatabaseToCard(dbCard: any): Card {
    return {
      id: dbCard.id,
      term: dbCard.term,
      translation: dbCard.translation,
      imageUrl: dbCard.image_url,
      progress: dbCard.progress,
      state: dbCard.state as CardState,
      dueAt: new Date(dbCard.due_at),
      reviewCount: dbCard.review_count,
      successfulReviews: dbCard.successful_reviews,
      direction: dbCard.direction as ReviewDirection,
      languagePairId: dbCard.language_pair_id,
      easeFactor: parseFloat(dbCard.ease_factor),
      intervalDays: dbCard.interval_days,
      lastReviewedAt: dbCard.last_reviewed_at ? new Date(dbCard.last_reviewed_at) : undefined,
      createdAt: new Date(dbCard.created_at),
      updatedAt: new Date(dbCard.updated_at)
    };
  }

  // Check for duplicates
  static async checkForDuplicates(term: string, translation: string, languagePairId: string): Promise<Card | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_pair_id', languagePairId)
        .or(`term.ilike.${term},translation.ilike.${translation}`)
        .limit(1);

      if (error) throw error;

      return data.length > 0 ? this.mapDatabaseToCard(data[0]) : null;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return null;
    }
  }
}
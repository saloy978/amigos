import { UserCard, UserCardWithContent, Review, CardState, ReviewDirection } from '../types';
import { supabase } from './supabaseClient';
import { ImageStorageService, ImageMetadata } from './imageStorageService';
import { logInfo, logWarn, logError } from '../utils/browserLogger';

export class CardService {
  // Get all user cards with content
  static async getUserCards(): Promise<UserCardWithContent[]> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, returning empty array');
        return [];
      }
      
      logInfo('🔍 CardService: Getting user cards...', null, 'CardService');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ CardService: User not authenticated');
        throw new Error('User not authenticated');
      }

      console.log('👤 CardService: User ID:', user.id);
      const { data, error } = await supabase
        .from('user_cards_with_content')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ CardService: Database error:', error);
        throw error;
      }

      console.log('✅ CardService: Fetched cards:', data?.length || 0);
      const cards = data.map(this.mapDatabaseToUserCardWithContent);
      
      // Обновляем состояние карточек на основе прогресса и времени до повторения
      const cardsWithUpdatedStates = cards.map(card => {
        const updatedCard = { ...card };
        const now = new Date();
        
        // Если карточка просрочена (dueAt <= now), она должна быть изучена
        if (card.dueAt <= now) {
          updatedCard.state = 'LEARN' as any; // Учить (просроченные карточки)
        } else if (card.progress >= 10 && card.progress < 70) {
          updatedCard.state = 'REVIEW' as any; // Знаю (прогресс 10-69%, интервал не подошел)
        } else {
          updatedCard.state = 'SUSPENDED' as any; // Выучено (прогресс 70-100%)
        }
        return updatedCard;
      });
      
      return cardsWithUpdatedStates;
    } catch (error) {
      console.error('❌ CardService: Error fetching cards:', error);
      return [];
    }
  }

  // Get cards due for review
  static async getCardsDueForReview(): Promise<UserCardWithContent[]> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, returning empty array');
        return [];
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cards_due_for_review')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const cards = data.map(this.mapDatabaseToUserCardWithContent);
      
      // Обновляем состояние карточек на основе прогресса и времени до повторения
      const cardsWithUpdatedStates = cards.map(card => {
        const updatedCard = { ...card };
        const now = new Date();
        
        // Если карточка просрочена (dueAt <= now), она должна быть изучена
        if (card.dueAt <= now) {
          updatedCard.state = 'LEARN' as any; // Учить (просроченные карточки)
        } else if (card.progress >= 10 && card.progress < 70) {
          updatedCard.state = 'REVIEW' as any; // Знаю (прогресс 10-69%, интервал не подошел)
        } else {
          updatedCard.state = 'SUSPENDED' as any; // Выучено (прогресс 70-100%)
        }
        return updatedCard;
      });
      
      return cardsWithUpdatedStates;
    } catch (error) {
      console.error('Error fetching cards due for review:', error);
      return [];
    }
  }

  // Add card to user's collection (creates card if it doesn't exist)
  static async addCardToUser(
    term: string, 
    translation: string, 
    languagePairId: string, 
    imageUrl?: string,
    english?: string
  ): Promise<UserCardWithContent | null> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, cannot add card');
        throw new Error('Supabase not configured');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ CardService: User not authenticated');
        throw new Error('User not authenticated');
      }
      console.log('👤 CardService: User authenticated:', user.id);

      // Use the database function to add card to user
      const { data, error } = await supabase.rpc('add_card_to_user', {
        p_user_id: user.id,
        p_language_pair_id: languagePairId,
        p_term: term,
        p_translation: translation,
        p_image_url: imageUrl || null,
        p_english: english || null
      });

      if (error) {
        console.error('❌ CardService: Database error:', error);
        console.error('❌ CardService: Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ CardService: Function response:', data);
      
      // Get the added card with content
      const { data: cardData, error: fetchError } = await supabase
        .from('user_cards_with_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('term', term)
        .eq('translation', translation)
        .eq('language_pair_id', languagePairId)
        .single();

      if (fetchError) {
        console.error('❌ CardService: Error fetching added card:', fetchError);
        return null;
      }

      console.log('✅ CardService: Card added successfully');
      return this.mapDatabaseToUserCardWithContent(cardData);
    } catch (error) {
      console.error('Error adding card to user:', error);
      throw error;
    }
  }

  // Add card to user's collection with lesson information
  static async addCardToUserWithLesson(
    term: string, 
    translation: string, 
    languagePairId: string = 'ru-es', 
    imageUrl?: string,
    english?: string,
    lessonId?: string,
    lessonOrder?: number
  ): Promise<UserCardWithContent | null> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, cannot add card');
        return null;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ CardService: User not authenticated');
        throw new Error('User not authenticated');
      }
      logInfo('👤 CardService: User authenticated:', user.id, 'CardService');

      logInfo('📚 CardService: Adding card with lesson info:', {
        term,
        translation,
        languagePairId,
        lessonId,
        lessonOrder
      }, 'CardService');

      // Call the database function
      const { data, error } = await supabase.rpc('add_card_to_user_with_lesson', {
        p_language_pair_id: languagePairId,
        p_term: term,
        p_translation: translation,
        p_image_url: imageUrl || null,
        p_english: english || null,
        p_lesson_id: lessonId || null,
        p_lesson_order: lessonOrder || null
      });

      if (error) {
        logError('❌ CardService: Database function error:', error, 'CardService');
        throw error;
      }

      logInfo('✅ CardService: Database function success:', data, 'CardService');
      logInfo('📚 CardService: Function result - is_new:', { is_new: data.is_new, message: data.message }, 'CardService');

      // Get the added/updated card with content using the returned card_id
      const { data: cardData, error: fetchError } = await supabase
        .from('user_cards_with_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('card_id', data.card_id)
        .single();

      if (fetchError) {
        logError('❌ CardService: Error fetching card:', fetchError, 'CardService');
        return null;
      }

      logInfo('✅ CardService: Successfully fetched card data:', cardData, 'CardService');
      logInfo('📚 CardService: Card lesson info - lesson_id:', { lesson_id: cardData.lesson_id, lesson_order: cardData.lesson_order }, 'CardService');
      return this.mapDatabaseToUserCardWithContent(cardData);
      
    } catch (error) {
      logError('❌ CardService: Error in addCardToUserWithLesson:', error, 'CardService');
      return null;
    }
  }

  // Update user card progress
  static async updateUserCard(userCard: UserCard): Promise<UserCardWithContent> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, cannot update card');
        throw new Error('Supabase not configured');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update the user_cards table
      const { error } = await supabase
        .from('user_cards')
        .update({
          state: userCard.state,
          progress: userCard.progress,
          review_count: userCard.reviewCount,
          successful_reviews: userCard.successfulReviews,
          direction: userCard.direction,
          ease_factor: userCard.easeFactor,
          interval_days: userCard.intervalDays,
          due_at: userCard.dueAt.toISOString(),
          last_reviewed_at: userCard.lastReviewedAt?.toISOString() || null
        })
        .eq('user_id', userCard.userId)
        .eq('card_id', userCard.cardId)
        .select()
        .single();

      if (error) throw error;

      // Fetch the updated card with content from the view
      const { data: cardWithContent, error: fetchError } = await supabase
        .from('user_cards_with_content')
        .select('*')
        .eq('user_id', userCard.userId)
        .eq('card_id', userCard.cardId)
        .single();

      if (fetchError) {
        console.error('❌ CardService: Error fetching updated card with content:', fetchError);
        throw fetchError;
      }

      console.log('✅ CardService: User card updated successfully with content');
      return this.mapDatabaseToUserCardWithContent(cardWithContent);
    } catch (error) {
      console.error('❌ CardService: Error updating user card:', error);
      throw error;
    }
  }

  // Update card content (term, translation, imageUrl, english)
  static async updateCardContent(
    cardId: number,
    term: string,
    translation: string,
    imageUrl?: string,
    english?: string
  ): Promise<void> {
    try {
      console.log('🔄 CardService: updateCardContent called');
      console.log('🔄 CardService: Parameters:', {
        cardId,
        term,
        translation,
        imageUrl,
        english
      });

      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, cannot update card content');
        throw new Error('Supabase not configured');
      }
      
      console.log('🔄 CardService: Getting user authentication...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ CardService: User not authenticated');
        throw new Error('User not authenticated');
      }
      console.log('✅ CardService: User authenticated:', user.id);

      const updateData = {
        term: term.trim(),
        translation: translation.trim(),
        image_url: imageUrl?.trim() || null,
        english: english?.trim() || null,
        updated_at: new Date().toISOString()
      };
      console.log('🔄 CardService: Update data:', updateData);

      // Check if the update would create a duplicate
      console.log('🔄 CardService: Checking for duplicates...');
      const { data: existingCard } = await supabase
        .from('cards')
        .select('id, language_pair_id, term, translation')
        .eq('id', cardId)
        .single();

      if (!existingCard) {
        throw new Error('Card not found');
      }

      // Check if another card with the same (language_pair_id, term, translation) exists
      const { data: duplicateCard } = await supabase
        .from('cards')
        .select('id')
        .eq('language_pair_id', existingCard.language_pair_id)
        .eq('term', updateData.term)
        .eq('translation', updateData.translation)
        .neq('id', cardId)
        .single();

      if (duplicateCard) {
        console.log('⚠️ CardService: Duplicate card found, will merge with existing card');
        // Вместо ошибки, используем существующую карточку
        return await this.mergeWithExistingCard(cardId, duplicateCard.id, user.id, updateData.image_url, updateData.english);
      }

      // Update the cards table
      console.log('🔄 CardService: Updating cards table...');
      const { error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', cardId);

      if (error) {
        console.error('❌ CardService: Error updating card content:', error);
        console.error('❌ CardService: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ CardService: Card content updated successfully');
    } catch (error) {
      console.error('❌ CardService: Error updating card content:', error);
      console.error('❌ CardService: Full error object:', error);
      throw error;
    }
  }

  // Merge user's card with existing duplicate card
  static async mergeWithExistingCard(
    oldCardId: number, 
    existingCardId: number, 
    userId: string,
    newImageUrl?: string | null,
    newEnglish?: string | null
  ): Promise<void> {
    try {
      console.log('🔄 CardService: mergeWithExistingCard called');
      console.log('🔄 CardService: Parameters:', { oldCardId, existingCardId, userId, newImageUrl, newEnglish });

      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      // Update the existing card with new image and english if provided
      if (newImageUrl || newEnglish) {
        console.log('🔄 CardService: Updating existing card with new image/english...');
        const updateData: any = {};
        
        if (newImageUrl) {
          updateData.image_url = newImageUrl;
        }
        
        if (newEnglish) {
          updateData.english = newEnglish;
        }
        
        updateData.updated_at = new Date().toISOString();
        
        const { error: updateError } = await supabase
          .from('cards')
          .update(updateData)
          .eq('id', existingCardId);

        if (updateError) {
          console.error('❌ CardService: Error updating existing card:', updateError);
          throw updateError;
        }
        
        console.log('✅ CardService: Existing card updated with new image/english');
      }

      // Check if user already has the existing card
      const { data: existingUserCard } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('card_id', existingCardId)
        .single();

      if (existingUserCard) {
        console.log('🔄 CardService: User already has the existing card, removing old card');
        // User already has the existing card, just remove the old one
        const { error: deleteError } = await supabase
          .from('user_cards')
          .delete()
          .eq('user_id', userId)
          .eq('card_id', oldCardId);

        if (deleteError) {
          console.error('❌ CardService: Error removing old user card:', deleteError);
          throw deleteError;
        }
      } else {
        console.log('🔄 CardService: User does not have existing card, transferring progress');
        // User doesn't have the existing card, transfer progress from old to new
        const { data: oldUserCard } = await supabase
          .from('user_cards')
          .select('*')
          .eq('user_id', userId)
          .eq('card_id', oldCardId)
          .single();

        if (oldUserCard) {
          // Create new user card with existing card ID and old card's progress
          const { error: insertError } = await supabase
            .from('user_cards')
            .insert({
              user_id: userId,
              card_id: existingCardId,
              state: oldUserCard.state,
              progress: oldUserCard.progress,
              review_count: oldUserCard.review_count,
              successful_reviews: oldUserCard.successful_reviews,
              direction: oldUserCard.direction,
              ease_factor: oldUserCard.ease_factor,
              interval_days: oldUserCard.interval_days,
              due_at: oldUserCard.due_at,
              last_reviewed_at: oldUserCard.last_reviewed_at,
              lesson_id: oldUserCard.lesson_id,
              lesson_order: oldUserCard.lesson_order
            });

          if (insertError) {
            console.error('❌ CardService: Error creating new user card:', insertError);
            throw insertError;
          }

          // Remove old user card
          const { error: deleteError } = await supabase
            .from('user_cards')
            .delete()
            .eq('user_id', userId)
            .eq('card_id', oldCardId);

          if (deleteError) {
            console.error('❌ CardService: Error removing old user card:', deleteError);
            throw deleteError;
          }
        }
      }

      console.log('✅ CardService: Successfully merged cards');
    } catch (error) {
      console.error('❌ CardService: Error merging cards:', error);
      throw error;
    }
  }

  // Remove card from user's collection
  static async removeCardFromUser(cardId: number): Promise<void> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, cannot remove card');
        throw new Error('Supabase not configured');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_cards')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId);

      if (error) throw error;

      console.log('✅ CardService: Card removed from user collection');
    } catch (error) {
      console.error('❌ CardService: Error removing card from user:', error);
      throw error;
    }
  }

  // Get cards for specific language pair
  static async getCardsForLanguagePair(languagePairId: string): Promise<UserCardWithContent[]> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, returning empty array');
        return [];
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_cards_with_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_pair_id', languagePairId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapDatabaseToUserCardWithContent);
    } catch (error) {
      console.error('Error fetching cards for language pair:', error);
      return [];
    }
  }

  // Check for duplicates in user's collection
  static async checkForDuplicates(term: string, translation: string, languagePairId: string): Promise<UserCardWithContent | null> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, cannot check duplicates');
        return null;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_cards_with_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_pair_id', languagePairId)
        .eq('term', term)
        .eq('translation', translation)
        .limit(1);

      if (error) {
        console.error('❌ CardService: Error checking duplicates:', error);
        return null;
      }

      if (data.length > 0) {
        console.log('🔍 CardService: Found duplicate card:', { term, translation });
        return this.mapDatabaseToUserCardWithContent(data[0]);
      }

      return null;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return null;
    }
  }

  // Check if user has any cards
  static async hasUserCards(): Promise<boolean> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured');
        return false;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_cards')
        .select('card_id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        console.error('❌ CardService: Error checking if user has cards:', error);
        return false;
      }

      return data.length > 0;
    } catch (error) {
      console.error('Error checking if user has cards:', error);
      return false;
    }
  }

  // Get cards from a specific lesson in order
  static async getLessonCardsInOrder(lessonId: string): Promise<UserCardWithContent[]> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured');
        return [];
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_cards_with_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .not('lesson_order', 'is', null)
        .order('lesson_order', { ascending: true });

      if (error) {
        console.error('❌ CardService: Error fetching lesson cards:', error);
        return [];
      }

      return data.map(this.mapDatabaseToUserCardWithContent);
    } catch (error) {
      console.error('Error fetching lesson cards:', error);
      return [];
    }
  }

  // Add multiple cards from lesson words with order
  static async addCardsFromLesson(
    words: Array<{ term: string; translation: string; english?: string }>,
    languagePairId: string = 'ru-es',
    lessonId?: string
  ): Promise<{ added: number; skipped: number }> {
    try {
      logInfo(`🔄 CardService: Starting addCardsFromLesson with ${words.length} words`, { lessonId, languagePairId }, 'CardService');
      
      if (!supabase) {
        logWarn('⚠️ CardService: Supabase not configured, cannot add cards', null, 'CardService');
        return { added: 0, skipped: 0 };
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ CardService: User not authenticated in addCardsFromLesson');
        throw new Error('User not authenticated');
      }
      logInfo('👤 CardService: User authenticated in addCardsFromLesson:', user.id, 'CardService');

      // First, get all existing user cards to check for duplicates
      const { data: existingUserCards, error: fetchError } = await supabase
        .from('user_cards_with_content')
        .select('term')
        .eq('user_id', user.id);

      if (fetchError) {
        logError('❌ CardService: Error fetching existing cards:', fetchError, 'CardService');
        throw fetchError;
      }

      const existingTerms = existingUserCards?.map(card => card.term.toLowerCase()) || [];
      logInfo(`📊 CardService: Found ${existingTerms.length} existing cards for user`, null, 'CardService');

      let addedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const lessonOrder = i + 1; // 1-based order
        
        // Check if word already exists
        if (existingTerms.includes(word.term.toLowerCase())) {
          logInfo(`⏭️ Skipping duplicate word: "${word.term}" - "${word.translation}"`, null, 'CardService');
          skippedCount++;
          continue;
        }
        
        logInfo(`📚 Adding word ${i + 1}/${words.length}: "${word.term}" - "${word.translation}" (order: ${lessonOrder})`, null, 'CardService');
        
        try {
          // Add card to user's collection with lesson order
          const result = await this.addCardToUserWithLesson(
            word.term, 
            word.translation, 
            languagePairId, 
            undefined, 
            word.english,
            lessonId,
            lessonOrder
          );
          
          if (result) {
            // The result from addCardToUserWithLesson is UserCardWithContent, not the raw DB result
            // We need to check if this was a new card or updated card differently
            logInfo(`✅ Processed word: "${word.term}" - "${word.translation}" (card_id: ${result.cardId})`, null, 'CardService');
            addedCount++; // Count as added since we either added or updated it with lesson info
          } else {
            logError(`❌ Failed to add word: "${word.term}" - "${word.translation}"`, null, 'CardService');
          }
        } catch (error) {
          logError(`❌ Error adding word "${word.term}":`, error, 'CardService');
          // If it's a duplicate error, count as skipped
          if (error instanceof Error && error.message.includes('duplicate')) {
            skippedCount++;
          }
        }
      }

      logInfo(`✅ CardService: Added ${addedCount} cards, skipped ${skippedCount} duplicates`, null, 'CardService');
      return { added: addedCount, skipped: skippedCount };
    } catch (error) {
      console.error('❌ CardService: Error adding cards from lesson:', error);
      return { added: 0, skipped: 0 };
    }
  }

  // Record a review
  static async recordReview(
    cardId: number,
    rating: number,
    prevInterval?: number,
    nextInterval?: number,
    prevEf?: number,
    nextEf?: number
  ): Promise<Review> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, cannot record review');
        throw new Error('Supabase not configured');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          card_id: cardId,
          rating: rating,
          prev_interval: prevInterval,
          next_interval: nextInterval,
          prev_ef: prevEf,
          next_ef: nextEf
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ CardService: Review recorded successfully');
      return this.mapDatabaseToReview(data);
    } catch (error) {
      console.error('❌ CardService: Error recording review:', error);
      throw error;
    }
  }

  // Get review history for a card
  static async getCardReviewHistory(cardId: number): Promise<Review[]> {
    try {
      if (!supabase) {
        console.log('⚠️ CardService: Supabase not configured, returning empty array');
        return [];
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .order('reviewed_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapDatabaseToReview);
    } catch (error) {
      console.error('Error fetching review history:', error);
      return [];
    }
  }

  // Map database record to UserCardWithContent type
  private static mapDatabaseToUserCardWithContent(dbCard: any): UserCardWithContent {
    return {
      userId: dbCard.user_id,
      cardId: dbCard.card_id,
      languagePairId: dbCard.language_pair_id,
      term: dbCard.term,
      translation: dbCard.translation,
      imageUrl: dbCard.image_url,
      imagePath: dbCard.image_path,
      imageMetadata: dbCard.image_metadata,
      english: dbCard.english,
      customImagePath: dbCard.custom_image_path,
      customImageMetadata: dbCard.custom_image_metadata,
      state: dbCard.state as CardState,
      progress: dbCard.progress,
      reviewCount: dbCard.review_count,
      successfulReviews: dbCard.successful_reviews,
      direction: dbCard.direction as ReviewDirection,
      easeFactor: parseFloat(dbCard.ease_factor),
      intervalDays: dbCard.interval_days,
      dueAt: dbCard.due_at ? new Date(dbCard.due_at) : new Date(), // Если due_at null, устанавливаем текущее время
      lastReviewedAt: dbCard.last_reviewed_at ? new Date(dbCard.last_reviewed_at) : undefined,
      lessonId: dbCard.lesson_id,
      lessonOrder: dbCard.lesson_order,
      createdAt: new Date(dbCard.created_at),
      updatedAt: new Date(dbCard.updated_at)
    };
  }

  // Map database record to UserCard type (legacy method, kept for compatibility)
  // @ts-ignore - Legacy method kept for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static mapDatabaseToUserCard(dbCard: any): UserCard {
    return {
      userId: dbCard.user_id,
      cardId: dbCard.card_id,
      state: dbCard.state as CardState,
      progress: dbCard.progress,
      reviewCount: dbCard.review_count,
      successfulReviews: dbCard.successful_reviews,
      direction: dbCard.direction as ReviewDirection,
      easeFactor: parseFloat(dbCard.ease_factor),
      intervalDays: dbCard.interval_days,
      dueAt: new Date(dbCard.due_at),
      lastReviewedAt: dbCard.last_reviewed_at ? new Date(dbCard.last_reviewed_at) : undefined,
      createdAt: new Date(dbCard.created_at),
      updatedAt: new Date(dbCard.updated_at)
    };
  }

  // Map database record to Review type
  private static mapDatabaseToReview(dbReview: any): Review {
    return {
      id: dbReview.id,
      userId: dbReview.user_id,
      cardId: dbReview.card_id,
      reviewedAt: new Date(dbReview.reviewed_at),
      rating: dbReview.rating,
      prevInterval: dbReview.prev_interval,
      nextInterval: dbReview.next_interval,
      prevEf: dbReview.prev_ef,
      nextEf: dbReview.next_ef
    };
  }

  // Legacy methods for backward compatibility (will be removed)
  static async createCard(cardData: any): Promise<any> {
    console.warn('⚠️ CardService: createCard is deprecated, use addCardToUser instead');
    return this.addCardToUser(
      cardData.term,
      cardData.translation,
      cardData.languagePairId || 'ru-es',
      cardData.imageUrl,
      cardData.english
    );
  }

  static async updateCard(card: any): Promise<UserCardWithContent> {
    console.warn('⚠️ CardService: updateCard is deprecated, use updateUserCard instead');
    const userCard: UserCard = {
      userId: card.userId || '',
      cardId: parseInt(card.id),
      state: card.state,
      progress: card.progress,
      reviewCount: card.reviewCount,
      successfulReviews: card.successfulReviews,
      direction: card.direction,
      easeFactor: card.easeFactor,
      intervalDays: card.intervalDays,
      dueAt: card.dueAt,
      lastReviewedAt: card.lastReviewedAt,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt
    };
    return this.updateUserCard(userCard);
  }

  static async deleteCard(cardId: string): Promise<void> {
    console.warn('⚠️ CardService: deleteCard is deprecated, use removeCardFromUser instead');
    return this.removeCardFromUser(parseInt(cardId));
  }

  // Image management methods

  /**
   * Upload public image for a card
   */
  static async uploadCardImage(
    cardId: number,
    file: File,
    metadata?: ImageMetadata
  ): Promise<{ path: string; url: string }> {
    try {
      const result = await ImageStorageService.uploadPublicCardImage(file, cardId, metadata);
      
      // Update card with image path
      if (supabase) {
        const { error } = await supabase
          .from('cards')
          .update({
            image_path: result.path,
            image_metadata: metadata || {}
          })
          .eq('id', cardId);

        if (error) throw error;
      }

      return { path: result.path, url: result.url };
    } catch (error) {
      console.error('Error uploading card image:', error);
      throw error;
    }
  }

  /**
   * Upload user-specific image for a card
   */
  static async uploadUserCardImage(
    cardId: number,
    file: File,
    metadata?: ImageMetadata
  ): Promise<{ path: string; url: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const result = await ImageStorageService.uploadUserCardImage(file, user.id, cardId, metadata);
      
      // Update user_card with custom image path
      const { error } = await supabase
        .from('user_cards')
        .update({
          custom_image_path: result.path,
          custom_image_metadata: metadata || {}
        })
        .eq('user_id', user.id)
        .eq('card_id', cardId);

      if (error) throw error;

      return { path: result.path, url: result.url };
    } catch (error) {
      console.error('Error uploading user card image:', error);
      throw error;
    }
  }

  /**
   * Import image from URL (for Leonardo.AI integration)
   */
  static async importCardImageFromUrl(
    cardId: number,
    url: string,
    isPublic: boolean = false,
    metadata?: ImageMetadata
  ): Promise<{ path: string; url: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const result = await ImageStorageService.importImageFromUrl(
        url,
        user.id,
        cardId,
        isPublic,
        metadata
      );

      // Update database with image path
      if (isPublic) {
        const { error } = await supabase
          .from('cards')
          .update({
            image_path: result.path,
            image_metadata: metadata || {}
          })
          .eq('id', cardId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_cards')
          .update({
            custom_image_path: result.path,
            custom_image_metadata: metadata || {}
          })
          .eq('user_id', user.id)
          .eq('card_id', cardId);

        if (error) throw error;
      }

      return { path: result.path, url: result.url };
    } catch (error) {
      console.error('Error importing card image from URL:', error);
      throw error;
    }
  }

  /**
   * Delete user-specific image for a card
   */
  static async deleteUserCardImage(cardId: number): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current custom image path
      const { data: userCard } = await supabase
        .from('user_cards')
        .select('custom_image_path')
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .single();

      if (userCard?.custom_image_path) {
        // Delete from storage
        await ImageStorageService.deleteUserCardImages(user.id, cardId);

        // Clear path in database
        const { error } = await supabase
          .from('user_cards')
          .update({
            custom_image_path: null,
            custom_image_metadata: null
          })
          .eq('user_id', user.id)
          .eq('card_id', cardId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error deleting user card image:', error);
      throw error;
    }
  }

  /**
   * Get image URL for a card (prioritizes user-specific image over public)
   */
  static async getCardImageUrl(card: UserCardWithContent): Promise<string> {
    try {
      // If user has custom image, get public URL (bucket is now public)
      if (card.customImagePath) {
        return ImageStorageService.getPublicImageUrl(card.customImagePath, 'user-images');
      }

      // Otherwise, use public image
      if (card.imagePath) {
        return ImageStorageService.getPublicImageUrl(card.imagePath, 'cards');
      }

      // Fallback to legacy imageUrl
      return card.imageUrl || '';
    } catch (error) {
      console.error('Error getting card image URL:', error);
      return card.imageUrl || '';
    }
  }

  /**
   * Get thumbnail URL for a card
   */
  static async getCardThumbnailUrl(card: UserCardWithContent, size: number = 200): Promise<string> {
    try {
      // If user has custom image, get public URL with transforms
      if (card.customImagePath) {
        return ImageStorageService.getImageUrlWithTransform(card.customImagePath, {
          width: size,
          height: size,
          resize: 'cover',
          quality: 80
        }, true, 'user-images');
      }

      // Otherwise, use public image with transforms
      if (card.imagePath) {
        return ImageStorageService.getThumbnailUrl(card.imagePath, true, size);
      }

      // Fallback to legacy imageUrl
      return card.imageUrl || '';
    } catch (error) {
      console.error('Error getting card thumbnail URL:', error);
      return card.imageUrl || '';
    }
  }
}
import { supabase } from './supabaseClient';
import { logInfo, logError, logWarn } from '../utils/browserLogger';

export interface ImageMetadata {
  source?: 'leonardo' | 'user_upload' | 'ai_generated' | 'manual';
  prompt?: string;
  model?: string;
  seed?: string;
  negative_prompt?: string;
  license?: string;
  generated_at?: string;
  original_url?: string;
  [key: string]: any;
}

export interface UploadResult {
  path: string;
  url: string;
  metadata?: ImageMetadata;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
}

export class ImageStorageService {
  private static readonly PUBLIC_BUCKET = 'cards';
  private static readonly PRIVATE_BUCKET = 'user-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for public, 10MB for private

  /**
   * Upload image to public cards bucket
   */
  static async uploadPublicCardImage(
    file: File | Blob,
    cardId: number,
    metadata?: ImageMetadata
  ): Promise<UploadResult> {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const path = `cards/${cardId}/orig.webp`;
      
      const { data, error } = await supabase.storage
        .from(this.PUBLIC_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: 'image/webp',
          metadata: metadata || {}
        });

      if (error) throw error;

      const publicUrl = this.getPublicImageUrl(path);
      
      return {
        path,
        url: publicUrl,
        metadata
      };
    } catch (error) {
      console.error('Error uploading public card image:', error);
      throw error;
    }
  }

  /**
   * Upload user-specific image to public bucket
   */
  static async uploadUserCardImage(
    file: File | Blob,
    userId: string,
    cardId: number,
    metadata?: ImageMetadata
  ): Promise<UploadResult> {
    try {
      logInfo('🔄 ImageStorageService: Starting uploadUserCardImage', { 
        userId, 
        cardId, 
        fileSize: file.size,
        fileType: file.type 
      }, 'ImageStorageService');

      if (!supabase) {
        logError('❌ ImageStorageService: Supabase not configured', null, 'ImageStorageService');
        throw new Error('Supabase not configured');
      }

      const path = `${userId}/cards/${cardId}/orig.webp`;
      logInfo('🔄 ImageStorageService: Upload path', { path }, 'ImageStorageService');
      
      const { data, error } = await supabase.storage
        .from(this.PRIVATE_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: 'image/webp',
          metadata: metadata || {}
        });

      if (error) {
        logError('❌ ImageStorageService: Upload error', error, 'ImageStorageService');
        throw error;
      }

      // Get public URL (no need for signed URL since bucket is now public)
      const publicUrl = this.getPublicImageUrl(path, this.PRIVATE_BUCKET);
      logInfo('✅ ImageStorageService: Upload successful', { path, publicUrl }, 'ImageStorageService');
      
      return {
        path,
        url: publicUrl,
        metadata
      };
    } catch (error) {
      logError('❌ ImageStorageService: Error uploading user card image', error, 'ImageStorageService');
      throw error;
    }
  }

  /**
   * Import image from URL (for Leonardo.AI integration)
   */
  static async importImageFromUrl(
    url: string,
    userId: string,
    cardId: number,
    isPublic: boolean = false,
    metadata?: ImageMetadata
  ): Promise<UploadResult> {
    try {
      // Fetch image from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      if (isPublic) {
        return await this.uploadPublicCardImage(blob, cardId, metadata);
      } else {
        return await this.uploadUserCardImage(blob, userId, cardId, metadata);
      }
    } catch (error) {
      console.error('Error importing image from URL:', error);
      throw error;
    }
  }

  /**
   * Get public image URL
   */
  static getPublicImageUrl(imagePath: string, bucket: string = this.PUBLIC_BUCKET): string {
    if (!imagePath) return '';
    
    const { data } = supabase?.storage
      .from(bucket)
      .getPublicUrl(imagePath) || { data: { publicUrl: '' } };
    
    return data.publicUrl;
  }

  /**
   * Create signed URL for private images
   */
  static async createSignedUrl(
    imagePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      if (!supabase || !imagePath) {
        return '';
      }

      const { data, error } = await supabase.storage
        .from(this.PRIVATE_BUCKET)
        .createSignedUrl(imagePath, expiresIn);

      if (error) throw error;
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return '';
    }
  }

  /**
   * Get image URL with transformations
   */
  static getImageUrlWithTransform(
    imagePath: string,
    options: ImageTransformOptions = {},
    isPublic: boolean = true,
    bucket?: string
  ): string {
    if (!imagePath) return '';

    const baseUrl = isPublic 
      ? this.getPublicImageUrl(imagePath, bucket || this.PUBLIC_BUCKET)
      : imagePath; // For signed URLs, we'll handle transforms differently

    if (!isPublic) {
      // For private images, we need to create a new signed URL with transforms
      // This would typically be done server-side or with a special endpoint
      return baseUrl;
    }

    // Add transformation parameters to public URL
    const params = new URLSearchParams();
    
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.resize) params.append('resize', options.resize);
    if (options.format) params.append('format', options.format);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Delete image from storage
   */
  static async deleteImage(imagePath: string, isPublic: boolean = true): Promise<void> {
    try {
      if (!supabase || !imagePath) return;

      const bucket = isPublic ? this.PUBLIC_BUCKET : this.PRIVATE_BUCKET;
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([imagePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Delete all images for a card
   */
  static async deleteCardImages(cardId: number): Promise<void> {
    try {
      if (!supabase) return;

      // Delete public card image
      const publicPath = `cards/${cardId}/orig.webp`;
      await this.deleteImage(publicPath, true);

      // Note: User-specific images will be cleaned up by database triggers
      // when user_cards are deleted
    } catch (error) {
      console.error('Error deleting card images:', error);
      throw error;
    }
  }

  /**
   * Delete user-specific images for a card
   */
  static async deleteUserCardImages(userId: string, cardId: number): Promise<void> {
    try {
      if (!supabase) return;

      const path = `${userId}/cards/${cardId}/orig.webp`;
      await this.deleteImage(path, false);
    } catch (error) {
      console.error('Error deleting user card images:', error);
      throw error;
    }
  }

  /**
   * Convert image to WebP format
   */
  static async convertToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          },
          'image/webp',
          0.9
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = this.MAX_FILE_SIZE;

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`
      };
    }

    return { valid: true };
  }

  /**
   * Generate thumbnail path
   */
  static getThumbnailPath(originalPath: string): string {
    return originalPath.replace('/orig.webp', '/thumb.webp');
  }

  /**
   * Get thumbnail URL with transformations
   */
  static getThumbnailUrl(
    imagePath: string,
    isPublic: boolean = true,
    size: number = 200
  ): string {
    if (!imagePath) return '';

    return this.getImageUrlWithTransform(
      imagePath,
      {
        width: size,
        height: size,
        resize: 'cover',
        quality: 80
      },
      isPublic
    );
  }
}

import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { CardService } from '../../services/cardService';
import { ImageStorageService, ImageMetadata } from '../../services/imageStorageService';
import { UserCardWithContent } from '../../types';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: UserCardWithContent | null;
  onImageUploaded: (imageUrl: string) => void;
  onError?: (error: string) => void;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  card,
  onImageUploaded,
  onError
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !card) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setPreview(null);

    // Validate file
    const validation = ImageStorageService.validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert to WebP if needed
      let fileToUpload = file;
      if (!file.type.includes('webp')) {
        fileToUpload = new File([await ImageStorageService.convertToWebP(file)], file.name, {
          type: 'image/webp'
        });
      }

      // Create metadata
      const metadata: ImageMetadata = {
        source: 'user_upload',
        generated_at: new Date().toISOString()
      };

      // Upload user-specific image
      const result = await CardService.uploadUserCardImage(card.cardId, fileToUpload, metadata);
      
      setUploadProgress(100);
      onImageUploaded(result.url);
      
      // Close modal after successful upload
      setTimeout(() => {
        onClose();
        setIsUploading(false);
        setUploadProgress(0);
        setPreview(null);
      }, 1000);

    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
      setIsUploading(false);
      setUploadProgress(0);
      setPreview(null);
    }
  };

  const handleRemoveImage = async () => {
    if (!card) return;

    try {
      setIsUploading(true);
      await CardService.deleteUserCardImage(card.cardId);
      onImageUploaded(''); // Clear image
      onClose();
    } catch (error) {
      console.error('Error removing image:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setError(null);
      setPreview(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload Image for "{card.term}"
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Image Preview */}
          {(card.customImagePath || card.imagePath || card.imageUrl) && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Current Image</h3>
              <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={card.imageUrl || ''}
                  alt={card.term}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder
                    e.currentTarget.src = '/assets/placeholder-image.png';
                  }}
                />
              </div>
              {card.customImagePath && (
                <button
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove custom image
                </button>
              )}
            </div>
          )}

          {/* Upload Area */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              {card.customImagePath ? 'Replace with new image' : 'Upload custom image'}
            </h3>
            
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              
              {preview ? (
                <div className="space-y-3">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg mx-auto"
                  />
                  <p className="text-sm text-gray-600">Ready to upload</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 text-gray-400">
                    {isUploading ? (
                      <Loader2 className="w-12 h-12 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Drag and drop an image here, or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JPEG, PNG, WebP (max 10MB)
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for better images:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use clear, high-quality images</li>
              <li>• Images should represent the word clearly</li>
              <li>• Avoid copyrighted content</li>
              <li>• WebP format is recommended for better compression</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};







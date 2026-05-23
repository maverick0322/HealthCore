import { useState } from 'react';
import { isAxiosError } from 'axios';
import { mediaService } from '@/shared/services/mediaService';

interface UseMediaUploadReturn {
  isUploading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<string | null>;
}

const ERROR_MESSAGES = {
  VALIDATION: 'The file is invalid or not supported.',
  NETWORK_RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  NETWORK_OR_SERVER: 'A connection error occurred. Please try again later.',
  GENERIC: 'An unexpected error occurred while processing the file.',
} as const;

const FILE_NAME_SANITIZATION_REGEX = /[^a-zA-Z0-9.\-_]/g;
const SANITIZATION_REPLACEMENT_CHAR = '_';

/**
 * Application hook managing the media upload state machine and orchestration.
 * Adheres to SRP by abstracting the multi-step upload process from the UI layer.
 */
export const useMediaUpload = (): UseMediaUploadReturn => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      // Replaces unsafe characters to prevent HTTP/R2 parsing errors during the PUT request
      const sanitizedName = file.name.replace(FILE_NAME_SANITIZATION_REGEX, SANITIZATION_REPLACEMENT_CHAR);

      const { presignedUrl, storageKey } = await mediaService.requestUploadUrl(sanitizedName);
      await mediaService.uploadToCloudflare(presignedUrl, file);

      return storageKey;
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const statusCode = err.response?.status;
        
        if (statusCode === 400 || statusCode === 422) {
          setError(ERROR_MESSAGES.VALIDATION);
        } else if (statusCode === 429) {
          setError(ERROR_MESSAGES.NETWORK_RATE_LIMIT);
        } else {
          setError(ERROR_MESSAGES.NETWORK_OR_SERVER);
        }
      } else if (err instanceof Error) {
        setError(ERROR_MESSAGES.GENERIC);
      } else {
        setError(ERROR_MESSAGES.GENERIC);
      }
      
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, error, uploadFile };
};
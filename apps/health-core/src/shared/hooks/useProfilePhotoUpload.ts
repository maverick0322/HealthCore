import { useState } from 'react';

import { useMediaUpload } from '@/shared/hooks/useMediaUpload';

const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface UseProfilePhotoUploadOptions {
  invalidTypeMessage: string;
  invalidSizeMessage: string;
  persistErrorMessage: string;
  uploadErrorMessages: {
    validation: string;
    rateLimit: string;
    network: string;
    generic: string;
  };
  onUploadComplete: (storageKey: string) => Promise<void>;
}

export const PROFILE_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
export const PROFILE_PHOTO_MAX_SIZE_BYTES = MAX_FILE_SIZE_BYTES;

export const useProfilePhotoUpload = ({
  invalidTypeMessage,
  invalidSizeMessage,
  persistErrorMessage,
  uploadErrorMessages,
  onUploadComplete,
}: UseProfilePhotoUploadOptions) => {
  const [localError, setLocalError] = useState<string | null>(null);
  const { uploadFile, isUploading, error: uploadError } = useMediaUpload({
    errorMessages: uploadErrorMessages,
  });

  const handleFileSelected = async (file: File) => {
    setLocalError(null);

    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      setLocalError(invalidTypeMessage);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError(invalidSizeMessage);
      return;
    }

    const storageKey = await uploadFile(file);
    if (!storageKey) {
      return;
    }

    try {
      await onUploadComplete(storageKey);
    } catch {
      setLocalError(persistErrorMessage);
    }
  };

  return {
    accept: PROFILE_PHOTO_ACCEPT,
    error: localError ?? uploadError,
    handleFileSelected,
    isUploading,
  };
};

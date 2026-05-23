import axios from 'axios';
import httpClient from '@/core/http/httpClient';

export interface UploadUrlResponse {
  presignedUrl: string;
  storageKey: string;
}

/**
 * Infrastructure service responsible for media-related external communications.
 * Separates the HTTP protocol details from the application logic.
 */
export const mediaService = {
  requestUploadUrl: async (fileName: string): Promise<UploadUrlResponse> => {
    const { data } = await httpClient.post<UploadUrlResponse>('/media/upload-request', {
      fileName: fileName,
    });
    return data;
  },

  uploadToCloudflare: async (presignedUrl: string, file: File): Promise<void> => {
    // Requires an isolated Axios instance to prevent JWT injection into the 3rd party storage provider
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  },
};
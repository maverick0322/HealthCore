import axios from 'axios';
import httpClient from '@/core/http/httpClient';

export interface UploadUrlResponse {
  presignedUrl: string;
  storageKey: string;
}

/**
 * Servicio transversal para la gestión de archivos multimedia.
 * Conecta con el media-service de HealthCore y orquesta subidas directas a R2.
 */
export const mediaService = {
  /**
   * Paso 1: Pide permiso al backend y obtiene una URL firmada de corta duración.
   */
  requestUploadUrl: async (fileName: string): Promise<UploadUrlResponse> => {
    // Usamos el httpClient que ya inyecta el JWT automáticamente
    const { data } = await httpClient.post<UploadUrlResponse>('/media/upload-request', {
      fileName: fileName,
    });
    return data;
  },

  /**
   * Paso 2: Sube el archivo físico binario directamente a Cloudflare R2 usando la URL firmada.
   * Nota importante: ¡No usamos httpClient aquí para evitar mandar el JWT a Cloudflare!
   */
  uploadToCloudflare: async (presignedUrl: string, file: File): Promise<void> => {
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type, // Es vital enviar el MIME type correcto (ej. image/jpeg)
      },
    });
  },
};
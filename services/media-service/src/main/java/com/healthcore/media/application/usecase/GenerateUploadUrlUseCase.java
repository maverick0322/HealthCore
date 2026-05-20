package com.healthcore.media.application.usecase;

import com.healthcore.media.application.dto.UploadMediaResponse;
import com.healthcore.media.domain.exception.MediaDomainException;
import com.healthcore.media.domain.port.MediaStoragePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.exception.SdkException;

import java.util.UUID;

/**
 * Application Service / Use Case.
 * Orchestrates safe routes creation and cryptographic signs delegation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateUploadUrlUseCase {

    private final MediaStoragePort mediaStoragePort;
    private static final String FOLDER_SEPARATOR = "/";

    public UploadMediaResponse execute(String userId, String originalFileName) {
        if (userId == null || userId.isBlank()) {
            log.warn("Intento de generación de URL sin UserID. Operación rechazada.");
            throw new IllegalArgumentException("El identificador del usuario es requerido.");
        }

        String secureStorageKey = buildSecureStorageKey(userId, originalFileName);

        try {
            String presignedUrl = mediaStoragePort.generateUploadUrl(secureStorageKey);
            return new UploadMediaResponse(presignedUrl, secureStorageKey);

        } catch (IllegalArgumentException ex) {
            log.warn("Fallo de validación al construir la petición para S3. UserID: {}", userId);
            throw new MediaDomainException("Error en los parámetros de la solicitud de almacenamiento.", ex);

        } catch (SdkException ex) {
            log.error("Falla en el SDK de AWS al intentar contactar a Cloudflare R2. UserID: {}", userId);
            throw new MediaDomainException("El servicio de almacenamiento externo no está disponible.", ex);

        } catch (Exception ex) {
            log.error("Fallo inesperado al generar URL firmada. UserID: {}", userId);
            throw new MediaDomainException("Ocurrió un error crítico procesando la solicitud de medios.", ex);
        }
    }

    private String buildSecureStorageKey(String userId, String fileName) {
        String uniqueId = UUID.randomUUID().toString();
        return userId + FOLDER_SEPARATOR + uniqueId + "-" + fileName;
    }
}
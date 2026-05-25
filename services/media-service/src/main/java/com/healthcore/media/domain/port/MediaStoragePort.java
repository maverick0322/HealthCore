package com.healthcore.media.domain.port;

/**
 * Driven Port (Domain): Contract for generating secure upload endpoints.
 * Keeps the core application decoupled from cloud storage implementations.
 */
public interface MediaStoragePort {

    /**
     * Generates a secure, temporary pre-signed URL for direct file upload.
     * @param fileName The unique path/name of the target file in the storage.
     * @return A string containing the temporary write URL.
     */
    String generateUploadUrl(String fileName);
    String generateDownloadUrl(String storageKey);
}
package com.healthcore.media.application.dto;

/**
 * DTO output that encapsulates signed URL and final route (key) generated
 */
public record UploadMediaResponse(
        String presignedUrl,
        String storageKey
) {}
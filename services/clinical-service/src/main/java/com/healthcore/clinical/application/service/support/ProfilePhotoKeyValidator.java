package com.healthcore.clinical.application.service.support;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.regex.Pattern;

@Component
public class ProfilePhotoKeyValidator {

    private static final Pattern PROFILE_PHOTO_SEGMENT_PATTERN = Pattern.compile(
            "^[A-Za-z0-9-]+-[A-Za-z0-9._-]+\\.(?i:jpg|jpeg|png|webp)$"
    );
    private static final Set<String> ALLOWED_PROFILE_PHOTO_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");

    public String validateOwnership(String userId, String profilePhotoKey) {
        if (profilePhotoKey == null || profilePhotoKey.isBlank()) {
            throw new IllegalArgumentException("Profile photo key is required.");
        }

        String expectedPrefix = userId + "/";
        if (!profilePhotoKey.startsWith(expectedPrefix)) {
            throw new AccessDeniedException("Profile photo key does not belong to the authenticated user.");
        }

        String relativeKey = profilePhotoKey.substring(expectedPrefix.length());
        if (relativeKey.isBlank() || relativeKey.contains("/")) {
            throw new IllegalArgumentException("Profile photo key format is invalid.");
        }

        if (!PROFILE_PHOTO_SEGMENT_PATTERN.matcher(relativeKey).matches()) {
            throw new IllegalArgumentException("Profile photo key format is invalid.");
        }

        int extensionIndex = relativeKey.lastIndexOf('.');
        if (extensionIndex < 0) {
            throw new IllegalArgumentException("Profile photo key format is invalid.");
        }

        String extension = relativeKey.substring(extensionIndex + 1).toLowerCase();
        if (!ALLOWED_PROFILE_PHOTO_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Profile photo key format is invalid.");
        }

        return profilePhotoKey;
    }
}

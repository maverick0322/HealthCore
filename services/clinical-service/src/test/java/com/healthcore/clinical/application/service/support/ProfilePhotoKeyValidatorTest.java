package com.healthcore.clinical.application.service.support;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProfilePhotoKeyValidatorTest {

    private final ProfilePhotoKeyValidator validator = new ProfilePhotoKeyValidator();

    @Test
    void shouldReturnOriginalKeyWhenOwnershipAndFormatAreValid() {
        String key = validator.validateOwnership("user-123", "user-123/uuid-avatar.webp");

        assertEquals("user-123/uuid-avatar.webp", key);
    }

    @Test
    void shouldRejectBlankProfilePhotoKey() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateOwnership("user-123", " ")
        );

        assertEquals("Profile photo key is required.", exception.getMessage());
    }

    @Test
    void shouldRejectProfilePhotoKeyFromAnotherUser() {
        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> validator.validateOwnership("user-123", "other-user/uuid-avatar.webp")
        );

        assertEquals("Profile photo key does not belong to the authenticated user.", exception.getMessage());
    }

    @Test
    void shouldRejectNestedProfilePhotoKeyPath() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateOwnership("user-123", "user-123/folder/avatar.webp")
        );

        assertEquals("Profile photo key format is invalid.", exception.getMessage());
    }

    @Test
    void shouldAcceptUppercaseSupportedExtension() {
        String key = validator.validateOwnership("user-123", "user-123/avatar-photo.PNG");

        assertEquals("user-123/avatar-photo.PNG", key);
    }

    @Test
    void shouldRejectProfilePhotoKeyWithoutExtension() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateOwnership("user-123", "user-123/avatar-photo")
        );

        assertEquals("Profile photo key format is invalid.", exception.getMessage());
    }

    @Test
    void shouldRejectProfilePhotoKeyWithUnsupportedExtension() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateOwnership("user-123", "user-123/avatar-photo.gif")
        );

        assertEquals("Profile photo key format is invalid.", exception.getMessage());
    }

    @Test
    void shouldRejectProfilePhotoKeyWithInvalidCharacters() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateOwnership("user-123", "user-123/avatar photo.webp")
        );

        assertEquals("Profile photo key format is invalid.", exception.getMessage());
    }
}

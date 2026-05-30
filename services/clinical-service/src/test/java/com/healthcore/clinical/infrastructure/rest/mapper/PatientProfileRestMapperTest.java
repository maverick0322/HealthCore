package com.healthcore.clinical.infrastructure.rest.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;

class PatientProfileRestMapperTest {

    private final PatientProfileRestMapper mapper = new PatientProfileRestMapper();

    @Test
    void shouldMapRequestToDomain() {
        CreateProfileRequest request = new CreateProfileRequest(
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                LocalDate.of(1990, 1, 1),
                "male",
                "moderately_active",
                "weight-loss",
                "omnivore",
                List.of("gluten"),
                List.of("cebolla")
        );

        PatientProfile profile = mapper.toDomain("user-123", request);

        assertEquals("user-123", profile.getUserId());
        assertEquals(Gender.MALE, profile.getGender());
        assertEquals(ActivityLevel.MODERATELY_ACTIVE, profile.getActivityLevel());
    }

    @Test
    void shouldMapDomainToResponse() {
        PatientProfile profile = new PatientProfile(
                "user-123",
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                LocalDate.of(1990, 1, 1),
                Gender.MALE,
                ActivityLevel.MODERATELY_ACTIVE,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of()
        );

        var response = mapper.toResponse(profile, "https://cdn.example.com/avatar.webp");

        assertEquals("Carlos Gomez", response.fullName());
        assertEquals("https://cdn.example.com/avatar.webp", response.profilePhotoUrl());
        assertTrue(response.profileCompleted());
    }
}

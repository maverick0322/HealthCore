package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicalTime;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class PatientProfileMongoMapperTest {

    private final PatientProfileMongoMapper mapper = new PatientProfileMongoMapper();

    @Test
    void shouldMapPatientProfileToMongoDocument() {
        PatientProfile profile = PatientProfile.rehydrate(
                "user-integration-1",
                "Carlos",
                "Gomez",
                null,
                75.0,
                180.0,
                LocalDate.of(1990, 5, 20),
                Gender.MALE,
                ActivityLevel.MODERATELY_ACTIVE,
                "weight-loss",
                "omnivore",
                List.of("nuts"),
                List.of("Soda"),
                List.of(new WeightRecord(75.0, ClinicalTime.today().minusDays(7))),
                "nutritionist-1",
                "user-integration-1/avatar.webp"
        );

        PatientProfileDocument document = mapper.toDocument(profile);

        assertEquals("user-integration-1", document.getUserId());
        assertEquals("Carlos", document.getFirstName());
        assertEquals("MALE", document.getGender());
        assertEquals("MODERATELY_ACTIVE", document.getActivityLevel());
        assertEquals("user-integration-1/avatar.webp", document.getProfilePhotoKey());
    }

    @Test
    void shouldMapMongoDocumentToPatientProfile() {
        PatientProfileDocument document = new PatientProfileDocument();
        document.setUserId("user-integration-1");
        document.setFirstName("Carlos");
        document.setPaternalLastName("Gomez");
        document.setWeightKg(73.5);
        document.setHeightCm(180.0);
        document.setBirthDate(LocalDate.of(1990, 5, 20));
        document.setGender("MALE");
        document.setActivityLevel("MODERATELY_ACTIVE");
        document.setGoal("weight-loss");
        document.setDietType("omnivore");
        document.setAllergies(List.of("nuts"));
        document.setExcludedFoods(List.of("Soda"));
        document.setWeightHistory(List.of(
                new WeightRecord(75.0, ClinicalTime.today().minusDays(7)),
                new WeightRecord(73.5, ClinicalTime.today())
        ));
        document.setNutritionistId("nutritionist-1");
        document.setProfilePhotoKey("user-integration-1/avatar.webp");

        PatientProfile profile = mapper.toDomain(document);

        assertEquals("user-integration-1", profile.getUserId());
        assertEquals("Carlos", profile.getFirstName());
        assertEquals(73.5, profile.getWeightKg());
        assertNotNull(profile.getWeightHistory());
        assertEquals(2, profile.getWeightHistory().size());
    }
}

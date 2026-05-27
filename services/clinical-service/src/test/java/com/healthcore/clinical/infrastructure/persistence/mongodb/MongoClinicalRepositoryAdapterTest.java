package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicalTime;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataMongoTest
@Testcontainers(disabledWithoutDocker = true)
@Import(MongoClinicalRepositoryAdapter.class) 
class MongoClinicalRepositoryAdapterTest {

    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:7.0");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    @Autowired
    private MongoClinicalRepositoryAdapter repositoryAdapter;

    @Autowired
    private SpringDataMongoPatientProfileRepository mongoRepository;

    @AfterEach
    void cleanUp() {
        mongoRepository.deleteAll(); 
    }

    @Test
    void shouldSaveAndRetrievePatientProfileWithWeightHistory() {
        PatientProfile newProfile = PatientProfile.rehydrate(
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
                List.of(),
                List.of(),
                List.of(new com.healthcore.clinical.domain.model.WeightRecord(75.0, ClinicalTime.today().minusDays(7))),
                null,
                "user-integration-1/avatar.webp"
        );
        
        newProfile.registerWeight(73.5, ClinicalTime.today());

        repositoryAdapter.save(newProfile);
        Optional<PatientProfile> retrievedProfileOpt = repositoryAdapter.findByUserId("user-integration-1");

        assertTrue(retrievedProfileOpt.isPresent(), "Profile should be present in the database");
        
        PatientProfile retrievedProfile = retrievedProfileOpt.get();
        assertEquals("user-integration-1", retrievedProfile.getUserId());
        assertEquals(73.5, retrievedProfile.getWeightKg(), "The current weight should be the updated one");
        
        assertNotNull(retrievedProfile.getWeightHistory());
        assertEquals(2, retrievedProfile.getWeightHistory().size(), "Weight history should have 2 records in MongoDB");
        assertEquals(75.0, retrievedProfile.getWeightHistory().get(0).weightKg());
        assertEquals(73.5, retrievedProfile.getWeightHistory().get(1).weightKg());
        assertEquals("user-integration-1/avatar.webp", retrievedProfile.getProfilePhotoKey());
    }
}

package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicalTime;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MongoClinicalRepositoryAdapterTest {

    @Mock
    private SpringDataMongoPatientProfileRepository patientRepository;

    @InjectMocks
    private MongoClinicalRepositoryAdapter repositoryAdapter;

    @Test
    void shouldMapPatientProfileToMongoDocumentWhenSaving() {
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

        profile.registerWeight(73.5, ClinicalTime.today());

        when(patientRepository.save(any(PatientProfileDocument.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        repositoryAdapter.save(profile);

        ArgumentCaptor<PatientProfileDocument> captor = ArgumentCaptor.forClass(PatientProfileDocument.class);
        verify(patientRepository).save(captor.capture());

        PatientProfileDocument savedDocument = captor.getValue();
        assertEquals("user-integration-1", savedDocument.getUserId());
        assertEquals("Carlos", savedDocument.getFirstName());
        assertEquals(73.5, savedDocument.getWeightKg());
        assertEquals(180.0, savedDocument.getHeightCm());
        assertEquals("MALE", savedDocument.getGender());
        assertEquals("MODERATELY_ACTIVE", savedDocument.getActivityLevel());
        assertEquals("nutritionist-1", savedDocument.getNutritionistId());
        assertEquals("user-integration-1/avatar.webp", savedDocument.getProfilePhotoKey());
        assertNotNull(savedDocument.getWeightHistory());
        assertEquals(2, savedDocument.getWeightHistory().size());
    }

    @Test
    void shouldMapMongoDocumentToPatientProfileWhenFindingByUserId() {
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

        when(patientRepository.findById("user-integration-1")).thenReturn(Optional.of(document));

        Optional<PatientProfile> retrievedProfile = repositoryAdapter.findByUserId("user-integration-1");

        assertTrue(retrievedProfile.isPresent());
        assertEquals("user-integration-1", retrievedProfile.get().getUserId());
        assertEquals("Carlos", retrievedProfile.get().getFirstName());
        assertEquals(73.5, retrievedProfile.get().getWeightKg());
        assertEquals(2, retrievedProfile.get().getWeightHistory().size());
        assertEquals("nutritionist-1", retrievedProfile.get().getNutritionistId());
        assertEquals("user-integration-1/avatar.webp", retrievedProfile.get().getProfilePhotoKey());
    }

    @Test
    void shouldMapAllPatientsForNutritionist() {
        PatientProfileDocument first = new PatientProfileDocument();
        first.setUserId("patient-1");
        first.setFirstName("Ana");
        first.setPaternalLastName("Lopez");
        first.setWeightKg(60.0);
        first.setHeightCm(165.0);
        first.setBirthDate(LocalDate.of(1995, 4, 15));
        first.setGender("FEMALE");
        first.setActivityLevel("LIGHTLY_ACTIVE");
        first.setGoal("health");
        first.setDietType("omnivore");
        first.setAllergies(List.of());
        first.setExcludedFoods(List.of());
        first.setWeightHistory(List.of(new WeightRecord(60.0, ClinicalTime.today())));
        first.setNutritionistId("nutritionist-1");

        PatientProfileDocument second = new PatientProfileDocument();
        second.setUserId("patient-2");
        second.setFirstName("Luis");
        second.setPaternalLastName("Perez");
        second.setWeightKg(82.0);
        second.setHeightCm(178.0);
        second.setBirthDate(LocalDate.of(1988, 9, 10));
        second.setGender("MALE");
        second.setActivityLevel("SEDENTARY");
        second.setGoal("weight-loss");
        second.setDietType("vegetarian");
        second.setAllergies(List.of("gluten"));
        second.setExcludedFoods(List.of("Milk"));
        second.setWeightHistory(List.of(new WeightRecord(82.0, ClinicalTime.today())));
        second.setNutritionistId("nutritionist-1");
        second.setProfilePhotoKey("patient-2/profile.webp");

        when(patientRepository.findAllByNutritionistId("nutritionist-1"))
                .thenReturn(List.of(first, second));

        List<PatientProfile> patients = repositoryAdapter.findAllByNutritionistId("nutritionist-1");

        assertEquals(2, patients.size());
        assertEquals("patient-1", patients.get(0).getUserId());
        assertEquals("Ana", patients.get(0).getFirstName());
        assertEquals("patient-2", patients.get(1).getUserId());
        assertEquals("patient-2/profile.webp", patients.get(1).getProfilePhotoKey());
    }
}

package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicalTime;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientWeightApplicationServiceTest {

    @Mock
    private ClinicalRepositoryPort repositoryPort;

    @Test
    void shouldUpdateWeightAndPersistProfile() {
        PatientProfile profile = createPatientProfile("user-123");
        PatientWeightApplicationService service = new PatientWeightApplicationService(
                new PatientProfileAccessService(repositoryPort)
        );
        LocalDate targetDate = ClinicalTime.today();

        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        HealthGoal newGoal = service.updateWeight("user-123", 75.0, targetDate);

        assertNotNull(newGoal);
        assertEquals(75.0, profile.getWeightKg());
        assertEquals(targetDate, profile.getWeightHistory().get(1).date());
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldReturnWeightHistoryForLinkedPatientWhenNutritionistOwnsProfile() {
        PatientProfile profile = createPatientProfile("patient-123");
        profile.assignNutritionist("nutri-123");
        profile.registerWeight(72.5, ClinicalTime.today());
        PatientWeightApplicationService service = new PatientWeightApplicationService(
                new PatientProfileAccessService(repositoryPort)
        );

        when(repositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));

        List<WeightRecord> history = service.getWeightHistoryForNutritionist("nutri-123", "patient-123");

        assertEquals(2, history.size());
        assertEquals(72.5, history.get(1).weightKg());
    }

    private PatientProfile createPatientProfile(String userId) {
        return PatientProfile.rehydrate(
                userId,
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                ClinicalTime.today().minusYears(25),
                Gender.MALE,
                ActivityLevel.SEDENTARY,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of(),
                List.of(new WeightRecord(70.0, ClinicalTime.today().minusDays(7))),
                null,
                null
        );
    }
}

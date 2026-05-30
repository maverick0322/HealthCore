package com.healthcore.clinical.application.service;

import com.healthcore.clinical.application.service.support.ProfilePhotoKeyValidator;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicalTime;
import com.healthcore.clinical.domain.model.Gender;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientProfileApplicationServiceTest {

    @Mock
    private ClinicalRepositoryPort repositoryPort;

    @Test
    void shouldUpdatePatientProfile() {
        PatientProfile existingProfile = createPatientProfile("user-123");
        PatientProfile updatedProfile = new PatientProfile(
                "user-123",
                "Elena",
                "Solis",
                "Ramos",
                68.0,
                168.0,
                LocalDate.of(1994, 6, 10),
                Gender.FEMALE,
                ActivityLevel.VERY_ACTIVE,
                "performance",
                "vegan",
                List.of("gluten"),
                List.of("cebolla")
        );
        PatientProfileApplicationService service = new PatientProfileApplicationService(
                new PatientProfileAccessService(repositoryPort),
                new ProfilePhotoKeyValidator()
        );

        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(existingProfile));
        when(repositoryPort.save(existingProfile)).thenReturn(existingProfile);

        PatientProfile result = service.updateProfile("user-123", updatedProfile);

        assertEquals("Elena", result.getFirstName());
        assertEquals("performance", result.getGoal());
        verify(repositoryPort).save(existingProfile);
    }

    @Test
    void shouldUpdatePatientMetricsForLinkedNutritionist() {
        PatientProfile profile = createPatientProfile("patient-123");
        profile.assignNutritionist("nutri-123");
        PatientProfileApplicationService service = new PatientProfileApplicationService(
                new PatientProfileAccessService(repositoryPort),
                new ProfilePhotoKeyValidator()
        );

        when(repositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));
        when(repositoryPort.save(profile)).thenReturn(profile);

        PatientProfile result = service.updatePatientMetricsForNutritionist("nutri-123", "patient-123", 74.5, 180.0);

        assertEquals(74.5, result.getWeightKg());
        assertEquals(180.0, result.getHeightCm());
        verify(repositoryPort).save(profile);
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

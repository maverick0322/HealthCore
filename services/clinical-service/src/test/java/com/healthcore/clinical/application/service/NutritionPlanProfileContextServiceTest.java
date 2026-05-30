package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionPlanProfileContextServiceTest {

    @Mock
    private ClinicalRepositoryPort clinicalRepositoryPort;

    @Test
    void shouldThrowWhenPatientClinicalProfileDoesNotExist() {
        NutritionPlanProfileContextService service = new NutritionPlanProfileContextService(clinicalRepositoryPort);
        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.empty());

        ProfileNotFoundException exception = assertThrows(
                ProfileNotFoundException.class,
                () -> service.getRequiredProfile("patient-1")
        );

        assertEquals("Patient clinical profile not found.", exception.getMessage());
    }

    @Test
    void shouldRejectNutritionistAccessWhenPatientBelongsToAnotherNutritionist() {
        NutritionPlanProfileContextService service = new NutritionPlanProfileContextService(clinicalRepositoryPort);
        PatientProfile patientProfile = createPatientProfile("patient-1", "nutri-999");
        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(patientProfile));

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> service.getProfileForNutritionist("nutri-1", "patient-1")
        );

        assertEquals("Action denied: Patient is not linked to this nutritionist.", exception.getMessage());
    }

    private PatientProfile createPatientProfile(String userId, String nutritionistId) {
        PatientProfile profile = new PatientProfile(
                userId,
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                LocalDate.now().minusYears(25),
                Gender.MALE,
                ActivityLevel.SEDENTARY,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of()
        );
        profile.setNutritionistId(nutritionistId);
        return profile;
    }
}

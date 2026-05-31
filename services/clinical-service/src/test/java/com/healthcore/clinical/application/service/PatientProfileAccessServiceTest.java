package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
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
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientProfileAccessServiceTest {

    @Mock
    private ClinicalRepositoryPort repositoryPort;

    @Test
    void shouldThrowProfileNotFoundWhenPatientDoesNotExist() {
        PatientProfileAccessService service = new PatientProfileAccessService(repositoryPort);
        when(repositoryPort.findByUserId("ghost-user")).thenReturn(Optional.empty());

        ProfileNotFoundException exception = assertThrows(
                ProfileNotFoundException.class,
                () -> service.requireByUserId("ghost-user")
        );

        assertEquals("Profile not found for user: ghost-user", exception.getMessage());
    }

    @Test
    void shouldRejectPatientLinkedToDifferentNutritionist() {
        PatientProfileAccessService service = new PatientProfileAccessService(repositoryPort);
        PatientProfile profile = createPatientProfile("patient-123");
        profile.assignNutritionist("nutri-999");
        when(repositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> service.requireForNutritionist("nutri-123", "patient-123")
        );

        assertEquals("Action denied: Patient is not linked to this nutritionist.", exception.getMessage());
    }

    @Test
    void shouldReturnExistingPatientWhenRequiredByUserId() {
        PatientProfileAccessService service = new PatientProfileAccessService(repositoryPort);
        PatientProfile profile = createPatientProfile("patient-123");
        when(repositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));

        PatientProfile result = service.requireByUserId("patient-123");

        assertSame(profile, result);
    }

    @Test
    void shouldReturnPatientWhenLinkedToRequestedNutritionist() {
        PatientProfileAccessService service = new PatientProfileAccessService(repositoryPort);
        PatientProfile profile = createPatientProfile("patient-123");
        profile.assignNutritionist("nutri-123");
        when(repositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));

        PatientProfile result = service.requireForNutritionist("nutri-123", "patient-123");

        assertSame(profile, result);
    }

    @Test
    void shouldRejectPatientWithoutLinkedNutritionist() {
        PatientProfileAccessService service = new PatientProfileAccessService(repositoryPort);
        PatientProfile profile = createPatientProfile("patient-123");
        when(repositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> service.requireForNutritionist("nutri-123", "patient-123")
        );

        assertEquals("Action denied: Patient is not linked to this nutritionist.", exception.getMessage());
    }

    @Test
    void shouldDelegateFindByUserId() {
        PatientProfileAccessService service = new PatientProfileAccessService(repositoryPort);
        PatientProfile profile = createPatientProfile("patient-123");
        when(repositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));

        Optional<PatientProfile> result = service.findByUserId("patient-123");

        assertEquals(Optional.of(profile), result);
    }

    @Test
    void shouldDelegateFindAllByNutritionistId() {
        PatientProfileAccessService service = new PatientProfileAccessService(repositoryPort);
        List<PatientProfile> profiles = List.of(createPatientProfile("patient-123"));
        when(repositoryPort.findAllByNutritionistId("nutri-123")).thenReturn(profiles);

        List<PatientProfile> result = service.findAllByNutritionistId("nutri-123");

        assertEquals(profiles, result);
    }

    @Test
    void shouldDelegateSave() {
        PatientProfileAccessService service = new PatientProfileAccessService(repositoryPort);
        PatientProfile profile = createPatientProfile("patient-123");
        when(repositoryPort.save(profile)).thenReturn(profile);

        PatientProfile result = service.save(profile);

        assertSame(profile, result);
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

package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.NutritionistProfileRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClinicalApplicationServiceTest {

    @Mock
    private ClinicalRepositoryPort repositoryPort;

    @Mock
    private NutritionistProfileRepositoryPort nutritionistRepositoryPort;

    @InjectMocks
    private ClinicalApplicationService service;

    @Test
    void shouldCreateProfile() {
        PatientProfile profile = createPatientProfile("user-123");

        when(repositoryPort.save(any(PatientProfile.class))).thenReturn(profile);

        PatientProfile savedProfile = service.createProfile(profile);

        assertNotNull(savedProfile);
        assertEquals("user-123", savedProfile.getUserId());
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldGetProfileByUserId() {
        PatientProfile profile = createPatientProfile("user-123");
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        Optional<PatientProfile> result = service.getProfileByUserId("user-123");

        assertTrue(result.isPresent());
        assertEquals("user-123", result.get().getUserId());
    }

    @Test
    void shouldUpdateWeightAndRecalculateGoals() {
        PatientProfile profile = createPatientProfile("user-123");
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        HealthGoal newGoal = service.updateWeight("user-123", 75.0);

        assertNotNull(newGoal);
        assertEquals(75.0, profile.getWeightKg());
        assertEquals(2, profile.getWeightHistory().size());
        verify(repositoryPort).save(profile);
    }

    @Test
    void shouldThrowProfileNotFoundExceptionWhenUpdatingUnknownUser() {
        when(repositoryPort.findByUserId("ghost-user")).thenReturn(Optional.empty());

        assertThrows(ProfileNotFoundException.class, () -> service.updateWeight("ghost-user", 80.0));
        verify(repositoryPort, never()).save(any());
    }

    @Test
    void shouldGetWeightHistory() {
        PatientProfile profile = createPatientProfile("user-123");
        profile.updateWeight(68.0);

        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        List<WeightRecord> history = service.getWeightHistory("user-123");

        assertNotNull(history);
        assertEquals(2, history.size());
        assertEquals(68.0, history.get(1).weightKg());
    }

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

        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(existingProfile));
        when(repositoryPort.save(existingProfile)).thenReturn(existingProfile);

        PatientProfile result = service.updateProfile("user-123", updatedProfile);

        assertEquals("Elena", result.getFirstName());
        assertEquals("performance", result.getGoal());
        verify(repositoryPort).save(existingProfile);
    }

    @Test
    void shouldCreateNutritionistProfile() {
        NutritionistProfile profile = createNutritionistProfile("nutri-123");
        when(nutritionistRepositoryPort.save(profile)).thenReturn(profile);

        NutritionistProfile savedProfile = service.createNutritionistProfile(profile);

        assertEquals("nutri-123", savedProfile.getUserId());
        verify(nutritionistRepositoryPort).save(profile);
    }

    @Test
    void shouldUpdateNutritionistProfile() {
        NutritionistProfile existingProfile = createNutritionistProfile("nutri-123");
        NutritionistProfile updatedProfile = new NutritionistProfile(
                "nutri-123",
                "Daniela",
                "Lopez",
                "Mora",
                List.of("SPORTS", "OTHER"),
                "Nutricion funcional",
                "123456789",
                List.of("ONLINE"),
                "5512345678",
                new ClinicAddress("03100", "CDMX", "Benito Juarez", "Narvarte", "Xola", "456", "7B"),
                "Bio actualizada"
        );

        when(nutritionistRepositoryPort.findByUserId("nutri-123")).thenReturn(Optional.of(existingProfile));
        when(nutritionistRepositoryPort.save(existingProfile)).thenReturn(existingProfile);

        NutritionistProfile result = service.updateNutritionistProfile("nutri-123", updatedProfile);

        assertEquals("Daniela", result.getFirstName());
        assertEquals(List.of("ONLINE"), result.getConsultationTypes());
        verify(nutritionistRepositoryPort).save(existingProfile);
    }

    private PatientProfile createPatientProfile(String userId) {
        return new PatientProfile(
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
    }

    private NutritionistProfile createNutritionistProfile(String userId) {
        return new NutritionistProfile(
                userId,
                "Daniel",
                "Martinez",
                null,
                List.of("CLINICAL"),
                null,
                "12345678",
                List.of("PRESENTIAL", "ONLINE"),
                "5512345678",
                new ClinicAddress("03100", "CDMX", "Benito Juarez", "Narvarte", "Xola", "123", null),
                "Especialista en nutricion clinica."
        );
    }
}

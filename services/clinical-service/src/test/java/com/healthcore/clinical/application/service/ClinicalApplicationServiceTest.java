package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
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

    @InjectMocks
    private ClinicalApplicationService service; 

    @Test
    void shouldCreateProfile() {
        PatientProfile profile = new PatientProfile("user-123", 70.0, 175.0, LocalDate.now(), Gender.MALE, ActivityLevel.SEDENTARY);
        
        when(repositoryPort.save(any(PatientProfile.class))).thenReturn(profile);

        PatientProfile savedProfile = service.createProfile(profile);

        assertNotNull(savedProfile);
        assertEquals("user-123", savedProfile.getUserId());
        
        verify(repositoryPort, times(1)).save(profile);
    }

    @Test
    void shouldGetProfileByUserId() {
        PatientProfile profile = new PatientProfile("user-123", 70.0, 175.0, LocalDate.now(), Gender.MALE, ActivityLevel.SEDENTARY);
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        Optional<PatientProfile> result = service.getProfileByUserId("user-123");

        assertTrue(result.isPresent());
        assertEquals("user-123", result.get().getUserId());
    }

    @Test
    void shouldUpdateWeightAndRecalculateGoals() {
        PatientProfile profile = new PatientProfile("user-123", 70.0, 175.0, LocalDate.now(), Gender.MALE, ActivityLevel.SEDENTARY);
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        HealthGoal newGoal = service.updateWeight("user-123", 75.0);

        assertNotNull(newGoal);
        assertEquals(75.0, profile.getWeightKg());
        assertEquals(2, profile.getWeightHistory().size());
        verify(repositoryPort, times(1)).save(profile);
    }

    @Test
    void shouldThrowProfileNotFoundExceptionWhenUpdatingUnknownUser() {
        when(repositoryPort.findByUserId("ghost-user")).thenReturn(Optional.empty());

        assertThrows(ProfileNotFoundException.class, () -> {
            service.updateWeight("ghost-user", 80.0);
        });
        
        verify(repositoryPort, never()).save(any());
    }

    @Test
    void shouldGetWeightHistory() {
        PatientProfile profile = new PatientProfile("user-123", 70.0, 175.0, LocalDate.now(), Gender.MALE, ActivityLevel.SEDENTARY);
        profile.updateWeight(68.0);
        
        when(repositoryPort.findByUserId("user-123")).thenReturn(Optional.of(profile));

        List<WeightRecord> history = service.getWeightHistory("user-123");

        assertNotNull(history);
        assertEquals(2, history.size());
        assertEquals(68.0, history.get(1).weightKg());
    }
}
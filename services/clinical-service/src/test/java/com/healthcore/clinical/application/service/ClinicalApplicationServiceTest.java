package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
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
    void shouldCreateOrUpdateProfile() {
        PatientProfile profile = new PatientProfile("user-123", 70.0, 175.0, LocalDate.now(), Gender.MALE, ActivityLevel.SEDENTARY);
        
        when(repositoryPort.save(any(PatientProfile.class))).thenReturn(profile);

        PatientProfile savedProfile = service.createOrUpdateProfile(profile);

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
}
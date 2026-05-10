package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.LinkingCode;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.LinkingCodeRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LinkingApplicationServiceTest {

    @Mock
    private LinkingCodeRepositoryPort linkingCodeRepositoryPort;

    @Mock
    private ClinicalRepositoryPort clinicalRepositoryPort;

    @InjectMocks
    private LinkingApplicationService service;

    private PatientProfile testProfile;

    @BeforeEach
    void setUp() {
        testProfile = new PatientProfile(
                "patient-123",
                70.0,
                175.0,
                LocalDate.of(1990, 1, 1),
                Gender.MALE,
                ActivityLevel.MODERATELY_ACTIVE
        );
    }

    @Test
    void generateLinkingCode_ReturnsCodeOfLength6() {
        String nutriId = "nutri-456";
        when(linkingCodeRepositoryPort.findByNutritionistId(nutriId)).thenReturn(Optional.empty());
        when(linkingCodeRepositoryPort.save(any(LinkingCode.class))).thenAnswer(i -> i.getArgument(0));

        LinkingCode result = service.generateLinkingCode(nutriId);

        assertNotNull(result);
        assertEquals(6, result.getCode().length());
        assertEquals(nutriId, result.getNutritionistId());
        verify(linkingCodeRepositoryPort, times(1)).save(any(LinkingCode.class));
    }

    @Test
    void linkPatient_Success() {
        String code = "A1B2C3";
        LinkingCode linkingCode = new LinkingCode(code, "nutri-456", LocalDateTime.now());

        when(linkingCodeRepositoryPort.findByCode(code)).thenReturn(Optional.of(linkingCode));
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));

        service.linkPatient("patient-123", code);

        assertEquals("nutri-456", testProfile.getNutritionistId());
        verify(clinicalRepositoryPort, times(1)).save(testProfile);
    }

    @Test
    void linkPatient_ThrowsException_WhenAlreadyLinked() {
        String code = "A1B2C3";
        LinkingCode linkingCode = new LinkingCode(code, "nutri-456", LocalDateTime.now());
        testProfile.assignNutritionist("nutri-999"); // Already linked

        when(linkingCodeRepositoryPort.findByCode(code)).thenReturn(Optional.of(linkingCode));
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));

        assertThrows(IllegalStateException.class, () -> service.linkPatient("patient-123", code));
        verify(clinicalRepositoryPort, never()).save(any());
    }

    @Test
    void linkPatient_ThrowsException_WhenCodeIsInvalid() {
        when(linkingCodeRepositoryPort.findByCode("INVALID")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.linkPatient("patient-123", "INVALID"));
        verify(clinicalRepositoryPort, never()).findByUserId(anyString());
    }

    @Test
    void linkPatient_ThrowsException_WhenProfileNotFound() {
        String code = "A1B2C3";
        LinkingCode linkingCode = new LinkingCode(code, "nutri-456", LocalDateTime.now());

        when(linkingCodeRepositoryPort.findByCode(code)).thenReturn(Optional.of(linkingCode));
        when(clinicalRepositoryPort.findByUserId("ghost-user")).thenReturn(Optional.empty());

        assertThrows(ProfileNotFoundException.class, () -> service.linkPatient("ghost-user", code));
        verify(clinicalRepositoryPort, never()).save(any());
    }

    @Test
    void unlinkNutritionist_ThrowsException_WhenNotTheOwner() {
        testProfile.assignNutritionist("nutri-777"); 
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));

        assertThrows(IllegalStateException.class, () -> service.unlinkNutritionist("nutri-FAKE", "patient-123"));
        verify(clinicalRepositoryPort, never()).save(any());
    }
}
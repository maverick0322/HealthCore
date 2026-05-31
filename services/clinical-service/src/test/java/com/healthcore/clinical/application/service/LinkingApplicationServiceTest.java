package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.AlreadyLinkedToNutritionistException;
import com.healthcore.clinical.domain.exception.AgendaServiceUnavailableException;
import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.LinkingCode;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.in.ManageNutritionPlanUseCase;
import com.healthcore.clinical.domain.port.out.AgendaLifecyclePort;
import com.healthcore.clinical.domain.port.out.ClinicalObservationRepositoryPort;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.LinkingCodeRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
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

    @Mock
    private ManageNutritionPlanUseCase manageNutritionPlanUseCase;

    @Mock
    private ClinicalObservationRepositoryPort clinicalObservationRepositoryPort;

    @Mock
    private AgendaLifecyclePort agendaLifecyclePort;

    @InjectMocks
    private LinkingApplicationService service;

    private PatientProfile testProfile;

    @BeforeEach
    void setUp() {
        testProfile = new PatientProfile(
                "patient-123",
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                LocalDate.of(1990, 1, 1),
                Gender.MALE,
                ActivityLevel.MODERATELY_ACTIVE,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of()
        );
    }

    @Test
    void generateLinkingCode_ReturnsCodeOfLength6() {
        String nutriId = "nutri-456";
        when(linkingCodeRepositoryPort.findByCode(anyString())).thenReturn(Optional.empty());
        when(linkingCodeRepositoryPort.save(any(LinkingCode.class))).thenAnswer(i -> i.getArgument(0));

        LinkingCode result = service.generateLinkingCode(nutriId);

        assertNotNull(result);
        assertEquals(6, result.getCode().length());
        assertEquals(nutriId, result.getNutritionistId());
        verify(linkingCodeRepositoryPort, times(1)).deleteByNutritionistId(nutriId);
        verify(linkingCodeRepositoryPort, times(1)).save(any(LinkingCode.class));
    }

    @Test
    void generateLinkingCode_Retries_WhenSaveCollides() {
        String nutriId = "nutri-456";
        when(linkingCodeRepositoryPort.findByCode(anyString())).thenReturn(Optional.empty());
        when(linkingCodeRepositoryPort.save(any(LinkingCode.class)))
                .thenThrow(new DuplicateKeyException("duplicate"))
                .thenAnswer(i -> i.getArgument(0));

        LinkingCode result = service.generateLinkingCode(nutriId);

        assertNotNull(result);
        verify(linkingCodeRepositoryPort, times(2)).save(any(LinkingCode.class));
    }

    @Test
    void generateLinkingCode_Retries_WhenGeneratedCandidateAlreadyExists() {
        String nutriId = "nutri-456";
        when(linkingCodeRepositoryPort.findByCode(anyString()))
                .thenReturn(Optional.of(new LinkingCode("EXISTS1", nutriId, LocalDateTime.now())))
                .thenReturn(Optional.of(new LinkingCode("EXISTS2", nutriId, LocalDateTime.now())))
                .thenReturn(Optional.empty());
        when(linkingCodeRepositoryPort.save(any(LinkingCode.class))).thenAnswer(i -> i.getArgument(0));

        LinkingCode result = service.generateLinkingCode(nutriId);

        assertNotNull(result);
        verify(linkingCodeRepositoryPort, times(3)).findByCode(anyString());
        verify(linkingCodeRepositoryPort).save(any(LinkingCode.class));
    }

    @Test
    void generateLinkingCode_ThrowsWhenAllSaveAttemptsCollide() {
        String nutriId = "nutri-456";
        when(linkingCodeRepositoryPort.findByCode(anyString())).thenReturn(Optional.empty());
        when(linkingCodeRepositoryPort.save(any(LinkingCode.class)))
                .thenThrow(new DuplicateKeyException("duplicate"));

        assertThrows(DuplicateKeyException.class, () -> service.generateLinkingCode(nutriId));

        verify(linkingCodeRepositoryPort, times(10)).save(any(LinkingCode.class));
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
    void linkPatient_UsesUppercaseCodeLookup() {
        LinkingCode linkingCode = new LinkingCode("A1B2C3", "nutri-456", LocalDateTime.now());

        when(linkingCodeRepositoryPort.findByCode("A1B2C3")).thenReturn(Optional.of(linkingCode));
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));

        service.linkPatient("patient-123", "a1b2c3");

        verify(linkingCodeRepositoryPort).findByCode("A1B2C3");
        verify(clinicalRepositoryPort).save(testProfile);
    }

    @Test
    void linkPatient_ThrowsException_WhenAlreadyLinkedToAnotherNutritionist() {
        String code = "A1B2C3";
        LinkingCode linkingCode = new LinkingCode(code, "nutri-456", LocalDateTime.now());
        testProfile.assignNutritionist("nutri-999"); // Already linked to another

        when(linkingCodeRepositoryPort.findByCode(code)).thenReturn(Optional.of(linkingCode));
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));

        assertThrows(AlreadyLinkedToNutritionistException.class, () -> service.linkPatient("patient-123", code));
        verify(clinicalRepositoryPort, never()).save(any());
    }

    @Test
    void linkPatient_Success_WhenAlreadyLinkedToSameNutritionist() {
        String code = "A1B2C3";
        LinkingCode linkingCode = new LinkingCode(code, "nutri-456", LocalDateTime.now());
        testProfile.assignNutritionist("nutri-456"); // Already linked to same

        when(linkingCodeRepositoryPort.findByCode(code)).thenReturn(Optional.of(linkingCode));
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));

        service.linkPatient("patient-123", code);

        // Should not change since already linked to same nutritionist
        assertEquals("nutri-456", testProfile.getNutritionistId());
        verify(clinicalRepositoryPort, never()).save(any());
    }

    @Test
    void linkPatient_ThrowsException_WhenCodeIsInvalid() {
        when(linkingCodeRepositoryPort.findByCode("INVALID")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.linkPatient("patient-123", "INVALID"));
        verify(clinicalRepositoryPort, never()).findByUserId(anyString());
    }

    @Test
    void linkPatient_ThrowsException_WhenCodeIsExpired() {
        String code = "A1B2C3";
        LinkingCode expiredCode = new LinkingCode(code, "nutri-456", LocalDateTime.now().minusMinutes(16));

        when(linkingCodeRepositoryPort.findByCode(code)).thenReturn(Optional.of(expiredCode));

        assertThrows(IllegalArgumentException.class, () -> service.linkPatient("patient-123", code));
        verify(linkingCodeRepositoryPort).deleteByCode(code);
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

    @Test
    void unlinkPatient_ArchivesPlansAfterSuccessfulUnlink() {
        testProfile.assignNutritionist("nutri-777");
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));

        service.unlinkPatient("patient-123");

        verify(agendaLifecyclePort).cancelFutureAppointmentsForUnlink(
                "patient-123",
                "nutri-777",
                "patient-123",
                "PATIENT_UNLINKED"
        );
        verify(clinicalRepositoryPort).save(testProfile);
        verify(manageNutritionPlanUseCase).archivePlansAfterUnlink("patient-123", "nutri-777");
        verify(clinicalObservationRepositoryPort).deleteAllByPatientId("patient-123");
    }

    @Test
    void unlinkPatient_SavesProfileWithoutCleanupWhenNoNutritionistIsAssigned() {
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));

        service.unlinkPatient("patient-123");

        assertNull(testProfile.getNutritionistId());
        verify(agendaLifecyclePort, never()).cancelFutureAppointmentsForUnlink(anyString(), anyString(), anyString(), anyString());
        verify(clinicalRepositoryPort).save(testProfile);
        verify(manageNutritionPlanUseCase, never()).archivePlansAfterUnlink(anyString(), anyString());
        verify(clinicalObservationRepositoryPort, never()).deleteAllByPatientId(anyString());
    }

    @Test
    void unlinkNutritionist_ArchivesPlansAfterSuccessfulUnlink() {
        testProfile.assignNutritionist("nutri-777");
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));

        service.unlinkNutritionist("nutri-777", "patient-123");

        verify(agendaLifecyclePort).cancelFutureAppointmentsForUnlink(
                "patient-123",
                "nutri-777",
                "nutri-777",
                "NUTRITIONIST_UNLINKED"
        );
        verify(clinicalRepositoryPort).save(testProfile);
        verify(manageNutritionPlanUseCase).archivePlansAfterUnlink("patient-123", "nutri-777");
        verify(clinicalObservationRepositoryPort).deleteAllByPatientId("patient-123");
    }

    @Test
    void unlinkPatient_DoesNotRemoveLink_WhenAgendaCleanupFails() {
        testProfile.assignNutritionist("nutri-777");
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));
        doThrow(new AgendaServiceUnavailableException("agenda unavailable", new RuntimeException()))
                .when(agendaLifecyclePort)
                .cancelFutureAppointmentsForUnlink("patient-123", "nutri-777", "patient-123", "PATIENT_UNLINKED");

        assertThrows(AgendaServiceUnavailableException.class, () -> service.unlinkPatient("patient-123"));

        assertEquals("nutri-777", testProfile.getNutritionistId());
        verify(clinicalRepositoryPort, never()).save(any());
        verify(manageNutritionPlanUseCase, never()).archivePlansAfterUnlink(anyString(), anyString());
        verify(clinicalObservationRepositoryPort, never()).deleteAllByPatientId(anyString());
    }

    @Test
    void unlinkNutritionist_DoesNotRemoveLink_WhenAgendaCleanupFails() {
        testProfile.assignNutritionist("nutri-777");
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(testProfile));
        doThrow(new AgendaServiceUnavailableException("agenda unavailable", new RuntimeException()))
                .when(agendaLifecyclePort)
                .cancelFutureAppointmentsForUnlink("patient-123", "nutri-777", "nutri-777", "NUTRITIONIST_UNLINKED");

        assertThrows(AgendaServiceUnavailableException.class, () -> service.unlinkNutritionist("nutri-777", "patient-123"));

        assertEquals("nutri-777", testProfile.getNutritionistId());
        verify(clinicalRepositoryPort, never()).save(any());
        verify(manageNutritionPlanUseCase, never()).archivePlansAfterUnlink(anyString(), anyString());
        verify(clinicalObservationRepositoryPort, never()).deleteAllByPatientId(anyString());
    }

    @Test
    void unlinkPatient_ThrowsException_WhenProfileNotFound() {
        when(clinicalRepositoryPort.findByUserId("ghost-user")).thenReturn(Optional.empty());

        assertThrows(ProfileNotFoundException.class, () -> service.unlinkPatient("ghost-user"));

        verify(clinicalRepositoryPort, never()).save(any());
    }

    @Test
    void unlinkNutritionist_ThrowsException_WhenProfileNotFound() {
        when(clinicalRepositoryPort.findByUserId("ghost-user")).thenReturn(Optional.empty());

        assertThrows(ProfileNotFoundException.class, () -> service.unlinkNutritionist("nutri-777", "ghost-user"));

        verify(clinicalRepositoryPort, never()).save(any());
    }

    @Test
    void getCurrentLinkingCode_ReturnsActiveCode() {
        LinkingCode activeCode = new LinkingCode("A1B2C3", "nutri-456", LocalDateTime.now().minusMinutes(5));
        when(linkingCodeRepositoryPort.findByNutritionistId("nutri-456")).thenReturn(Optional.of(activeCode));

        LinkingCode result = service.getCurrentLinkingCode("nutri-456");

        assertNotNull(result);
        assertEquals("A1B2C3", result.getCode());
        verify(linkingCodeRepositoryPort, never()).deleteByCode(anyString());
    }

    @Test
    void getCurrentLinkingCode_ReturnsNullAndDeletesExpiredCode() {
        LinkingCode expiredCode = new LinkingCode("A1B2C3", "nutri-456", LocalDateTime.now().minusMinutes(16));
        when(linkingCodeRepositoryPort.findByNutritionistId("nutri-456")).thenReturn(Optional.of(expiredCode));

        LinkingCode result = service.getCurrentLinkingCode("nutri-456");

        assertNull(result);
        verify(linkingCodeRepositoryPort).deleteByCode("A1B2C3");
    }
}

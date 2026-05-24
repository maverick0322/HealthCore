package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicalObservation;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalObservationRepositoryPort;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClinicalObservationApplicationServiceTest {

    @Mock
    private ClinicalObservationRepositoryPort observationRepositoryPort;

    @Mock
    private ClinicalRepositoryPort clinicalRepositoryPort;

    @InjectMocks
    private ClinicalObservationApplicationService service;

    @Test
    void recordObservation_Success_WhenDataIsValidAndProfileExists() {
        String patientId = "patient-123";
        String nutritionistId = "nutri-456";
        String note = "Paciente muestra mejora en hidratación.";
        
        PatientProfile mockProfile = new PatientProfile(
                patientId, 
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
        mockProfile.assignNutritionist(nutritionistId);

        when(clinicalRepositoryPort.findByUserId(patientId)).thenReturn(Optional.of(mockProfile));
        when(observationRepositoryPort.save(any(ClinicalObservation.class))).thenAnswer(invocation -> {
            ClinicalObservation obs = invocation.getArgument(0);
            obs.setId("obs-789");
            return obs;
        });

        ClinicalObservation result = service.recordObservation(patientId, nutritionistId, note);

        assertEquals("obs-789", result.getId());
        assertEquals(patientId, result.getPatientId());
        assertEquals(nutritionistId, result.getNutritionistId());
        assertEquals(note, result.getNote());
        assertNotNull(result.getCreatedAt());
        
        verify(clinicalRepositoryPort, times(1)).findByUserId(patientId);
        verify(observationRepositoryPort, times(1)).save(any(ClinicalObservation.class));
    }

    @Test
    void recordObservation_ThrowsException_WhenNoteIsEmpty() {
        String patientId = "patient-123";
        String nutritionistId = "nutri-456";
        String emptyNote = "   ";

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> 
            service.recordObservation(patientId, nutritionistId, emptyNote)
        );

        assertEquals("Observation note cannot be empty.", exception.getMessage());
        verify(clinicalRepositoryPort, never()).findByUserId(anyString());
        verify(observationRepositoryPort, never()).save(any());
    }

    @Test
    void recordObservation_ThrowsException_WhenNoteExceedsMaxLength() {
        String longNote = "a".repeat(501);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                service.recordObservation("patient-123", "nutri-456", longNote)
        );

        assertEquals("Observation note must be at most 500 characters long.", exception.getMessage());
        verify(clinicalRepositoryPort, never()).findByUserId(anyString());
        verify(observationRepositoryPort, never()).save(any());
    }

    @Test
    void recordObservation_ThrowsException_WhenPatientProfileDoesNotExist() {
        String patientId = "ghost-patient";
        String nutritionistId = "nutri-456";
        String note = "Nota válida.";

        when(clinicalRepositoryPort.findByUserId(patientId)).thenReturn(Optional.empty());

        ProfileNotFoundException exception = assertThrows(ProfileNotFoundException.class, () -> 
            service.recordObservation(patientId, nutritionistId, note)
        );

        assertEquals("Cannot add observation. Patient clinical profile not found.", exception.getMessage());
        verify(observationRepositoryPort, never()).save(any());
    }

    @Test
    void getPatientObservations_ReturnsList() {
        String patientId = "patient-123";
        List<ClinicalObservation> mockList = List.of(
            new ClinicalObservation("1", patientId, "nutri-1", "Nota 1", null),
            new ClinicalObservation("2", patientId, "nutri-2", "Nota 2", null)
        );

        when(observationRepositoryPort.findAllByPatientId(patientId)).thenReturn(mockList);

        List<ClinicalObservation> result = service.getPatientObservations(patientId);

        assertEquals(2, result.size());
        verify(observationRepositoryPort, times(1)).findAllByPatientId(patientId);
    }

    @Test
    void recordObservation_ThrowsException_WhenPatientBelongsToAnotherNutritionist() {
        String patientId = "patient-123";
        PatientProfile mockProfile = new PatientProfile(
                patientId,
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
        mockProfile.assignNutritionist("nutri-999");

        when(clinicalRepositoryPort.findByUserId(patientId)).thenReturn(Optional.of(mockProfile));

        assertThrows(AccessDeniedException.class, () ->
                service.recordObservation(patientId, "nutri-456", "Nota válida.")
        );

        verify(observationRepositoryPort, never()).save(any());
    }

    @Test
    void getPatientObservations_ReturnsListOnlyForOwningNutritionist() {
        String patientId = "patient-123";
        String nutritionistId = "nutri-456";
        PatientProfile mockProfile = new PatientProfile(
                patientId,
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
        mockProfile.assignNutritionist(nutritionistId);
        List<ClinicalObservation> mockList = List.of(
                new ClinicalObservation("1", patientId, nutritionistId, "Nota 1", null)
        );

        when(clinicalRepositoryPort.findByUserId(patientId)).thenReturn(Optional.of(mockProfile));
        when(observationRepositoryPort.findAllByPatientId(patientId)).thenReturn(mockList);

        List<ClinicalObservation> result = service.getPatientObservations(patientId, nutritionistId);

        assertEquals(1, result.size());
        verify(observationRepositoryPort).findAllByPatientId(patientId);
    }

    @Test
    void updateObservation_UpdatesOwnedObservation() {
        ClinicalObservation observation = new ClinicalObservation(
                "obs-1",
                "patient-123",
                "nutri-456",
                "Nota original",
                LocalDateTime.now()
        );
        PatientProfile profile = new PatientProfile(
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
        profile.assignNutritionist("nutri-456");

        when(observationRepositoryPort.findById("obs-1")).thenReturn(Optional.of(observation));
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));
        when(observationRepositoryPort.save(any(ClinicalObservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClinicalObservation updated = service.updateObservation("obs-1", "nutri-456", "Nota actualizada");

        assertEquals("Nota actualizada", updated.getNote());
        verify(observationRepositoryPort).save(observation);
    }

    @Test
    void deleteObservation_RemovesOwnedObservation() {
        ClinicalObservation observation = new ClinicalObservation(
                "obs-1",
                "patient-123",
                "nutri-456",
                "Nota original",
                LocalDateTime.now()
        );
        PatientProfile profile = new PatientProfile(
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
        profile.assignNutritionist("nutri-456");

        when(observationRepositoryPort.findById("obs-1")).thenReturn(Optional.of(observation));
        when(clinicalRepositoryPort.findByUserId("patient-123")).thenReturn(Optional.of(profile));

        service.deleteObservation("obs-1", "nutri-456");

        verify(observationRepositoryPort).deleteById("obs-1");
    }
}

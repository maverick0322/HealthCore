package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ClinicalObservation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MongoClinicalObservationAdapterTest {

    @Mock
    private SpringDataMongoClinicalObservationRepository repository;

    @InjectMocks
    private MongoClinicalObservationAdapter adapter;

    @Test
    void shouldMapObservationToDocumentWhenSavingAndReturnSavedDomain() {
        ClinicalObservation observation = new ClinicalObservation(
                "obs-1",
                "patient-1",
                "nutri-1",
                "Increase water intake.",
                LocalDateTime.of(2026, 5, 21, 10, 0)
        );
        ClinicalObservationDocument savedDocument = new ClinicalObservationDocument(
                "obs-1",
                "patient-1",
                "nutri-1",
                "Increase water intake.",
                LocalDateTime.of(2026, 5, 21, 10, 0)
        );

        when(repository.save(any(ClinicalObservationDocument.class))).thenReturn(savedDocument);

        ClinicalObservation result = adapter.save(observation);

        ArgumentCaptor<ClinicalObservationDocument> captor =
                ArgumentCaptor.forClass(ClinicalObservationDocument.class);
        verify(repository).save(captor.capture());
        assertEquals("obs-1", captor.getValue().getId());
        assertEquals("patient-1", captor.getValue().getPatientId());
        assertEquals("nutri-1", captor.getValue().getNutritionistId());
        assertEquals("Increase water intake.", captor.getValue().getNote());

        assertEquals("obs-1", result.getId());
        assertEquals("patient-1", result.getPatientId());
        assertEquals("nutri-1", result.getNutritionistId());
    }

    @Test
    void shouldMapObservationCollectionsAndSingleLookupToDomain() {
        ClinicalObservationDocument first = new ClinicalObservationDocument(
                "obs-1",
                "patient-1",
                "nutri-1",
                "Increase water intake.",
                LocalDateTime.of(2026, 5, 21, 10, 0)
        );
        ClinicalObservationDocument second = new ClinicalObservationDocument(
                "obs-2",
                "patient-1",
                "nutri-1",
                "Monitor breakfast adherence.",
                LocalDateTime.of(2026, 5, 20, 9, 0)
        );

        when(repository.findByPatientIdOrderByCreatedAtDesc("patient-1")).thenReturn(List.of(first, second));
        when(repository.findById("obs-1")).thenReturn(Optional.of(first));

        List<ClinicalObservation> observations = adapter.findAllByPatientId("patient-1");
        Optional<ClinicalObservation> result = adapter.findById("obs-1");

        assertEquals(2, observations.size());
        assertEquals(List.of("obs-1", "obs-2"), observations.stream().map(ClinicalObservation::getId).toList());
        assertTrue(result.isPresent());
        assertEquals("Increase water intake.", result.get().getNote());
    }

    @Test
    void shouldDelegateDeleteOperationsToRepository() {
        adapter.deleteById("obs-1");
        adapter.deleteAllByPatientId("patient-1");

        verify(repository).deleteById("obs-1");
        verify(repository).deleteAllByPatientId("patient-1");
    }
}

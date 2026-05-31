package com.healthcore.clinical.application.service;

import com.healthcore.clinical.application.service.support.NutritionistWeightProgressReportFactory;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressRow;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionistWeightProgressApplicationServiceTest {

    @Mock
    private ClinicalRepositoryPort repositoryPort;

    @Test
    void shouldBuildNutritionistWeightProgressReportForRange() {
        LocalDate from = LocalDate.of(2026, 5, 1);
        LocalDate to = LocalDate.of(2026, 5, 31);
        NutritionistWeightProgressApplicationService service = new NutritionistWeightProgressApplicationService(
                new PatientProfileAccessService(repositoryPort),
                new NutritionistWeightProgressReportFactory()
        );

        PatientProfile patientOne = PatientProfile.rehydrate(
                "patient-1",
                "Ana",
                "Lopez",
                null,
                71.0,
                165.0,
                LocalDate.of(1994, 3, 12),
                Gender.FEMALE,
                ActivityLevel.LIGHTLY_ACTIVE,
                "health",
                "omnivore",
                List.of(),
                List.of(),
                List.of(
                        new WeightRecord(74.0, LocalDate.of(2026, 4, 28)),
                        new WeightRecord(72.0, LocalDate.of(2026, 5, 10)),
                        new WeightRecord(71.0, LocalDate.of(2026, 5, 21))
                ),
                "nutri-123",
                null
        );
        PatientProfile patientTwo = PatientProfile.rehydrate(
                "patient-2",
                null,
                null,
                null,
                80.0,
                178.0,
                LocalDate.of(1990, 8, 2),
                Gender.MALE,
                ActivityLevel.SEDENTARY,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of(),
                List.of(new WeightRecord(80.0, LocalDate.of(2026, 4, 15))),
                "nutri-123",
                null
        );

        when(repositoryPort.findAllByNutritionistId("nutri-123")).thenReturn(List.of(patientOne, patientTwo));

        NutritionistWeightProgressReport report = service.getNutritionistWeightProgressReport("nutri-123", from, to);

        assertEquals(2, report.activePatients());
        assertEquals(1, report.patientsWithoutWeightInRange());
        assertEquals("Ana Lopez", report.rows().get(0).fullName());
        assertFalse(report.rows().get(1).hasRecordsInRange());
    }

    @Test
    void shouldRejectInvalidNutritionistWeightProgressReportRange() {
        NutritionistWeightProgressApplicationService service = new NutritionistWeightProgressApplicationService(
                new PatientProfileAccessService(repositoryPort),
                new NutritionistWeightProgressReportFactory()
        );

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.getNutritionistWeightProgressReport(
                        "nutri-123",
                        LocalDate.of(2026, 5, 31),
                        LocalDate.of(2026, 5, 1)
                )
        );

        assertEquals("Invalid report range.", exception.getMessage());
    }

    @Test
    void shouldDelegatePatientsAndRangeToReportFactory() {
        PatientProfileAccessService patientProfileAccessService = mock(PatientProfileAccessService.class);
        NutritionistWeightProgressReportFactory reportFactory = mock(NutritionistWeightProgressReportFactory.class);
        NutritionistWeightProgressApplicationService service = new NutritionistWeightProgressApplicationService(
                patientProfileAccessService,
                reportFactory
        );
        LocalDate from = LocalDate.of(2026, 5, 1);
        LocalDate to = LocalDate.of(2026, 5, 31);
        List<PatientProfile> patients = List.of(PatientProfile.rehydrate(
                "patient-1",
                "Ana",
                "Lopez",
                null,
                71.0,
                165.0,
                LocalDate.of(1994, 3, 12),
                Gender.FEMALE,
                ActivityLevel.LIGHTLY_ACTIVE,
                "health",
                "omnivore",
                List.of(),
                List.of(),
                List.of(new WeightRecord(71.0, LocalDate.of(2026, 5, 21))),
                "nutri-123",
                null
        ));
        NutritionistWeightProgressReport expectedReport = new NutritionistWeightProgressReport(
                1,
                0,
                List.of(new NutritionistWeightProgressRow(
                        "patient-1",
                        "Ana Lopez",
                        LocalDate.of(2026, 5, 21),
                        71.0,
                        71.0,
                        0.0,
                        true
                ))
        );

        when(patientProfileAccessService.findAllByNutritionistId("nutri-123")).thenReturn(patients);
        when(reportFactory.create(patients, from, to)).thenReturn(expectedReport);

        NutritionistWeightProgressReport result = service.getNutritionistWeightProgressReport("nutri-123", from, to);

        assertEquals(expectedReport, result);
        verify(patientProfileAccessService).findAllByNutritionistId("nutri-123");
        verify(reportFactory).create(patients, from, to);
    }
}

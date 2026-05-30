package com.healthcore.clinical.application.service.support;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class NutritionistWeightProgressReportFactoryTest {

    private final NutritionistWeightProgressReportFactory factory = new NutritionistWeightProgressReportFactory();

    @Test
    void shouldBuildNutritionistWeightProgressReportForRange() {
        LocalDate from = LocalDate.of(2026, 5, 1);
        LocalDate to = LocalDate.of(2026, 5, 31);

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

        NutritionistWeightProgressReport report = factory.create(List.of(patientOne, patientTwo), from, to);

        assertEquals(2, report.activePatients());
        assertEquals(1, report.patientsWithoutWeightInRange());
        assertEquals("Ana Lopez", report.rows().get(0).fullName());
        assertEquals(LocalDate.of(2026, 5, 21), report.rows().get(0).latestRecordDateInRange());
        assertEquals(-1.0, report.rows().get(0).netChangeKg());
        assertEquals("patient-2", report.rows().get(1).fullName());
        assertFalse(report.rows().get(1).hasRecordsInRange());
    }

    @Test
    void shouldRejectInvalidNutritionistWeightProgressReportRange() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> factory.create(
                        List.of(),
                        LocalDate.of(2026, 5, 31),
                        LocalDate.of(2026, 5, 1)
                )
        );

        assertEquals("Invalid report range.", exception.getMessage());
    }
}

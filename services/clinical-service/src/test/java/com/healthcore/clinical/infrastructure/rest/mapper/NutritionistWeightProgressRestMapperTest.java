package com.healthcore.clinical.infrastructure.rest.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressRow;

class NutritionistWeightProgressRestMapperTest {

    private final NutritionistWeightProgressRestMapper mapper = new NutritionistWeightProgressRestMapper();

    @Test
    void shouldMapReportToResponse() {
        NutritionistWeightProgressReport report = new NutritionistWeightProgressReport(
                2,
                1,
                List.of(
                        new NutritionistWeightProgressRow(
                                "patient-1",
                                "Ana Lopez",
                                LocalDate.of(2026, 5, 21),
                                72.0,
                                70.5,
                                -1.5,
                                true
                        ),
                        new NutritionistWeightProgressRow(
                                "patient-2",
                                "patient-2",
                                null,
                                null,
                                null,
                                null,
                                false
                        )
                )
        );

        var response = mapper.toResponse(report);

        assertEquals(2, response.activePatients());
        assertEquals(1, response.patientsWithoutWeightInRange());
        assertEquals("Ana Lopez", response.rows().getFirst().fullName());
        assertFalse(response.rows().get(1).hasRecordsInRange());
    }
}

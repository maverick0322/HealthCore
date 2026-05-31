package com.healthcore.clinical.application.service.support;

import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressRow;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Component
public class NutritionistWeightProgressReportFactory {

    public NutritionistWeightProgressReport create(List<PatientProfile> profiles, LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) {
            throw new IllegalArgumentException("Invalid report range.");
        }

        List<NutritionistWeightProgressRow> rows = profiles.stream()
                .sorted(Comparator.comparing(profile -> {
                    String fullName = profile.getFullName();
                    return fullName == null || fullName.isBlank()
                            ? profile.getUserId()
                            : fullName;
                }, String.CASE_INSENSITIVE_ORDER))
                .map(profile -> toWeightProgressRow(profile, from, to))
                .toList();

        long patientsWithoutWeightInRange = rows.stream()
                .filter(row -> !row.hasRecordsInRange())
                .count();

        return new NutritionistWeightProgressReport(
                rows.size(),
                (int) patientsWithoutWeightInRange,
                rows
        );
    }

    private NutritionistWeightProgressRow toWeightProgressRow(
            PatientProfile profile,
            LocalDate from,
            LocalDate to
    ) {
        String fullName = profile.getFullName();
        String resolvedName = fullName == null || fullName.isBlank()
                ? profile.getUserId()
                : fullName;

        List<WeightRecord> recordsInRange = profile.getWeightHistory()
                .stream()
                .filter(record -> !record.date().isBefore(from) && !record.date().isAfter(to))
                .sorted(Comparator.comparing(WeightRecord::date))
                .toList();

        if (recordsInRange.isEmpty()) {
            return new NutritionistWeightProgressRow(
                    profile.getUserId(),
                    resolvedName,
                    null,
                    null,
                    null,
                    null,
                    false
            );
        }

        WeightRecord firstRecord = recordsInRange.get(0);
        WeightRecord latestRecord = recordsInRange.get(recordsInRange.size() - 1);

        return new NutritionistWeightProgressRow(
                profile.getUserId(),
                resolvedName,
                latestRecord.date(),
                firstRecord.weightKg(),
                latestRecord.weightKg(),
                latestRecord.weightKg() - firstRecord.weightKg(),
                true
        );
    }
}

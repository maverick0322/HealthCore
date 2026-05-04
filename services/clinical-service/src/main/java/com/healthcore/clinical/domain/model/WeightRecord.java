package com.healthcore.clinical.domain.model;

import java.time.LocalDate;

public record WeightRecord(Double weightKg, LocalDate date) {
}
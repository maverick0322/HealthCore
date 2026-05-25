package com.healthcore.clinical.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

public final class ClinicalTime {
    public static final ZoneId APP_ZONE = ZoneId.of("America/Mexico_City");

    private ClinicalTime() {
    }

    public static LocalDate today() {
        return LocalDate.now(APP_ZONE);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(APP_ZONE);
    }
}

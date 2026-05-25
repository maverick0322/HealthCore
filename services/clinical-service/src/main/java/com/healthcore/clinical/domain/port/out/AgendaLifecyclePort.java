package com.healthcore.clinical.domain.port.out;

public interface AgendaLifecyclePort {
    void cancelFutureAppointmentsForUnlink(String patientId, String nutritionistId, String actor, String reason);
}

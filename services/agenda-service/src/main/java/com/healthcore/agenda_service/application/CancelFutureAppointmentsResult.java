package com.healthcore.agenda_service.application;

public record CancelFutureAppointmentsResult(int cancelledCount, int releasedSlotCount) {
}

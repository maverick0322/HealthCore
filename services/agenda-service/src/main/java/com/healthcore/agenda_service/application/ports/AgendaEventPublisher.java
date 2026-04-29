package com.healthcore.agenda_service.application.ports;

import com.healthcore.agenda_service.application.events.AppointmentCancelledEvent;
import com.healthcore.agenda_service.application.events.AppointmentConfirmedEvent;
import com.healthcore.agenda_service.application.events.AppointmentReminderEvent;

public interface AgendaEventPublisher {

    void publishAppointmentConfirmed(AppointmentConfirmedEvent event);

    void publishAppointmentCancelled(AppointmentCancelledEvent event);

    void publishAppointmentReminder(AppointmentReminderEvent event);
}

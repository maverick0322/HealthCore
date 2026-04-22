package com.healthcore.agenda_service.api;

import com.healthcore.agenda_service.api.dto.AppointmentResponse;
import com.healthcore.agenda_service.api.dto.AvailabilitySlotResponse;
import com.healthcore.agenda_service.api.dto.CreateAppointmentRequest;
import com.healthcore.agenda_service.application.CreateAppointmentCommand;
import com.healthcore.agenda_service.application.PatientAppointmentService;
import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.TimeSlot;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/agenda")
@RequiredArgsConstructor
public class PatientAgendaController {

    private final PatientAppointmentService patientAppointmentService;

    @GetMapping("/availability/{nutritionistId}")
    public List<AvailabilitySlotResponse> getAvailability(
        @PathVariable String nutritionistId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        if (from == null || to == null || !from.isBefore(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rango de fechas invalido");
        }

        return patientAppointmentService.getAvailability(nutritionistId, from, to)
            .stream()
            .map(this::toAvailabilityResponse)
            .toList();
    }

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse createAppointment(
        Authentication authentication,
        @Valid @RequestBody CreateAppointmentRequest request
    ) {
        String patientId = currentPatientId(authentication);
        Appointment created = patientAppointmentService.createAppointment(
            patientId,
            new CreateAppointmentCommand(request.slotId(), request.slotVersion())
        );
        return toAppointmentResponse(created);
    }

    @PatchMapping("/appointments/{id}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelAppointment(
        Authentication authentication,
        @PathVariable("id") String appointmentId
    ) {
        String patientId = currentPatientId(authentication);
        patientAppointmentService.cancelAppointment(patientId, appointmentId);
    }

    @GetMapping("/appointments/me")
    public List<AppointmentResponse> getMyAppointments(Authentication authentication) {
        String patientId = currentPatientId(authentication);
        return patientAppointmentService.listMyUpcomingAppointments(patientId)
            .stream()
            .map(this::toAppointmentResponse)
            .toList();
    }

    private String currentPatientId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalido o ausente");
        }
        return authentication.getName();
    }

    private AppointmentResponse toAppointmentResponse(Appointment appointment) {
        return new AppointmentResponse(
            appointment.getId(),
            appointment.getSlotId(),
            appointment.getNutritionistId(),
            appointment.getPatientId(),
            appointment.getStartTime(),
            appointment.getEndTime(),
            appointment.getStatus(),
            appointment.getVersion()
        );
    }

    private AvailabilitySlotResponse toAvailabilityResponse(TimeSlot slot) {
        return new AvailabilitySlotResponse(
            slot.getId(),
            slot.getNutritionistId(),
            slot.getStartTime(),
            slot.getEndTime(),
            slot.getOrigin(),
            slot.getVersion()
        );
    }
}
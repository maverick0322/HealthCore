package com.healthcore.agenda_service.api;

import java.time.Instant;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.healthcore.agenda_service.api.dto.AppointmentResponse;
import com.healthcore.agenda_service.api.dto.AvailabilitySlotResponse;
import com.healthcore.agenda_service.api.dto.CreateAppointmentRequest;
import com.healthcore.agenda_service.application.CreateAppointmentCommand;
import com.healthcore.agenda_service.application.PatientAppointmentService;
import com.healthcore.agenda_service.domain.Appointment;
import com.healthcore.agenda_service.domain.AppointmentStatus;
import com.healthcore.agenda_service.domain.TimeSlot;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Patient Agenda", description = "Scheduling operations for patients, including availability lookup, booking and cancellation")
@RestController
@RequestMapping("/api/v1/agenda")
@RequiredArgsConstructor
public class PatientAgendaController {

    private final PatientAppointmentService patientAppointmentService;

    @Operation(summary = "Get availability", description = "Returns the list of free slots for a nutritionist within a date range.")
    @ApiResponse(responseCode = "200", description = "Availability returned successfully")
    @ApiResponse(responseCode = "400", description = "Invalid date range")
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

    @Operation(summary = "Create appointment", description = "Books a specific slot for the authenticated patient.")
    @ApiResponse(responseCode = "201", description = "Appointment created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request payload")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "Slot not found")
    @ApiResponse(responseCode = "409", description = "Slot is already occupied or has changed")
    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse createAppointment(
        Authentication authentication,
        @Valid @RequestBody CreateAppointmentRequest request
    ) {
        String patientId = currentPatientId(authentication);
        Appointment created = patientAppointmentService.createAppointment(
            patientId,
            new CreateAppointmentCommand(request.slotId(), request.slotVersion(), request.locale())
        );
        return toAppointmentResponse(created);
    }

    @Operation(summary = "Cancel appointment", description = "Cancels an existing appointment and releases the slot.")
    @ApiResponse(responseCode = "204", description = "Appointment cancelled successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Appointment does not belong to the patient")
    @ApiResponse(responseCode = "404", description = "Appointment not found")
    @PatchMapping("/appointments/{id}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelAppointment(
        Authentication authentication,
        @PathVariable("id") String appointmentId
    ) {
        String patientId = currentPatientId(authentication);
        patientAppointmentService.cancelAppointment(patientId, appointmentId);
    }

    @Operation(summary = "Reschedule appointment", description = "Releases the current slot and books a new one for an existing appointment.")
    @ApiResponse(responseCode = "200", description = "Appointment rescheduled successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request payload")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Appointment does not belong to the patient")
    @ApiResponse(responseCode = "404", description = "Appointment or slot not found")
    @ApiResponse(responseCode = "409", description = "New slot is already occupied")
    @PutMapping("/appointments/{id}/reschedule")
    public AppointmentResponse rescheduleAppointment(
        Authentication authentication,
        @PathVariable("id") String appointmentId,
        @Valid @RequestBody com.healthcore.agenda_service.api.dto.RescheduleAppointmentRequest request
    ) {
        String patientId = currentPatientId(authentication);
        Appointment updated = patientAppointmentService.rescheduleAppointment(
            patientId,
            appointmentId,
            new CreateAppointmentCommand(request.newSlotId(), request.newSlotVersion(), request.locale())
        );
        return toAppointmentResponse(updated);
    }

    @Operation(summary = "List my appointments", description = "Returns the active or pending appointments of the authenticated patient.")
    @ApiResponse(responseCode = "200", description = "Appointments returned successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @GetMapping("/appointments/me")
    public List<AppointmentResponse> getMyAppointments(Authentication authentication) {
        String patientId = currentPatientId(authentication);
        return patientAppointmentService.listMyUpcomingAppointments(patientId)
            .stream()
            .map(this::toAppointmentResponse)
            .toList();
    }

    @Operation(summary = "List appointment history", description = "Returns appointments for the authenticated patient by date range and optional statuses, including PENDING, CONFIRMED, CANCELLED and ATTENDED.")
    @ApiResponse(responseCode = "200", description = "Appointment history returned successfully")
    @ApiResponse(responseCode = "400", description = "Invalid date range")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @GetMapping("/appointments/history")
    public List<AppointmentResponse> getMyAppointmentHistory(
        Authentication authentication,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(required = false) List<AppointmentStatus> statuses
    ) {
        if (from == null || to == null || !from.isBefore(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rango de fechas invalido");
        }
        String patientId = currentPatientId(authentication);
        return patientAppointmentService.listAppointmentHistory(patientId, from, to, statuses)
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
            appointment.getVersion(),
            appointment.getCancelledAt(),
            appointment.getCancelledBy(),
            appointment.getCancellationReason(),
            appointment.getAttendedAt()
        );
    }

    private AvailabilitySlotResponse toAvailabilityResponse(TimeSlot slot) {
        return new AvailabilitySlotResponse(
            slot.getId(),
            slot.getNutritionistId(),
            slot.getStartTime(),
            slot.getEndTime(),
            slot.getOrigin(),
            slot.getVersion(),
            slot.isReserved(),
            slot.isActive(),
            slot.getDeactivatedAt(),
            slot.getDeactivatedBy(),
            slot.getDeactivationReason()
        );
    }
}

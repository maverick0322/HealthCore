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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.Instant;
import java.util.List;

@Tag(name = "Agenda Paciente", description = "Operaciones de agenda para pacientes (consultar horarios, reservar, cancelar)")
@RestController
@RequestMapping("/api/v1/agenda")
@RequiredArgsConstructor
public class PatientAgendaController {

    private final PatientAppointmentService patientAppointmentService;

    @Operation(summary = "Consultar disponibilidad", description = "Devuelve la lista de horarios libres para un nutriólogo en un rango de fechas.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de horarios obtenida exitosamente"),
        @ApiResponse(responseCode = "400", description = "Fechas inválidas")
    })
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

    @Operation(summary = "Crear cita", description = "Reserva un horario específico para el paciente autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Cita creada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "404", description = "Horario no encontrado"),
        @ApiResponse(responseCode = "409", description = "Horario ya ocupado o modificado")
    })
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

    @Operation(summary = "Cancelar cita", description = "Cancela una cita existente y libera el horario.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Cita cancelada exitosamente"),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "403", description = "La cita no pertenece al paciente"),
        @ApiResponse(responseCode = "404", description = "Cita no encontrada")
    })
    @PatchMapping("/appointments/{id}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelAppointment(
        Authentication authentication,
        @PathVariable("id") String appointmentId
    ) {
        String patientId = currentPatientId(authentication);
        patientAppointmentService.cancelAppointment(patientId, appointmentId);
    }

    @Operation(summary = "Reprogramar cita", description = "Libera el horario actual y reserva uno nuevo para una cita existente.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Cita reprogramada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "403", description = "La cita no pertenece al paciente"),
        @ApiResponse(responseCode = "404", description = "Cita u horario no encontrados"),
        @ApiResponse(responseCode = "409", description = "Horario nuevo ya ocupado")
    })
    @org.springframework.web.bind.annotation.PutMapping("/appointments/{id}/reschedule")
    public AppointmentResponse rescheduleAppointment(
        Authentication authentication,
        @PathVariable("id") String appointmentId,
        @Valid @RequestBody com.healthcore.agenda_service.api.dto.RescheduleAppointmentRequest request
    ) {
        String patientId = currentPatientId(authentication);
        Appointment updated = patientAppointmentService.rescheduleAppointment(
            patientId,
            appointmentId,
            new CreateAppointmentCommand(request.newSlotId(), request.newSlotVersion())
        );
        return toAppointmentResponse(updated);
    }

    @Operation(summary = "Listar mis citas", description = "Devuelve las citas activas o pendientes del paciente autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de citas obtenida exitosamente"),
        @ApiResponse(responseCode = "401", description = "No autorizado")
    })
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
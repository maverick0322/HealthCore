package com.healthcore.agenda_service.api;

import com.healthcore.agenda_service.api.dto.AppointmentResponse;
import com.healthcore.agenda_service.api.dto.AvailabilitySlotResponse;
import com.healthcore.agenda_service.api.dto.GenerateSlotsRequest;
import com.healthcore.agenda_service.application.GenerateSlotsCommand;
import com.healthcore.agenda_service.application.NutritionistAvailabilityService;
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

@Tag(name = "Agenda Nutriólogo", description = "Operaciones de configuración de disponibilidad y agenda para nutriólogos")
@RestController
@RequestMapping("/api/v1/agenda/nutritionist")
@RequiredArgsConstructor
public class NutritionistAgendaController {

    private final NutritionistAvailabilityService nutritionistAvailabilityService;

    @Operation(summary = "Generar slots de disponibilidad", description = "Genera en bloque los horarios de atención (TimeSlots) para el nutriólogo autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Horarios generados exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
        @ApiResponse(responseCode = "401", description = "No autorizado")
    })
    @PostMapping("/slots/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public List<AvailabilitySlotResponse> generateSlots(
        Authentication authentication,
        @Valid @RequestBody GenerateSlotsRequest request
    ) {
        String nutritionistId = currentNutritionistId(authentication);
        return nutritionistAvailabilityService.generateTimeSlots(
            nutritionistId,
            new GenerateSlotsCommand(
                request.startDate(),
                request.endDate(),
                request.startTime(),
                request.endTime(),
                request.durationMinutes()
            )
        ).stream().map(this::toAvailabilityResponse).toList();
    }

    @Operation(summary = "Consultar mis slots", description = "Devuelve la lista de horarios que el nutriólogo ha configurado en un rango de fechas.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de horarios obtenida exitosamente"),
        @ApiResponse(responseCode = "400", description = "Rango de fechas inválido"),
        @ApiResponse(responseCode = "401", description = "No autorizado")
    })
    @GetMapping("/slots")
    public List<AvailabilitySlotResponse> getMySlots(
        Authentication authentication,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        if (from == null || to == null || !from.isBefore(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rango de fechas invalido");
        }
        String nutritionistId = currentNutritionistId(authentication);
        return nutritionistAvailabilityService.getNutritionistSlots(nutritionistId, from, to)
            .stream()
            .map(this::toAvailabilityResponse)
            .toList();
    }

    @Operation(summary = "Desactivar un slot", description = "Deshabilita un horario. Si está reservado y faltan más de 24 hrs, cancela la cita automáticamente.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Horario desactivado exitosamente"),
        @ApiResponse(responseCode = "400", description = "No se puede desactivar un horario a menos de 24 horas de ocurrir"),
        @ApiResponse(responseCode = "401", description = "No autorizado"),
        @ApiResponse(responseCode = "403", description = "El horario no pertenece al nutriólogo"),
        @ApiResponse(responseCode = "404", description = "Horario no encontrado")
    })
    @PatchMapping("/slots/{id}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateSlot(
        Authentication authentication,
        @PathVariable("id") String slotId
    ) {
        String nutritionistId = currentNutritionistId(authentication);
        nutritionistAvailabilityService.deactivateTimeSlot(nutritionistId, slotId);
    }

    @Operation(summary = "Consultar mis citas", description = "Devuelve las citas que han sido reservadas con el nutriólogo autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de citas obtenida exitosamente"),
        @ApiResponse(responseCode = "400", description = "Rango de fechas inválido"),
        @ApiResponse(responseCode = "401", description = "No autorizado")
    })
    @GetMapping("/appointments")
    public List<AppointmentResponse> getMyAppointments(
        Authentication authentication,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        if (from == null || to == null || !from.isBefore(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rango de fechas invalido");
        }
        String nutritionistId = currentNutritionistId(authentication);
        return nutritionistAvailabilityService.getNutritionistAppointments(nutritionistId, from, to)
            .stream()
            .map(this::toAppointmentResponse)
            .toList();
    }

    private String currentNutritionistId(Authentication authentication) {
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
